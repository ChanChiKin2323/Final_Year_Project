import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MovieCard from './MovieCard'
import { useAppContext } from '../context/AppContext'

const FeaturedSection = () => {

    const navigate = useNavigate()
    const { shows } = useAppContext()

  return (
    <section className='mx-auto max-w-7xl px-5 py-20 md:px-10'>

        <div className='flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6'>
            <div>
                <p className='text-[0.7rem] uppercase tracking-[0.3em] text-accent'>On the bill</p>
                <h2 className='mt-3 font-display text-3xl md:text-4xl'>Now showing</h2>
            </div>
            <button onClick={()=> {navigate('/movies'); scrollTo(0,0)}} className='group flex
            items-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-muted
            transition hover:text-ink cursor-pointer'>
                View all
                <ArrowRight className='h-4 w-4 transition group-hover:translate-x-0.5'/>
            </button>
        </div>

        <div className='mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {shows.length === 0 ? (
                <p className='col-span-full border border-dashed border-line p-10 text-center
                text-sm text-muted'>
                    No movies available yet. Add a show from the admin dashboard.
                </p>
            ) : shows.slice(0, 4).map((movie)=>(
                <MovieCard key={movie._id} movie={movie}/>
            ))}
        </div>

        <div className='mt-14 flex justify-center'>
            <button onClick={()=>{navigate('/movies'); scrollTo(0,0)}}
            className='rounded-full border border-ink px-10 py-3.5 text-[0.72rem]
            uppercase tracking-[0.18em] transition hover:bg-ink hover:text-canvas cursor-pointer'>
                Browse the full schedule
            </button>
        </div>
    </section>
  )
}

export default FeaturedSection
