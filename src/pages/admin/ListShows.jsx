import { useEffect, useState } from 'react'
import Title from '../../components/admin/Title'
import dateFormat from '../../lib/dateFormat'
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppContext } from '../../context/AppContext'
import Loading from '../../components/Loading'

const ListShows = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$'
    const { axios, getToken, fetchShows } = useAppContext()
    const [shows, setShows] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [priceInput, setPriceInput] = useState('')

    const getAllShows = async () => {
        try {
            const { data } = await axios.get('/api/admin/all-shows', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                setShows(data.shows)
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const startEdit = (show) => {
        setEditingId(show._id)
        setPriceInput(String(show.showPrice))
    }

    const savePrice = async (id) => {
        const nextPrice = Number(priceInput)
        if (!nextPrice || nextPrice < 0) {
            return toast.error('Enter a valid price')
        }
        try {
            const { data } = await axios.put(`/api/admin/show/${id}`, { showPrice: nextPrice }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success('Show price updated')
                setEditingId(null)
                getAllShows()
                fetchShows()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleDelete = async (id) => {
        try {
            const { data } = await axios.delete(`/api/admin/show/${id}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success('Show deleted')
                getAllShows()
                fetchShows()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getAllShows()
    }, [])

    if (loading) return <Loading />

    return (
        <>
            <Title text1="List" text2="Shows" />

            <div className="mt-8 max-w-5xl overflow-x-auto border border-line bg-surface">
                <table className="w-full border-collapse text-nowrap">
                    <thead>
                        <tr className="border-b border-ink text-left">
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Movie name</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Show time</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Bookings</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Price</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Earnings</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {shows.map((show) => (
                            <tr key={show._id} className="border-b border-line last:border-none hover:bg-accent-soft/50">
                                <td className="min-w-45 p-4">{show.movie?.title}</td>
                                <td className="p-4 text-muted">{dateFormat(show.showDateTime)}</td>
                                <td className="p-4">{Object.keys(show.occupiedSeats || {}).length}</td>
                                <td className="p-4">
                                    {editingId === show._id ? (
                                        <div className="flex items-center gap-2">
                                            <span>{currency}</span>
                                            <input
                                                type="number"
                                                min={0}
                                                value={priceInput}
                                                onChange={(e) => setPriceInput(e.target.value)}
                                                className="w-20 border border-ink/30 bg-transparent px-2 py-1 outline-none"
                                            />
                                            <CheckIcon onClick={() => savePrice(show._id)} className="h-4 w-4 cursor-pointer text-primary" />
                                            <XIcon onClick={() => setEditingId(null)} className="h-4 w-4 cursor-pointer text-muted" />
                                        </div>
                                    ) : (
                                        `${currency}${show.showPrice}`
                                    )}
                                </td>
                                <td className="p-4">{currency}{Object.keys(show.occupiedSeats || {}).length * show.showPrice}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-4">
                                        <PencilIcon onClick={() => startEdit(show)} className="h-4 w-4 cursor-pointer hover:text-primary" />
                                        <Trash2Icon onClick={() => handleDelete(show._id)} className="h-4 w-4 cursor-pointer hover:text-accent" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {shows.length === 0 && (
                    <p className="p-10 text-center text-sm text-muted">No shows found.</p>
                )}
            </div>
        </>
    )
}

export default ListShows
