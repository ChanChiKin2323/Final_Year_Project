import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";
import { primaryEmail } from "../lib/accountRole.js";
import { accountIsAdmin } from "./requestController.js";

export const getUserBookings = async (req, res) => {
    try {
        const user = req.auth?.()?.userId || req.query.userId
        if (!user) {
            return res.json({ success: false, message: "User is required" })
        }

        const bookings = await Booking.find({ user }).populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({ createdAt: -1 })

        res.json({ success: true, bookings })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getUserBooking = async (req, res) => {
    try {
        const user = req.auth?.()?.userId
        if (!user) {
            return res.json({ success: false, message: "User is required" })
        }

        const booking = await Booking.findOne({ _id: req.params.id, user }).populate({
            path: "show",
            populate: { path: "movie" }
        })

        if (!booking) {
            return res.json({ success: false, message: "Booking not found" })
        }

        res.json({ success: true, booking })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const updateFavorite = async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.auth?.()?.userId

        if (!userId) {
            return res.json({ success: false, message: "Sign in to update favorites" })
        }

        const user = await clerkClient.users.getUser(userId)

        if (!user.privateMetadata.favorites) {
            user.privateMetadata.favorites = []
        }

        if (!user.privateMetadata.favorites.includes(movieId)) {
            user.privateMetadata.favorites.push(movieId)
        } else {
            user.privateMetadata.favorites = user.privateMetadata.favorites.filter((item) => item !== movieId)
        }

        await clerkClient.users.updateUserMetadata(userId, { privateMetadata: user.privateMetadata })

        res.json({ success: true, message: "Favorite movies updated" })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getAccountRole = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        if (!userId) {
            return res.json({ success: true, role: 'guest' })
        }

        const user = await clerkClient.users.getUser(userId)
        const role = (await accountIsAdmin(user)) ? 'admin' : 'user'
        const email = primaryEmail(user)
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest User'

        if (user.privateMetadata?.role !== role) {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: { ...user.privateMetadata, role }
            })
        }

        await User.findByIdAndUpdate(userId, {
            name,
            email: email || `${userId}@guest.local`,
            image: user.imageUrl || 'https://via.placeholder.com/100',
            role,
        }, { upsert: true })

        res.json({ success: true, role })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const renameUser = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        const name = String(req.body.name || '').trim().replace(/\s+/g, ' ')

        if (!userId) {
            return res.json({ success: false, message: "Sign in to rename your account" })
        }
        if (name.length < 2 || name.length > 40) {
            return res.json({ success: false, message: "Name must be between 2 and 40 characters" })
        }

        const [firstName, ...rest] = name.split(' ')
        const lastName = rest.join(' ')

        try {
            await clerkClient.users.updateUser(userId, { firstName, lastName })
        } catch (error) {
            console.log('Clerk name update skipped:', error.message)
        }

        let email = `${userId}@guest.local`
        let image = "https://via.placeholder.com/100"
        try {
            const clerkUser = await clerkClient.users.getUser(userId)
            email = clerkUser.emailAddresses?.[0]?.emailAddress || email
            image = clerkUser.imageUrl || image
        } catch (error) {
            console.log('Clerk profile lookup skipped:', error.message)
        }

        const existing = await User.findById(userId)
        const role = existing?.role === 'admin' ? 'admin' : 'user'
        const user = await User.findByIdAndUpdate(
            userId,
            { name, email, image, role },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        )

        res.json({ success: true, message: "Name updated", user })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getFavorites = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        if (!userId) {
            return res.json({ success: true, movies: [] })
        }

        const user = await clerkClient.users.getUser(userId)
        const favorites = user.privateMetadata.favorites || []
        const movies = await Movie.find({ _id: { $in: favorites } })

        res.json({ success: true, movies })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}
