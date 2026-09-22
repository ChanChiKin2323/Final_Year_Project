import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import timeFormat from '../lib/timeFormat'
import imagePath from '../lib/imagePath'

const MovieSection = () => {

    const navigate = useNavigate()
    const { shows } = useAppContext()
    const hero = shows[0]
    const sidePicks = shows.slice(1, 4)

    const tickerItems = shows.length
        ? shows.map((show) => show.title)
        : ['Now booking', 'Pick a seat', 'Late shows', 'Matinees']

    const openMovie = (id) => {
        navigate(`/movies/${id}`)
        scrollTo(0, 0)
    }

  return (
    <section className='border-b border-line bg-surface'>

        <div className='overflow-hidden border-b border-line py-3'>
            <div className='marquee-track flex w-max'>
                {[...tickerItems, ...tickerItems].map((title, index) => (
                    <span key={index} className='flex items-center gap-8 px-8 text-[0.7rem]
                    uppercase tracking-[0.3em] text-muted whitespace-nowrap'>
                        {title}
                        <span className='text-accent'>✦</span>
                    </span>
                ))}
            </div>
        </div>

        <div className='mx-auto grid max-w-7xl items-center gap-14 px-5 py-16
        md:grid-cols-[1.05fr_0.95fr] md:px-10 md:py-24'>

            <div>
                <p className='text-[0.7rem] uppercase tracking-[0.3em] text-accent'>
                    {hero ? 'This week at the marquee' : 'Welcome'}
                </p>

                <h1 className='mt-5 font-display text-5xl leading-[1.05] md:text-6xl'>
                    {hero ? hero.title : 'Your seat is waiting.'}
                </h1>

                <dl className='mt-8 grid max-w-md grid-cols-3 gap-px border border-line bg-line'>
                    <div className='bg-surface p-4'>
                        <dt className='text-[0.62rem] uppercase tracking-[0.18em] text-muted'>Year</dt>
                        <dd className='mt-1.5 text-sm'>{hero?.release_date?.split('-')[0] || '—'}</dd>
                    </div>
                    <div className='bg-surface p-4'>
                        <dt className='text-[0.62rem] uppercase tracking-[0.18em] text-muted'>Runtime</dt>
                        <dd className='mt-1.5 text-sm'>{hero?.runtime ? timeFormat(hero.runtime) : '—'}</dd>
                    </div>
                    <div className='bg-surface p-4'>
                        <dt className='text-[0.62rem] uppercase tracking-[0.18em] text-muted'>Genre</dt>
                        <dd className='mt-1.5 text-sm'>{hero?.genres?.[0]?.name || '—'}</dd>
                    </div>
                </dl>

                <p className='mt-8 max-w-lg text-sm leading-relaxed text-muted'>
                    {hero?.overview || 'Browse upcoming shows and book your seats in a few clicks.'}
                </p>

                <div className='mt-9 flex flex-wrap items-center gap-4'>
                    <button onClick={()=> hero ? openMovie(hero._id) : navigate('/movies')}
                    className='flex items-center gap-2 rounded-full bg-primary px-8 py-3.5
                    text-[0.72rem] uppercase tracking-[0.18em] text-canvas transition
                    hover:bg-primary-dull cursor-pointer'>
                        {hero ? 'Book seats' : 'Explore movies'}
                        <ArrowRight className='h-4 w-4'/>
                    </button>
                    <button onClick={()=> {navigate('/movies'); scrollTo(0,0)}}
                    className='rounded-full border border-ink px-8 py-3.5 text-[0.72rem]
                    uppercase tracking-[0.18em] transition hover:bg-ink hover:text-canvas cursor-pointer'>
                        Full schedule
                    </button>
                </div>
            </div>

            <div>
                <div className='border border-ink bg-canvas p-3'>
                    {hero && imagePath(hero.poster_path) ? (
                        <img src={imagePath(hero.poster_path)} alt={hero.title}
                        onClick={()=> openMovie(hero._id)}
                        className='aspect-[2/3] w-full cursor-pointer object-cover'/>
                    ) : (
                        <div className='grid aspect-[2/3] w-full place-items-center bg-surface'>
                            <div className='text-center'>
                                <div className='mx-auto h-20 w-20 rounded-full border-2 border-dashed border-line' />
                                <p className='mt-5 text-[0.7rem] uppercase tracking-[0.22em] text-muted'>
                                    No show scheduled yet
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {sidePicks.length > 0 && (
                    <div className='mt-3 grid grid-cols-3 gap-3'>
                        {sidePicks.map((movie) => (
                            <img key={movie._id} src={imagePath(movie.poster_path)} alt={movie.title}
                            onClick={()=> openMovie(movie._id)}
                            className='aspect-[2/3] w-full cursor-pointer border border-line object-cover
                            opacity-80 transition hover:opacity-100'/>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </section>
  )
}

export default MovieSection
