import { useState } from "react"
import ReactPlayer from 'react-player'
import { PlayCircleIcon } from 'lucide-react'
import { trailers } from '../data/trailers'

const pickFour = (list) => {
    const copy = [...list]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, 4)
}

const TrailersSection = () => {

    const [playlist] = useState(() => pickFour(trailers))
    const [currentTrailer, setCurrentTrailer] = useState(() => playlist[0])

  return (
    // This band stays dark in both themes, so the colours here are fixed on purpose.
    <section className="border-y border-line bg-[#14120F] text-[#F2EDE3]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[0.8fr_1.2fr] md:px-10">

            <div>
                <p className='text-[0.7rem] uppercase tracking-[0.3em] text-accent'>Trailers</p>
                <h2 className='mt-3 font-display text-3xl md:text-4xl'>Watch before you book</h2>

                <ul className='mt-8 border-y border-[#F2EDE3]/15'>
                    {playlist.map((trailer, index) => {
                        const isActive = trailer.videoUrl === currentTrailer.videoUrl
                        return (
                            <li key={trailer.videoUrl} className='border-b border-[#F2EDE3]/15 last:border-none'>
                                <button onClick={() => setCurrentTrailer(trailer)}
                                className={`flex w-full cursor-pointer items-center gap-4 py-3.5 text-left
                                transition ${isActive ? 'text-[#F2EDE3]' : 'text-[#F2EDE3]/55 hover:text-[#F2EDE3]'}`}>
                                    <span className='w-6 text-[0.7rem] tracking-[0.1em]'>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <img src={trailer.image} alt={trailer.title}
                                    className={`h-11 w-20 object-cover transition
                                    ${isActive ? 'opacity-100' : 'opacity-60'}`}/>
                                    <span className='flex-1 text-sm'>{trailer.title}</span>
                                    <PlayCircleIcon strokeWidth={1.6} className='h-5 w-5'/>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>

            <div className='border border-[#F2EDE3]/20 p-2'>
                <div className='aspect-video w-full'>
                    <ReactPlayer src={currentTrailer.videoUrl} controls
                    width="100%" height="100%" />
                </div>
            </div>
        </div>
    </section>
  )
}

export default TrailersSection
