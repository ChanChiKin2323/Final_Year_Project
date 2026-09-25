import Booking from "../models/Booking.js"
import Notification from "../models/Notification.js"
import Show from "../models/Show.js";
import User from "../models/User.js";

export const isAdmin = async (req, res) => {
    res.json({ success: true, isAdmin: true })
}

export const getDashboardData = async (req, res) => {
    try {
        const bookings = await Booking.find({ isPaid: true, isRefunded: { $ne: true } });
        const activeShows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie');
        const totalUser = await User.countDocuments();

        res.json({
            success: true,
            dashboardData: {
                totalBookings: bookings.length,
                totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
                activeShows,
                totalUser
            }
        })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 })
        res.json({ success: true, shows })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).populate('user').populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({ createdAt: -1 })
        res.json({ success: true, bookings })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

export const updateShow = async (req, res) => {
    try {
        const { showPrice } = req.body
        const show = await Show.findByIdAndUpdate(req.params.id, { showPrice }, { new: true }).populate('movie')
        if (!show) {
            return res.json({ success: false, message: 'Show not found' })
        }
        res.json({ success: true, show })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const deleteShow = async (req, res) => {
    try {
        const show = await Show.findByIdAndDelete(req.params.id)
        if (!show) {
            return res.json({ success: false, message: 'Show not found' })
        }
        res.json({ success: true, message: 'Show deleted' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, { isPaid: req.body.isPaid }, { new: true })
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' })
        }
        res.json({ success: true, booking })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const syncOccupiedSeats = async (showId) => {
    const remaining = await Booking.find({ show: showId, isRefunded: { $ne: true } })
    const show = await Show.findById(showId)
    if (!show) return
    const occupiedSeats = {}
    remaining.forEach((item) => {
        (item.bookedSeats || []).forEach((seat) => {
            occupiedSeats[seat] = item.user
        })
    })
    show.occupiedSeats = occupiedSeats
    show.markModified('occupiedSeats')
    await show.save()
}

export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' })
        }
        if (booking.isRefunded) {
            return res.json({ success: false, message: 'Refunded bookings are already closed' })
        }
        if (booking.isPaid) {
            return res.json({ success: false, message: 'Paid bookings cannot be deleted. Refund them to the customer instead.' })
        }

        await Booking.findByIdAndDelete(booking._id)
        await syncOccupiedSeats(booking.show)

        res.json({ success: true, message: 'Booking deleted' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Sandbox refund: no money moves. The paid booking is cancelled for the
// original user and the seats go back on sale.
export const refundBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
        if (!booking) {
            return res.json({ success: false, message: 'Booking not found' })
        }
        if (booking.isRefunded) {
            return res.json({ success: false, message: 'This booking is already refunded' })
        }
        if (!booking.isPaid) {
            return res.json({ success: false, message: 'Only paid bookings can be refunded. Delete unpaid ones instead.' })
        }

        booking.isPaid = false
        booking.isRefunded = true
        booking.refundedAt = new Date()
        await booking.save()
        await syncOccupiedSeats(booking.show)

        const show = await Show.findById(booking.show).populate('movie')
        const title = show?.movie?.title || 'a screening'
        const seats = (booking.bookedSeats || []).join(', ')
        await Notification.create({
            user: booking.user,
            message: `Your booking for ${title}${seats ? ` (seats ${seats})` : ''} was refunded. HK$${booking.amount} has been returned to you.`,
        })

        res.json({ success: true, message: 'Refund issued to the original customer', booking })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
