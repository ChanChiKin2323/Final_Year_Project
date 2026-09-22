import { useEffect, useState } from 'react'
import Title from '../../components/admin/Title'
import dateFormat from '../../lib/dateFormat'
import { Trash2Icon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppContext } from '../../context/AppContext'
import Loading from '../../components/Loading'

const ListBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$'
    const { axios, getToken } = useAppContext()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    const getAllBookings = async () => {
        try {
            const { data } = await axios.get('/api/admin/all-bookings', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                setBookings(data.bookings)
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const handleTogglePaid = async (item) => {
        try {
            const { data } = await axios.put(`/api/admin/booking/${item._id}`, { isPaid: !item.isPaid }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                getAllBookings()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleDelete = async (id) => {
        try {
            const { data } = await axios.delete(`/api/admin/booking/${id}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success('Booking deleted')
                getAllBookings()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getAllBookings()
    }, [])

    if (loading) return <Loading />

    return (
        <>
            <Title text1="List" text2="Bookings" />

            <div className="mt-8 max-w-5xl overflow-x-auto border border-line bg-surface">
                <table className="w-full border-collapse text-nowrap">
                    <thead>
                        <tr className="border-b border-ink text-left">
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">User name</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Movie name</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Show time</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Seats</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Amount</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Status</th>
                            <th className="p-4 text-[0.62rem] font-normal uppercase tracking-[0.16em] text-muted">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {bookings.map((item) => (
                            <tr key={item._id} className="border-b border-line last:border-none hover:bg-accent-soft/50">
                                <td className="min-w-45 p-4">{item.user?.name || 'Unknown'}</td>
                                <td className="p-4">{item.show?.movie?.title}</td>
                                <td className="p-4 text-muted">{dateFormat(item.show?.showDateTime)}</td>
                                <td className="p-4">{(item.bookedSeats || []).join(", ")}</td>
                                <td className="p-4">{currency}{item.amount}</td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleTogglePaid(item)}
                                        className={`cursor-pointer border px-3 py-1 text-[0.62rem] uppercase tracking-[0.14em]
                                        ${item.isPaid ? 'border-primary text-primary' : 'border-accent text-accent'}`}
                                    >
                                        {item.isPaid ? 'Paid' : 'Unpaid'}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <Trash2Icon onClick={() => handleDelete(item._id)} className="h-4 w-4 cursor-pointer hover:text-accent" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bookings.length === 0 && (
                    <p className="p-10 text-center text-sm text-muted">No bookings found.</p>
                )}
            </div>
        </>
    )
}

export default ListBookings
