import { useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { CheckIcon, DeleteIcon, StarIcon } from 'lucide-react'
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

    if (error || nowPlayingMovies.length === 0) {
        return (
            <>
                <Title text1="Add" text2="Shows" />
                <div className="mt-8 max-w-2xl border border-dashed border-line bg-surface p-8">
                    <p className="font-display text-xl">{error || 'No movies loaded.'}</p>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        Add Shows needs a TMDB Read Access Token in <code>backend/.env</code> as <code>TMDB_API_KEY</code>.
                        Get it from themoviedb.org → Settings → API. Use the long token that starts with <code>eyJ</code>, then restart <code>npm run server</code>.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                        If the message says this is a customer account, add that Google email to <code>ADMIN_EMAILS</code> in <code>backend/.env</code>, then restart the server.
                    </p>
                </div>
            </>
        )
    }

    return (
        <>
            <Title text1="Add" text2="Shows" />

            <p className="mt-8 text-[0.68rem] uppercase tracking-[0.24em] text-muted">Now playing movies</p>
            <div className="mt-5 overflow-x-auto pb-4">
                <div className="group flex w-max gap-5">
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
                                    <p>{kConverter(movie.vote_count)} votes</p>
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
                        <input type="datetime-local" min={earliestDateTime()} value={dateTimeInput}
                        onChange={(e) => setDateTimeInput(e.target.value)}
                        className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" />
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
        </>
    )
}

export default AddShows
