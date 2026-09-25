import { useEffect, useState } from 'react'
import Title from '../../components/admin/Title'
import dateFormat from '../../lib/dateFormat'
import { RotateCcwIcon, Trash2Icon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppContext } from '../../context/AppContext'
import Loading from '../../components/Loading'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 20

const statusStyle = (item) => {
    if (item.isRefunded) return 'border-muted text-muted'
    if (item.isPaid) return 'border-primary text-primary'
    return 'border-accent text-accent'
}

const statusLabel = (item) => {
    if (item.isRefunded) return 'Refunded'
    if (item.isPaid) return 'Paid'
    return 'Unpaid'
}

const ListBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$'
    const { axios, getToken } = useAppContext()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const pageCount = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE))
    const visibleBookings = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    useEffect(() => {
        if (page > pageCount) setPage(pageCount)
    }, [page, pageCount])

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

    const handleDelete = async (item) => {
        if (item.isPaid || item.isRefunded) {
            return toast.error('Paid bookings must be refunded, not deleted')
        }
        try {
            const { data } = await axios.delete(`/api/admin/booking/${item._id}`, {
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

    const handleRefund = async (item) => {
        try {
            const { data } = await axios.post(`/api/admin/booking/${item._id}/refund`, {}, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success(data.message)
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
                        {visibleBookings.map((item) => (
                            <tr key={item._id} className="border-b border-line last:border-none hover:bg-accent-soft/50">
                                <td className="min-w-45 p-4">{item.user?.name || 'Unknown'}</td>
                                <td className="p-4">{item.show?.movie?.title}</td>
                                <td className="p-4 text-muted">{dateFormat(item.show?.showDateTime)}</td>
                                <td className="p-4">{(item.bookedSeats || []).join(", ")}</td>
                                <td className="p-4">{currency}{item.amount}</td>
                                <td className="p-4">
                                    <span className={`border px-3 py-1 text-[0.62rem] uppercase tracking-[0.14em] ${statusStyle(item)}`}>
                                        {statusLabel(item)}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {item.isRefunded ? (
                                        <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">Closed</span>
                                    ) : item.isPaid ? (
                                        <button onClick={() => handleRefund(item)}
                                        className="flex cursor-pointer items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-accent hover:opacity-80"
                                        title="Refund to the original user">
                                            <RotateCcwIcon className="h-4 w-4" />
                                            Refund
                                        </button>
                                    ) : (
                                        <Trash2Icon onClick={() => handleDelete(item)}
                                        className="h-4 w-4 cursor-pointer hover:text-accent"
                                        title="Delete unpaid booking" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bookings.length === 0 && (
                    <p className="p-10 text-center text-sm text-muted">No bookings found.</p>
                )}
            </div>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
    )
}

export default ListBookings
