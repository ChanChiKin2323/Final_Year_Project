import { clerkClient } from '@clerk/express'
import { accountIsAdmin } from '../controllers/requestController.js'

const setRole = async (userId, user, role) => {
    if (user.privateMetadata?.role === role) return
    await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
            ...user.privateMetadata,
            role,
        },
    })
}

export const protectAdmin = async (req, res, next) => {
    try {
        if (!process.env.CLERK_SECRET_KEY) {
            return next()
        }

        const { userId } = req.auth()
        if (!userId) {
            return res.status(401).json({ success: false, message: 'not authenticated. Please log in.' })
        }

        const user = await clerkClient.users.getUser(userId)
        if (!(await accountIsAdmin(user))) {
            await setRole(userId, user, 'user')
            return res.status(403).json({
                success: false,
                message: 'This Google account is a customer account and cannot open the cinema desk.'
            })
        }

        await setRole(userId, user, 'admin')
        next()
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message })
    }
}
