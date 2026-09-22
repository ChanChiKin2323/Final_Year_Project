import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Heart, PlayCircleIcon, StarIcon } from "lucide-react"
import timeFormat from "../lib/timeFormat"
import DataSelect from "../components/DateSelect"
import { useAppContext } from "../context/AppContext"
import imagePath from "../lib/imagePath"
import MovieCard from "../components/MovieCard"
import toast from "react-hot-toast"
import Loading from "../components/Loading"

const MovieDetails = () => {
  const {id} = useParams()
  const [show, setShow] = useState(null)
  const { axios, shows, user, getToken, favoriteMovies, fetchFavoriteMovies } = useAppContext()

  const getShow = async ()=>{
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      if (data.success && data.movie) {
        setShow({
          movie: data.movie,
          dateTime: data.dateTime
        })
      } else {
        setShow(false)
      }
    } catch (error) {
      console.error(error)
      setShow(false)
    }
  }

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error('Please login to proceed')
      const { data } = await axios.post('/api/user/update-favorite', { movieId: id }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        await fetchFavoriteMovies()
        toast.success(data.message)
      }
    } catch (error) {
      console.error(error)
    }
  }

useEffect(()=>{
  getShow()
},[id])

  const isFavorite = favoriteMovies.find(movie => movie._id === id)

  return show ? (
    <div className='mx-auto max-w-7xl px-5 pb-20 pt-12 md:px-10'>

      <div className='grid gap-10 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]'>

        <div className='h-max md:sticky md:top-28'>
          <img src={imagePath(show.movie.poster_path)} alt={show.movie.title}
          className='w-full border border-ink object-cover'/>

          <button onClick={handleFavorite} className='mt-3 flex w-full cursor-pointer items-center
          justify-center gap-2 border border-ink py-3 text-[0.7rem] uppercase tracking-[0.18em]
          transition hover:bg-ink hover:text-canvas'>
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-accent text-accent' : ''}`}/>
            {isFavorite ? 'Saved' : 'Save to favourites'}
          </button>
        </div>

        <div>
          <p className='text-[0.7rem] uppercase tracking-[0.3em] text-accent'>English · Feature</p>
          <h1 className='mt-4 font-display text-4xl leading-[1.08] md:text-5xl'>{show.movie.title}</h1>

          <div className='mt-4 flex items-center gap-2 text-sm text-muted'>
            <StarIcon className='h-4 w-4 fill-accent text-accent'/>
            {Number(show.movie.vote_average).toFixed(1)} user rating
          </div>

          <dl className='mt-8 grid max-w-2xl grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3'>
            <div className='bg-canvas p-4'>
              <dt className='text-[0.62rem] uppercase tracking-[0.18em] text-muted'>Runtime</dt>
              <dd className='mt-1.5 text-sm'>{timeFormat(show.movie.runtime)}</dd>
            </div>
            <div className='bg-canvas p-4'>
              <dt className='text-[0.62rem] uppercase tracking-[0.18em] text-muted'>Released</dt>
              <dd className='mt-1.5 text-sm'>{show.movie.release_date?.split("-")[0]}</dd>
            </div>
            <div className='col-span-2 bg-canvas p-4 sm:col-span-1'>
              <dt className='text-[0.62rem] uppercase tracking-[0.18em] text-muted'>Genres</dt>
              <dd className='mt-1.5 text-sm'>{(show.movie.genres || []).map(genre => genre.name).join(", ")}</dd>
            </div>
          </dl>

          <p className='mt-8 max-w-2xl text-sm leading-relaxed text-muted'>{show.movie.overview}</p>

          <div className='mt-9 flex flex-wrap items-center gap-4'>
            <a href="#dataSelect" className='rounded-full bg-primary px-10 py-3.5 text-[0.72rem]
            uppercase tracking-[0.18em] text-canvas transition hover:bg-primary-dull cursor-pointer'>
              Buy tickets
            </a>
            <button className='flex items-center gap-2 rounded-full border border-ink px-8 py-3.5
            text-[0.72rem] uppercase tracking-[0.18em] transition hover:bg-ink hover:text-canvas
            cursor-pointer'>
              <PlayCircleIcon className='h-4 w-4'/>
              Watch trailer
            </button>
          </div>
        </div>
      </div>

      {(show.movie.casts || []).length > 0 && (
        <>
          <p className='mt-20 border-b border-line pb-4 text-[0.7rem] uppercase tracking-[0.24em] text-muted'>
            Cast
          </p>
          <div className='no-scrollbar mt-8 overflow-x-auto pb-4'>
            <div className='flex w-max items-start gap-8'>
              {show.movie.casts.slice(0,12).map((cast,index)=>(
                <div key={index} className='w-24 text-center'>
                  <img src={imagePath(cast.profile_path)} alt={cast.name}
                  className='aspect-square h-20 w-20 border border-line object-cover'/>
                  <p className='mt-3 text-xs leading-snug'>{cast.name}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <DataSelect dateTime={show.dateTime} id={id}/>

      <p className='mt-20 border-b border-line pb-4 text-[0.7rem] uppercase tracking-[0.24em] text-muted'>
        You may also like
      </p>
      <div className='mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {shows.filter((movie) => movie._id !== id).slice(0, 4).map((movie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>

    </div>
  ) : show === false ? (
    <div className='mx-auto max-w-7xl px-5 py-32 md:px-10'>
      <div className='border border-dashed border-line px-6 py-24 text-center'>
        <h1 className='font-display text-3xl'>Movie not found</h1>
        <p className='mt-3 text-sm text-muted'>The admin dashboard is at /admin, not /movies/admin.</p>
      </div>
    </div>
  ) : <Loading />
}

export default MovieDetails
