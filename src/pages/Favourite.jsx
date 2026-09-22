import MovieCard from "../components/MovieCard"
import { useAppContext } from "../context/AppContext"

const Favourite = () => {
  const { favoriteMovies } = useAppContext()

  return (
    <div className='mx-auto min-h-[70vh] max-w-7xl px-5 pb-20 pt-12 md:px-10'>

      <div className='flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-6'>
        <div>
          <p className='text-[0.7rem] uppercase tracking-[0.3em] text-accent'>Saved</p>
          <h1 className='mt-3 font-display text-4xl md:text-5xl'>Your favourites</h1>
        </div>
        <p className='text-[0.7rem] uppercase tracking-[0.2em] text-muted'>
          {favoriteMovies.length} saved
        </p>
      </div>

      {favoriteMovies.length > 0 ? (
        <div className='mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {favoriteMovies.map((movie)=>(
            <MovieCard movie={movie} key={movie._id}/>
          ))}
        </div>
      ) : (
        <div className='mt-10 border border-dashed border-line px-6 py-24 text-center'>
          <h2 className='font-display text-2xl'>Nothing saved yet</h2>
          <p className='mt-3 text-sm text-muted'>Tap the heart on a movie page to keep it here.</p>
        </div>
      )}
    </div>
  )
}

export default Favourite
