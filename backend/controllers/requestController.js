import { clerkClient } from "@clerk/express"
import AdminRequest from "../models/AdminRequest.js"
import Notification from "../models/Notification.js"
import User from "../models/User.js"
import { primaryEmail } from "../lib/accountRole.js"

const withAdminMark = (name) => {
    const base = String(name || '').replace(/\s*\(Admin\)\s*$/i, '').trim()
    return `${base || 'Admin'} (Admin)`
}

const notify = (userId, message) => Notification.create({ user: userId, message })

export const accountIsAdmin = async (clerkUser) => {
    const saved = await User.findById(clerkUser.id)
    return saved?.role === 'admin'
}

export const requestAdmin = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        if (!userId) {
            return res.json({ success: false, message: "Sign in to request admin access" })
        }

        const clerkUser = await clerkClient.users.getUser(userId)
        const name = String(req.body.name || '').trim()
        const phone = String(req.body.phone || '').trim()
        const email = String(req.body.email || '').trim() || primaryEmail(clerkUser)
        const reason = String(req.body.reason || '').trim()
        const note = String(req.body.note || '').trim()

        if (name.length < 2) {
            return res.json({ success: false, message: "Name is required" })
        }
        if (phone.length < 8) {
            return res.json({ success: false, message: "Phone number is required" })
        }

        if (await accountIsAdmin(clerkUser)) {
            return res.json({ success: false, message: "This account is already an admin" })
        }

        const pending = await AdminRequest.findOne({ user: userId, status: 'pending' })
        if (pending) {
            return res.json({ success: false, message: "You already have a request waiting for review" })
        }

        await AdminRequest.create({ user: userId, name, phone, email, reason, note, status: 'pending' })

        const admins = await User.find({ role: 'admin' })
        await Promise.all(admins.map((admin) => notify(
            admin._id,
            `${name} (${email}) requested to become an admin.`
        )))

        res.json({ success: true, message: "Request sent. The cinema desk will review it." })
    } catch (error) {
        console.error(error.message)
        res.json({ success: false, message: error.message })
    }
}

export const getNotifications = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        if (!userId) {
            return res.json({ success: true, notifications: [] })
        }
        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(20)
        res.json({ success: true, notifications })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        if (!userId) {
            return res.json({ success: false, message: "Sign in first" })
        }
        const deleted = await Notification.findOneAndDelete({ _id: req.params.id, user: userId })
        if (!deleted) {
            return res.json({ success: false, message: "Message not found" })
        }
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const markNotificationsRead = async (req, res) => {
    try {
        const userId = req.auth?.()?.userId
        if (!userId) {
            return res.json({ success: false, message: "Sign in first" })
        }
        await Notification.updateMany({ user: userId, read: false }, { read: true })
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getAdminRequests = async (req, res) => {
    try {
        const requests = await AdminRequest.find({ status: 'pending' }).sort({ createdAt: 1 })
        res.json({ success: true, requests })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const markClerkAdmin = async (userId, name) => {
    const marked = withAdminMark(name)
    const base = marked.replace(/\s*\(Admin\)\s*$/i, '').trim()
    const [firstName, ...rest] = base.split(' ')
    try {
        await clerkClient.users.updateUser(userId, {
            firstName: firstName || 'Admin',
            lastName: `${rest.join(' ')} (Admin)`.trim(),
        })
        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: { role: 'admin' },
        })
    } catch (error) {
        console.log('Clerk admin mark skipped:', error.message)
    }
    return marked
}

export const approveAdminRequest = async (req, res) => {
    try {
        const request = await AdminRequest.findById(req.params.id)
        if (!request || request.status !== 'pending') {
            return res.json({ success: false, message: "Request not found" })
        }

        const markedName = await markClerkAdmin(request.user, request.name)
        const existing = await User.findById(request.user)
        await User.findByIdAndUpdate(request.user, {
            name: markedName,
            email: request.email,
            image: existing?.image || 'https://via.placeholder.com/100',
            role: 'admin',
        }, { upsert: true })

        request.status = 'approved'
        await request.save()
        await notify(request.user, "Your request to become an admin was approved.")

        res.json({ success: true, message: `${request.name} is now an admin` })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const rejectAdminRequest = async (req, res) => {
    try {
        const request = await AdminRequest.findById(req.params.id)
        if (!request || request.status !== 'pending') {
            return res.json({ success: false, message: "Request not found" })
        }

        request.status = 'rejected'
        await request.save()
        await notify(request.user, "Your request to become an admin was rejected.")

        res.json({ success: true, message: "Request rejected" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

