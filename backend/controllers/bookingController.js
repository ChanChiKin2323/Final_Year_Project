import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js"
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId)
        if (!showData) return false;

        const occupiedSeats = showData.occupiedSeats;
        return !selectedSeats.some((seat) => occupiedSeats[seat]);
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

export const createBooking = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId || req.body.userId
        const { showId, selectedSeats } = req.body;

        if (!userId) {
            return res.json({ success: false, message: "User is required. Sign in first." })
        }
        if (!showId || !selectedSeats?.length) {
            return res.json({ success: false, message: "showId and selectedSeats are required" })
        }

        const isAvailable = await checkSeatsAvailability(showId, selectedSeats)
        if (!isAvailable) {
            return res.json({ success: false, message: "Selected Seats are not available." })
        }

        const showData = await Show.findById(showId).populate('movie');
        if (!showData) {
            return res.json({ success: false, message: "Show not found" })
        }

        const user = await User.findById(userId)
        if (!user) {
            let name = req.body.userName
            let email = req.body.userEmail
            let image = req.body.userImage
            try {
                const clerkUser = await clerkClient.users.getUser(userId)
                const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
                name = name || fullName || clerkUser.username
                email = email || clerkUser.emailAddresses?.[0]?.emailAddress
                image = image || clerkUser.imageUrl
            } catch (error) {
                console.log('Clerk profile lookup skipped:', error.message)
            }
            const savedEmail = email || `${userId}@guest.local`
            await User.create({
                _id: userId,
                name: name || "Guest User",
                email: savedEmail,
                image: image || "https://via.placeholder.com/100",
                role: 'user',
            })
        }

        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        })

        selectedSeats.forEach((seat) => {
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats');
        await showData.save();

        try {
            await inngest.send({
                name: "app/checkpayment",
                data: { bookingId: booking._id.toString() }
            })
        } catch (error) {
            console.log('Inngest event skipped:', error.message)
        }

        res.json({ success: true, message: 'Booked successfully', booking })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Sandbox payment: no money moves. The frontend simulates the card/QR step,
// this only marks the booking as paid for its owner.
export const payBooking = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        if (!userId) {
            return res.json({ success: false, message: "Sign in to pay for a booking" })
        }

        const { bookingId } = req.params
        const { method } = req.body
        if (!['card', 'alipay', 'wechat'].includes(method)) {
            return res.json({ success: false, message: "Unsupported payment method" })
        }

        const booking = await Booking.findById(bookingId)
        if (!booking) {
            return res.json({ success: false, message: "Booking not found. Unpaid bookings are released after 10 minutes." })
        }
        if (booking.user !== userId) {
            return res.json({ success: false, message: "This booking belongs to another account" })
        }
        if (booking.isRefunded) {
            return res.json({ success: false, message: "This booking was refunded and cannot be paid again" })
        }
        if (booking.isPaid) {
            return res.json({ success: true, message: "This booking is already paid", booking })
        }

        booking.isPaid = true
        booking.paymentMethod = method
        booking.paidAt = new Date()
        await booking.save()

        res.json({ success: true, message: "Payment successful", booking })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

const rebuildOccupiedSeats = async (showId) => {
    const showData = await Show.findById(showId)
    if (!showData) return null

    const bookings = await Booking.find({ show: showId, isRefunded: { $ne: true } })
    const occupiedSeats = {}
    bookings.forEach((item) => {
        (item.bookedSeats || []).forEach((seat) => {
            occupiedSeats[seat] = item.user
        })
    })

    showData.occupiedSeats = occupiedSeats
    showData.markModified('occupiedSeats')
    await showData.save()
    return occupiedSeats
}

export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;
        const occupiedSeats = await rebuildOccupiedSeats(showId)
        if (!occupiedSeats) {
            return res.json({ success: false, message: "Show not found" })
        }

        res.json({ success: true, occupiedSeats: Object.keys(occupiedSeats) })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}
