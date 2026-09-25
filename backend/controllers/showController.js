import axios from "axios"
import { clerkClient } from "@clerk/express";
import Comment from "../models/Comment.js";
import Movie from "../models/Movie.js";
import Rating from "../models/Rating.js";
import Show from "../models/Show.js";
import User from "../models/User.js";

const blendScore = (baseAverage, baseCount, localPoints, localCount) => {
    const count = baseCount + localCount
    const score = count === 0 ? 0 : (baseAverage * baseCount + localPoints) / count
    return {
        score: Number(score.toFixed(1)),
        count,
    }
}

let nowPlayingCache = { at: 0, byId: new Map() }

const nowPlayingById = async () => {
    if (Date.now() - nowPlayingCache.at < 60_000 && nowPlayingCache.byId.size > 0) {
        return nowPlayingCache.byId
    }
    const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
        headers: tmdbHeaders()
    })
    const byId = new Map((data.results || []).map((item) => [String(item.id), item]))
    nowPlayingCache = { at: Date.now(), byId }
    return byId
}

const catalogueBase = async (movie) => {
    if (!movie || String(movie._id).startsWith('local-')) {
        return { average: 0, count: 0 }
    }

    if (process.env.TMDB_API_KEY) {
        try {
            const listed = (await nowPlayingById()).get(String(movie._id))
            if (listed) {
                const average = Number(listed.vote_average) || 0
                const count = Number(listed.vote_count) || 0
                await Movie.updateOne({ _id: movie._id }, {
                    catalogue_vote_average: average,
                    catalogue_vote_count: count,
                })
                return { average, count }
            }
        } catch (error) {
            console.error(error.message)
        }
    }

    const raw = await Movie.collection.findOne(
        { _id: movie._id },
        { projection: { catalogue_vote_average: 1, catalogue_vote_count: 1 } }
    )
    if (raw && Object.prototype.hasOwnProperty.call(raw, 'catalogue_vote_count')) {
        return {
            average: Number(raw.catalogue_vote_average) || 0,
            count: Number(raw.catalogue_vote_count) || 0,
        }
    }

    let data
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${movie._id}`, {
            headers: tmdbHeaders()
        })
        data = response.data
    } catch (error) {
        console.error(error.message)
        return null
    }
    const average = Number(data.vote_average) || 0
    const count = Number(data.vote_count) || 0
    await Movie.updateOne({ _id: movie._id }, {
        catalogue_vote_average: average,
        catalogue_vote_count: count,
    })
    return { average, count }
}

const ratingSummary = async (movieId, userId) => {
    const ratings = await Rating.find({ movie: movieId })
    const localCount = ratings.length
    const localPoints = ratings.reduce((sum, item) => sum + item.stars * 2, 0)
    const mine = userId ? ratings.find((item) => item.user === userId)?.stars || 0 : 0
    const movie = await Movie.findById(movieId)
    const base = await catalogueBase(movie)
    if (!base) {
        return {
            score: Number(movie?.vote_average || 0),
            count: localCount,
            mine,
        }
    }
    const blended = blendScore(base.average, base.count, localPoints, localCount)
    if (movie && movie.vote_average !== blended.score) {
        movie.vote_average = blended.score
        await movie.save()
    }
    return {
        score: blended.score,
        count: blended.count,
        mine,
    }
}

const saveRating = async (movieId, userId, stars) => {
    await Rating.findOneAndUpdate(
        { user: userId, movie: movieId },
        { stars },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    return ratingSummary(movieId, userId)
}

const commenterProfile = async (userId) => {
    const saved = await User.findById(userId)
    if (saved?.name) {
        return { name: saved.name, image: saved.image || '' }
    }
    try {
        const clerkUser = await clerkClient.users.getUser(userId)
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Guest'
        return { name, image: clerkUser.imageUrl || '' }
    } catch {
        return { name: 'Guest', image: '' }
    }
}

const listComments = async (movieId, userId) => {
    const comments = await Comment.find({ movie: movieId }).sort({ updatedAt: -1 })
    return comments.map((comment) => ({
        _id: comment._id,
        text: comment.text,
        stars: comment.stars,
        name: comment.name,
        image: comment.image,
        createdAt: comment.createdAt,
        mine: Boolean(userId) && comment.user === userId,
    }))
}

const tmdbHeaders = () => ({
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`
})

const addLocalVotes = async (movies) => {
    const ids = [...new Set(movies.map((movie) => String(movie.id)))]
    if (ids.length === 0) return movies
    const rows = await Rating.aggregate([
        { $match: { movie: { $in: ids } } },
        { $group: { _id: '$movie', count: { $sum: 1 }, points: { $sum: { $multiply: ['$stars', 2] } } } },
    ])
    const totals = new Map(rows.map((row) => [String(row._id), row]))
    return movies.map((movie) => {
        const local = totals.get(String(movie.id))
        if (!local?.count) return movie
        const blended = blendScore(
            Number(movie.vote_average) || 0,
            Number(movie.vote_count) || 0,
            local.points,
            local.count
        )
        return { ...movie, vote_average: blended.score, vote_count: blended.count }
    })
}

const customMovieCards = async () => {
    const saved = await Movie.find({ _id: /^local-/ }).sort({ createdAt: -1 })
    const ids = saved.map((movie) => String(movie._id))
    const counts = ids.length === 0 ? [] : await Rating.aggregate([
        { $match: { movie: { $in: ids } } },
        { $group: { _id: '$movie', count: { $sum: 1 } } },
    ])
    const countByMovie = new Map(counts.map((row) => [String(row._id), row.count]))
    return saved.map((movie) => ({
        id: movie._id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average || 0,
        vote_count: countByMovie.get(String(movie._id)) || 0,
    }))
}

export const getNowPlayingMovies = async (req, res) => {
    try {
        const custom = await customMovieCards()
        if (!process.env.TMDB_API_KEY) {
            if (custom.length > 0) {
                return res.json({ success: true, movies: custom })
            }
            return res.json({ success: false, message: "TMDB_API_KEY is missing in backend/.env" })
        }

        const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
            headers: tmdbHeaders()
        })

        res.json({ success: true, movies: [...custom, ...await addLocalVotes(data.results)] })
    } catch (error) {
        console.error(error);
        const custom = await customMovieCards().catch(() => [])
        if (custom.length > 0) {
            return res.json({ success: true, movies: custom })
        }
        res.json({ success: false, message: error.message })
    }
}

export const createCustomMovie = async (req, res) => {
    try {
        const title = String(req.body.title || '').trim()
        const overview = String(req.body.overview || '').trim()
        const releaseDate = String(req.body.releaseDate || '').trim()
        const runtime = Number(req.body.runtime)
        const poster = String(req.body.poster || '').trim()
        const genre = String(req.body.genre || '').trim()

        if (title.length < 1) {
            return res.json({ success: false, message: 'Title is required' })
        }
        if (overview.length < 1) {
            return res.json({ success: false, message: 'Overview is required' })
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
            return res.json({ success: false, message: 'Release date is required' })
        }
        if (!Number.isFinite(runtime) || runtime < 1) {
            return res.json({ success: false, message: 'Runtime must be at least 1 minute' })
        }
        if (!/^https?:\/\//i.test(poster)) {
            return res.json({ success: false, message: 'Poster must be an image link starting with http' })
        }

        const movie = await Movie.create({
            _id: `local-${Date.now()}`,
            title,
            overview,
            poster_path: poster,
            backdrop_path: poster,
            release_date: releaseDate,
            original_language: 'en',
            tagline: '',
            genres: [{ name: genre || 'Feature' }],
            casts: [],
            vote_average: 0,
            runtime,
        })

        res.json({
            success: true,
            message: 'Movie added',
            movie: {
                id: movie._id,
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                vote_average: 0,
                vote_count: 0,
            },
        })
    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

export const addShow = async (req, res) => {
    try {
        const movieId = String(req.body.movieId)
        const { showsInput, showPrice } = req.body

        if (!movieId || !showsInput || !showPrice) {
            return res.json({ success: false, message: "movieId, showsInput and showPrice are required" })
        }

        // Every listing query only returns upcoming shows, so a past one would save
        // and then be invisible everywhere.
        const now = new Date()
        const hasPastShow = showsInput.some((show) =>
            show.time.some((time) => new Date(`${show.date}T${time}`) <= now)
        )
        if (hasPastShow) {
            return res.json({
                success: false,
                message: "Show date and time must be in the future. Past screenings are never listed."
            })
        }

        let movie = await Movie.findById(movieId)

        if (!movie) {
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    headers: tmdbHeaders()
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers: tmdbHeaders()
                })
            ]);

            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;

            movie = await Movie.create({
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                catalogue_vote_average: movieApiData.vote_average,
                catalogue_vote_count: movieApiData.vote_count || 0,
                runtime: movieApiData.runtime,
            });
        }

        const showsToCreate = [];
        showsInput.forEach((show) => {
            show.time.forEach((time) => {
                showsToCreate.push({
                    movie: movieId,
                    showDateTime: new Date(`${show.date}T${time}`),
                    showPrice,
                    occupiedSeats: {}
                })
            })
        })

        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
        }

        res.json({ success: true, message: 'Show Added successfully.' })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

export const voteMovie = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        const stars = Number(req.body.stars)
        const movieId = String(req.params.movieId)

        if (!userId) {
            return res.json({ success: false, message: 'Sign in to rate this film' })
        }
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            return res.json({ success: false, message: 'Choose a rating from 1 to 5 stars' })
        }

        const movie = await Movie.findById(movieId)
        if (!movie) {
            return res.json({ success: false, message: 'Movie not found' })
        }

        const rating = await saveRating(movieId, userId, stars)
        await Comment.updateOne({ user: userId, movie: movieId }, { stars })
        const comments = await listComments(movieId, userId)

        res.json({ success: true, message: 'Rating saved', rating, comments })
    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

export const addComment = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        const movieId = String(req.params.movieId)
        const text = String(req.body.text || '').trim()
        const stars = Number(req.body.stars)

        if (!userId) {
            return res.json({ success: false, message: 'Sign in to comment' })
        }
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            return res.json({ success: false, message: 'Choose a rating from 1 to 5 stars' })
        }
        if (text.length < 1) {
            return res.json({ success: false, message: 'Write how this film felt' })
        }
        if (text.length > 400) {
            return res.json({ success: false, message: 'Comment must be 400 characters or fewer' })
        }

        const movie = await Movie.findById(movieId)
        if (!movie) {
            return res.json({ success: false, message: 'Movie not found' })
        }

        const profile = await commenterProfile(userId)
        await Comment.findOneAndUpdate(
            { user: userId, movie: movieId },
            { text, stars, name: profile.name, image: profile.image },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        const rating = await saveRating(movieId, userId, stars)
        const comments = await listComments(movieId, userId)
        res.json({ success: true, message: 'Comment saved', rating, comments })
    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 });

        const uniqueMovies = new Map()
        shows.forEach((show) => {
            if (show.movie && !uniqueMovies.has(show.movie._id)) {
                uniqueMovies.set(show.movie._id, show.movie)
            }
        })

        const movies = Array.from(uniqueMovies.values())
        await Promise.all(movies.map(async (movie) => {
            const rating = await ratingSummary(movie._id)
            movie.vote_average = rating.score
        }))

        res.json({ success: true, shows: movies })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } })
        const movie = await Movie.findById(movieId);
        const dateTime = {};

        // Group by the local calendar date the admin entered, not the UTC one,
        // otherwise an evening show lands on the previous day for UTC+ timezones.
        const toLocalDateKey = (value) => {
            const year = value.getFullYear()
            const month = String(value.getMonth() + 1).padStart(2, '0')
            const day = String(value.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }

        shows.forEach((show) => {
            const date = toLocalDateKey(show.showDateTime);
            if (!dateTime[date]) {
                dateTime[date] = []
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id, showPrice: show.showPrice })
        })

        const userId = req.auth?.()?.userId
        const rating = await ratingSummary(movieId, userId)
        const comments = await listComments(movieId, userId)
        res.json({ success: true, movie, dateTime, rating, comments })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
