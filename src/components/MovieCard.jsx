import { StarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom"
import timeFormat from "../lib/timeFormat";
import imagePath from "../lib/imagePath";

const MovieCard = ({movie}) => {

    const navigate = useNavigate()

    const openMovie = () => {
        navigate(`/movies/${movie._id}`)
        scrollTo(0, 0)
    }

    const poster = imagePath(movie.poster_path || movie.backdrop_path)

  return (
    <article className='group flex w-full flex-col border border-line bg-surface transition
    duration-300 hover:border-ink'>

        <button onClick={openMovie} className='relative block aspect-[2/3] w-full
        cursor-pointer overflow-hidden bg-line'>
            {poster ? (
                <img src={poster} alt={movie.title} className='h-full w-full object-cover
                transition duration-500 group-hover:scale-[1.04]' />
            ) : (
                <span className='grid h-full w-full place-items-center font-display text-4xl text-muted'>
                    {movie.title?.[0]}
                </span>
            )}

            <span className='absolute left-0 top-4 flex items-center gap-1 bg-ink px-2.5 py-1
            text-[0.7rem] text-canvas'>
                <StarIcon className="h-3 w-3 fill-accent text-accent"/>
                {Number(movie.vote_average).toFixed(1)}
            </span>
        </button>

        <div className='flex flex-1 flex-col gap-3 p-4'>
            <h3 className='font-display text-lg leading-snug'>{movie.title}</h3>

            <p className="text-[0.7rem] uppercase tracking-[0.12em] text-muted">
                {new Date(movie.release_date).getFullYear()} · {(movie.genres || []).slice(0,2).map(genre => genre.name).join(" / ")} · {timeFormat(movie.runtime)}
            </p>

            <button onClick={openMovie} className='mt-auto w-full cursor-pointer border border-ink
            py-2.5 text-[0.7rem] uppercase tracking-[0.18em] transition hover:bg-ink hover:text-canvas'>
                Buy tickets
            </button>
        </div>

    </article>
  )
}

export default MovieCard
