import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { CalendarIcon, CheckIcon, DeleteIcon, PlusIcon, StarIcon } from 'lucide-react'
import kConverter from '../../lib/kConverter'
import toast from 'react-hot-toast'
import { useAppContext } from '../../context/AppContext'
import imagePath from '../../lib/imagePath'

const AddShows = () => {

    const currency = import.meta.env.VITE_CURRENCY || '$'
    const { axios, getToken, fetchShows } = useAppContext()
    const [nowPlayingMovies, setNowPlayingMovies] = useState([])
    const [selectedMovie, setSelectedMovie] = useState(null)
    const [dateTimeSelection, setDateTimeSelection] = useState({})
    const [dateTimeInput, setDateTimeInput] = useState("")
    const [showPrice, setShowPrice] = useState("")
    const [addingShow, setAddingShow] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [movieFormOpen, setMovieFormOpen] = useState(false)
    const [editingMovieId, setEditingMovieId] = useState(null)
    const [savingMovie, setSavingMovie] = useState(false)
    const [movieForm, setMovieForm] = useState({
        title: '', overview: '', releaseDate: '', runtime: '', poster: '', genre: '',
    })

    const fetchNowPlayingMovies = async () => {
        try {
            const { data } = await axios.get('/api/show/now-playing', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                setNowPlayingMovies(data.movies)
                setError('')
            } else {
                setError(data.message || 'Failed to load movies')
                toast.error(data.message)
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message
            setError(message)
            toast.error(message)
        }
        setLoading(false)
    }

    // Value for the input's `min`, in the "YYYY-MM-DDTHH:mm" shape it expects.
    const earliestDateTime = () => {
        const now = new Date()
        const pad = (n) => String(n).padStart(2, '0')
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    }

    const setMovieField = (key) => (event) => {
        setMovieForm((prev) => ({ ...prev, [key]: event.target.value }))
    }

    const closeMovieForm = () => {
        setMovieFormOpen(false)
        setEditingMovieId(null)
        setMovieForm({ title: '', overview: '', releaseDate: '', runtime: '', poster: '', genre: '' })
    }

    const openUpdate = async () => {
        if (!selectedMovie) return toast.error('Select a movie to update')
        try {
            setSavingMovie(true)
            const { data } = await axios.get(`/api/show/editable/${selectedMovie}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (!data.success) {
                toast.error(data.message)
                setSavingMovie(false)
                return
            }
            const movie = data.movie
            setMovieForm({
                title: movie.title || '',
                overview: movie.overview || '',
                releaseDate: String(movie.releaseDate || '').slice(0, 10),
                runtime: movie.runtime ? String(movie.runtime) : '',
                poster: imagePath(movie.poster),
                genre: movie.genre || '',
            })
            setEditingMovieId(selectedMovie)
            setMovieFormOpen(true)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
        setSavingMovie(false)
    }

    const saveCustomMovie = async () => {
        if (!movieForm.title.trim()) return toast.error('Title is required')
        if (!movieForm.overview.trim()) return toast.error('Overview is required')
        if (!movieForm.releaseDate) return toast.error('Release date is required')
        if (!movieForm.runtime.trim()) return toast.error('Runtime is required')
        if (!movieForm.poster.trim()) return toast.error('Poster link is required')

        try {
            setSavingMovie(true)
            const request = editingMovieId
                ? axios.put(`/api/show/editable/${editingMovieId}`, movieForm, {
                    headers: { Authorization: `Bearer ${await getToken()}` }
                })
                : axios.post('/api/show/custom', movieForm, {
                    headers: { Authorization: `Bearer ${await getToken()}` }
                })
            const { data } = await request
            if (data.success) {
                if (editingMovieId) {
                    setNowPlayingMovies((prev) => prev.map((movie) => (
                        String(movie.id) === String(data.movie.id)
                            ? {
                                ...movie,
                                title: data.movie.title,
                                poster_path: data.movie.poster_path,
                                backdrop_path: data.movie.backdrop_path,
                                release_date: data.movie.release_date,
                            }
                            : movie
                    )))
                } else {
                    setNowPlayingMovies((prev) => [data.movie, ...prev])
                    setSelectedMovie(data.movie.id)
                }
                closeMovieForm()
                setError('')
                fetchShows()
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
        setSavingMovie(false)
    }

    const handleDateTimeAdd = () => {
        if (!dateTimeInput) return
        const [date, time] = dateTimeInput.split("T")
        if (!date || !time) return

        if (new Date(dateTimeInput) <= new Date()) {
            return toast.error('Pick a date and time in the future. Past screenings are never listed.')
        }

        setDateTimeSelection((prev) => {
            const times = prev[date] || []
            if (!times.includes(time)) {
                return { ...prev, [date]: [...times, time] }
            }
            return prev
        })
    }

    const handleRemoveTime = (date, time) => {
        setDateTimeSelection((prev) => {
            const filteredTimes = prev[date].filter((t) => t !== time)
            if (filteredTimes.length === 0) {
                const { [date]: _, ...rest } = prev
                return rest
            }
            return {
                ...prev,
                [date]: filteredTimes,
            }
        })
    }

    const handleAddShow = async () => {
        if (!selectedMovie) {
            return toast.error('Please select a movie')
        }
        if (!showPrice) {
            return toast.error('Please enter a show price')
        }
        if (Object.keys(dateTimeSelection).length === 0) {
            return toast.error('Please add at least one date and time')
        }

        const showsInput = Object.entries(dateTimeSelection).map(([date, time]) => ({ date, time }))

        try {
            setAddingShow(true)
            const { data } = await axios.post('/api/show/add', {
                movieId: selectedMovie,
                showsInput,
                showPrice: Number(showPrice)
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })

            if (data.success) {
                toast.success(data.message)
                setSelectedMovie(null)
                setShowPrice("")
                setDateTimeInput("")
                setDateTimeSelection({})
                fetchShows()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setAddingShow(false)
    }

    useEffect(() => {
        fetchNowPlayingMovies()
    }, [])

    if (loading) return <Loading />

    return (
        <>
            <Title text1="Add" text2="Shows" />

            <p className="mt-8 text-[0.68rem] uppercase tracking-[0.24em] text-muted">Now playing movies</p>
            {error && nowPlayingMovies.length === 0 && (
                <p className="mt-4 max-w-2xl text-sm text-muted">{error}</p>
            )}
            <div className="mt-5 overflow-x-auto pb-4">
                <div className="group flex w-max gap-5">
                    <button type="button" onClick={() => {
                        setEditingMovieId(null)
                        setMovieForm({ title: '', overview: '', releaseDate: '', runtime: '', poster: '', genre: '' })
                        setMovieFormOpen(true)
                    }}
                    className="w-40 cursor-pointer border border-dashed border-line bg-surface text-left transition hover:border-ink">
                        <div className="grid aspect-[2/3] place-items-center">
                            <PlusIcon className="h-10 w-10" strokeWidth={1.4} />
                        </div>
                        <div className="p-3">
                            <p className="truncate text-sm">Add movie</p>
                            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.12em] text-muted">New title</p>
                        </div>
                    </button>
                    {nowPlayingMovies.map((movie) =>(
                        <div key={movie.id} onClick={()=> setSelectedMovie(movie.id)}
                        className={`w-40 cursor-pointer border bg-surface transition
                        ${selectedMovie === movie.id ? 'border-ink' : 'border-line hover:border-ink'}`}>
                            <div className="relative">
                                <img src={imagePath(movie.poster_path)} alt={movie.title}
                                className="aspect-[2/3] w-full object-cover" />
                                <div className="absolute bottom-0 left-0 flex w-full items-center
                                justify-between bg-ink/85 px-2 py-1.5 text-[0.65rem] text-canvas">
                                    <p className="flex items-center gap-1">
                                        <StarIcon className="h-3 w-3 fill-accent text-accent" />
                                        {Number(movie.vote_average).toFixed(1)}
                                    </p>
                                    <p>{kConverter(movie.vote_count)} {movie.vote_count === 1 ? 'vote' : 'votes'}</p>
                                </div>
                                {selectedMovie === movie.id && (
                                    <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center bg-primary">
                                        <CheckIcon className="h-4 w-4 text-canvas" strokeWidth={2.5} />
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="truncate text-sm">{movie.title}</p>
                                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.12em] text-muted">{movie.release_date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button type="button" disabled={!selectedMovie || savingMovie} onClick={openUpdate}
            className="mt-5 cursor-pointer border border-ink px-6 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] transition hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:opacity-40">
                Update movie
            </button>

            <div className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
                <div>
                    <label className="block text-[0.65rem] uppercase tracking-[0.18em] text-muted">Show price</label>
                    <div className="mt-2 flex items-center gap-2 border border-ink bg-surface px-3 py-2.5">
                        <p className="text-sm text-muted">{currency}</p>
                        <input min={0} type="number" value={showPrice} onChange={(e) => setShowPrice(e.target.value)}
                        placeholder="Enter show price" className="w-full bg-transparent text-sm outline-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-[0.65rem] uppercase tracking-[0.18em] text-muted">Select date and time</label>
                    <div className="mt-2 flex border border-ink bg-surface">
                        <div className="relative min-w-0 flex-1">
                            <input type="datetime-local" min={earliestDateTime()} value={dateTimeInput}
                            onChange={(e) => setDateTimeInput(e.target.value)}
                            className="relative w-full bg-transparent px-3 py-2.5 pr-9 text-sm outline-none" />
                            <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" />
                        </div>
                        <button onClick={handleDateTimeAdd} className="shrink-0 cursor-pointer bg-ink px-4
                        text-[0.65rem] uppercase tracking-[0.16em] text-canvas transition hover:bg-primary">
                            Add time
                        </button>
                    </div>
                </div>
            </div>

            {Object.keys(dateTimeSelection).length > 0 && (
                <div className="mt-8 max-w-3xl border border-line bg-surface p-5">
                    <h2 className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">Selected date-time</h2>
                    <ul className="mt-4 space-y-4">
                        {Object.entries(dateTimeSelection).map(([date, times]) => (
                            <li key={date}>
                                <div className="text-sm">{date}</div>
                                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                    {times.map((time) => (
                                        <div key={time} className="flex items-center border border-ink/30 px-2.5 py-1">
                                            <span>{time}</span>
                                            <DeleteIcon onClick={() => handleRemoveTime(date, time)} width={15}
                                            className="ml-2 cursor-pointer text-accent hover:opacity-70" />
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button disabled={addingShow} onClick={handleAddShow} className="mt-8 cursor-pointer
            rounded-full bg-primary px-10 py-3.5 text-[0.7rem] uppercase tracking-[0.18em] text-canvas
            transition hover:bg-primary-dull disabled:opacity-60">
                {addingShow ? 'Adding…' : 'Add show'}
            </button>

            {movieFormOpen && createPortal(
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
                onClick={closeMovieForm}>
                    <form className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-line bg-surface p-6"
                    onClick={(event) => event.stopPropagation()}
                    onSubmit={(event) => { event.preventDefault(); saveCustomMovie() }}>
                        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-accent">Catalogue</p>
                        <h2 className="mt-2 font-display text-2xl">{editingMovieId ? 'Update movie' : 'Add movie'}</h2>
                        <p className="mt-2 text-sm text-muted">Title, overview, release date, runtime, and a poster link are required.</p>

                        <label className="mt-4 block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                            Title
                            <input value={movieForm.title} onChange={setMovieField('title')}
                            className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
                        </label>
                        <label className="mt-3 block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                            Overview
                            <textarea value={movieForm.overview} onChange={setMovieField('overview')} rows={3}
                            className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
                        </label>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                                Release date
                                <span className="relative mt-1.5 block">
                                    <input type="date" value={movieForm.releaseDate} onChange={setMovieField('releaseDate')}
                                    className="relative w-full border border-ink bg-canvas px-3 py-2 pr-9 text-sm normal-case tracking-normal text-ink outline-none" />
                                    <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" />
                                </span>
                            </label>
                            <label className="block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                                Runtime (minutes)
                                <input type="number" min="1" value={movieForm.runtime} onChange={setMovieField('runtime')}
                                className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
                            </label>
                        </div>
                        <label className="mt-3 block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                            Poster link
                            <input value={movieForm.poster} onChange={setMovieField('poster')} placeholder="https://"
                            className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
                        </label>
                        <label className="mt-3 block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                            Genre
                            <input value={movieForm.genre} onChange={setMovieField('genre')} placeholder="Optional"
                            className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
                        </label>

                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" onClick={closeMovieForm}
                            className="cursor-pointer border border-ink px-4 py-2 text-[0.65rem] uppercase tracking-[0.16em]">
                                Cancel
                            </button>
                            <button type="submit" disabled={savingMovie}
                            className="cursor-pointer bg-primary px-4 py-2 text-[0.65rem] uppercase tracking-[0.16em] text-canvas disabled:opacity-60">
                                {savingMovie ? 'Saving…' : editingMovieId ? 'Save changes' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </>
    )
}

export default AddShows
