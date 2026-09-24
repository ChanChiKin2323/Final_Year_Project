import { useEffect, useState } from "react"
import MovieCard from "../components/MovieCard"
import Pagination from "../components/Pagination"
import { useAppContext } from "../context/AppContext"

const PAGE_SIZE = 8

const Movies = () => {
  const { shows } = useAppContext()
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(shows.length / PAGE_SIZE))
  const visible = shows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  return (
    <div className='mx-auto min-h-[70vh] max-w-7xl px-5 pb-20 pt-12 md:px-10'>

      <div className='flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-6'>
        <div>
          <p className='text-[0.7rem] uppercase tracking-[0.3em] text-accent'>Schedule</p>
          <h1 className='mt-3 font-display text-4xl md:text-5xl'>Now showing</h1>
        </div>
        <p className='text-[0.7rem] uppercase tracking-[0.2em] text-muted'>
          {shows.length} {shows.length === 1 ? 'title' : 'titles'}
        </p>
      </div>

      {shows.length > 0 ? (
        <>
          <div className='mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {visible.map((movie)=>(
              <MovieCard movie={movie} key={movie._id}/>
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      ) : (
        <div className='mt-10 border border-dashed border-line px-6 py-24 text-center'>
          <h2 className='font-display text-2xl'>No movies available</h2>
          <p className='mt-3 text-sm text-muted'>Shows added from the admin dashboard will appear here.</p>
        </div>
      )}
    </div>
  )
}

export default Movies
