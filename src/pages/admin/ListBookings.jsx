import Title from '../../components/admin/Title'
import dateFormat from '../../lib/dateFormat'
import { useAdmin } from '../../context/AdminContext'
import { Trash2Icon } from 'lucide-react'
import toast from 'react-hot-toast'

const ListBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$'
    const { bookings, toggleBookingPaid, deleteBooking } = useAdmin()

    const handleDelete = (id) => {
        deleteBooking(id)
        toast.success('Booking deleted')
    }

    return (
        <>
            <Title text1="List" text2="Bookings" />
            <div className="max-w-4xl mt-6 overflow-x-auto">
                <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
                    <thead>
                        <tr className="bg-primary/20 text-left text-white">
                            <th className="p-2 font-medium pl-5">User Name</th>
                            <th className="p-2 font-medium">Movie Name</th>
                            <th className="p-2 font-medium">Show Time</th>
                            <th className="p-2 font-medium">Seats</th>
                            <th className="p-2 font-medium">Amount</th>
                            <th className="p-2 font-medium">Status</th>
                            <th className="p-2 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-light">
                        {bookings.map((item) => (
                            <tr key={item._id} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
                                <td className="p-2 min-w-45 pl-5">{item.user.name}</td>
                                <td className="p-2">{item.show.movie.title}</td>
                                <td className="p-2">{dateFormat(item.show.showDateTime)}</td>
                                <td className="p-2">{item.bookedSeats.join(", ")}</td>
                                <td className="p-2">{currency}{item.amount}</td>
                                <td className="p-2">
                                    <button
                                        onClick={() => toggleBookingPaid(item._id)}
                                        className={`px-3 py-1 rounded-full text-xs cursor-pointer ${item.isPaid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                                    >
                                        {item.isPaid ? 'Paid' : 'Unpaid'}
                                    </button>
                                </td>
                                <td className="p-2">
                                    <Trash2Icon onClick={() => handleDelete(item._id)} className="w-4 h-4 cursor-pointer hover:text-red-500" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bookings.length === 0 && (
                    <p className="text-gray-400 mt-6">No bookings found.</p>
                )}
            </div>
        </>
    )
}

export default ListBookings
