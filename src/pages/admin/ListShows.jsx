import { useState } from 'react'
import Title from '../../components/admin/Title'
import dateFormat from '../../lib/dateFormat'
import { useAdmin } from '../../context/AdminContext'
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const ListShows = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$'
    const { shows, updateShow, deleteShow } = useAdmin()
    const [editingId, setEditingId] = useState(null)
    const [priceInput, setPriceInput] = useState('')

    const startEdit = (show) => {
        setEditingId(show._id)
        setPriceInput(String(show.showPrice))
    }

    const savePrice = (id) => {
        const nextPrice = Number(priceInput)
        if (!nextPrice || nextPrice < 0) {
            return toast.error('Enter a valid price')
        }
        updateShow(id, { showPrice: nextPrice })
        setEditingId(null)
        toast.success('Show price updated')
    }

    const handleDelete = (id) => {
        deleteShow(id)
        toast.success('Show deleted')
    }

    return (
        <>
            <Title text1="List" text2="Shows" />
            <div className="max-w-4xl mt-6 overflow-x-auto">
                <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
                    <thead>
                        <tr className="bg-primary/20 text-left text-white">
                            <th className="p-2 font-medium pl-5">Movie Name</th>
                            <th className="p-2 font-medium">Show Time</th>
                            <th className="p-2 font-medium">Total Bookings</th>
                            <th className="p-2 font-medium">Price</th>
                            <th className="p-2 font-medium">Earnings</th>
                            <th className="p-2 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-light">
                        {shows.map((show) => (
                            <tr key={show._id} className="border-b border-primary/10 bg-primary/5 even:bg-primary/10">
                                <td className="p-2 min-w-45 pl-5">{show.movie.title}</td>
                                <td className="p-2">{dateFormat(show.showDateTime)}</td>
                                <td className="p-2">{Object.keys(show.occupiedSeats || {}).length}</td>
                                <td className="p-2">
                                    {editingId === show._id ? (
                                        <div className="flex items-center gap-2">
                                            <span>{currency}</span>
                                            <input
                                                type="number"
                                                min={0}
                                                value={priceInput}
                                                onChange={(e) => setPriceInput(e.target.value)}
                                                className="w-20 bg-transparent border border-primary/40 rounded px-2 py-1 outline-none"
                                            />
                                            <CheckIcon onClick={() => savePrice(show._id)} className="w-4 h-4 cursor-pointer text-green-400" />
                                            <XIcon onClick={() => setEditingId(null)} className="w-4 h-4 cursor-pointer text-gray-400" />
                                        </div>
                                    ) : (
                                        `${currency}${show.showPrice}`
                                    )}
                                </td>
                                <td className="p-2">{currency}{Object.keys(show.occupiedSeats || {}).length * show.showPrice}</td>
                                <td className="p-2">
                                    <div className="flex items-center gap-3">
                                        <PencilIcon onClick={() => startEdit(show)} className="w-4 h-4 cursor-pointer hover:text-primary" />
                                        <Trash2Icon onClick={() => handleDelete(show._id)} className="w-4 h-4 cursor-pointer hover:text-red-500" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {shows.length === 0 && (
                    <p className="text-gray-400 mt-6">No shows found.</p>
                )}
            </div>
        </>
    )
}

export default ListShows
