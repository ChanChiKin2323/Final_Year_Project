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

    const handleDateTimeAdd = () => {
        if (!dateTimeInput) return
        const [date, time] = dateTimeInput.split("T")
        if (!date || !time) return

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
                <p className="mt-10 text-gray-300 max-w-xl">
                    {error || 'No movies loaded.'}
                </p>
                <p className="mt-4 text-sm text-gray-400 max-w-xl">
                    Add Shows needs a TMDB Read Access Token in <code>backend/.env</code> as <code>TMDB_API_KEY</code>.
                    Get it from themoviedb.org → Settings → API. Use the long token that starts with <code>eyJ</code>, then restart <code>npm run server</code>.
                </p>
                <p className="mt-2 text-sm text-gray-400 max-w-xl">
                    If the message is &quot;not authorized&quot;, open Clerk Dashboard → Users → your account → Metadata → Private, and set <code>{`{ "role": "admin" }`}</code>.
                </p>
            </>
        )
    }

    return (
        <>
            <Title text1="Add" text2="Shows" />
            <p className="mt-10 text-lg font-medium">Now Playing Movies</p>
            <div className="overflow-x-auto pb-4">
                <div className="group flex flex-wrap gap-4 mt-4 w-max">
                    {nowPlayingMovies.map((movie) =>(
                        <div key={movie.id} className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300 `} onClick={()=> setSelectedMovie(movie.id)}>
                            <div className="relative rounded-lg overflow-hidden">
                                <img src={imagePath(movie.poster_path)} alt="" className="w-full object-cover brightness-90" />
                                <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                                    <p className="flex items-center gap-1 text-gray-400">
                                        <StarIcon className="w-4 h-4 text-primary fill-primary" />
                                        {Number(movie.vote_average).toFixed(1)}
                                    </p>
                                    <p className="text-gray-300">{kConverter(movie.vote_count)} Votes</p>
                                </div>
                            </div>
                            {selectedMovie === movie.id && (
                                <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                                    <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </div>
                            )}
                            <p className="font-medium truncate">{movie.title}</p>
                            <p className="text-gray-400 text-sm">{movie.release_date}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                <label className="block text-sm font-medium mb-2">Show Price</label>
                <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
                    <p className="text-gray-400 text-sm">{currency}</p>
                    <input min={0} type="number" value={showPrice} onChange={(e) => setShowPrice(e.target.value)} placeholder="Enter show price" className="outline-none" />
                </div>
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Select Date and Time</label>
                <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
                    <input type="datetime-local" value={dateTimeInput} onChange={(e) => setDateTimeInput(e.target.value)} className="outline-none rounded-md" />
                    <button onClick={handleDateTimeAdd} className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer">
                        Add Time
                    </button>
                </div>
            </div>

            {Object.keys(dateTimeSelection).length > 0 && (
                <div className="mt-6">
                    <h2 className="mb-2">Selected Date-Time</h2>
                    <ul className="space-y-3">
                        {Object.entries(dateTimeSelection).map(([date, times]) => (
                            <li key={date}>
                                <div className="font-medium">{date}</div>
                                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                                    {times.map((time) => (
                                        <div key={time} className="border border-primary px-2 py-1 flex items-center rounded">
                                            <span>{time}</span>
                                            <DeleteIcon onClick={() => handleRemoveTime(date, time)} width={15} className="ml-2 text-red-500 hover:text-red-700 cursor-pointer" />
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <button disabled={addingShow} onClick={handleAddShow} className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer">
                Add Show
            </button>
        </>
    )
}

export default AddShows
