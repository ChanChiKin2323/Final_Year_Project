import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
export const inngest = new Inngest({
    id: "movie-ticket-booking",
    isDev: true,
});

const userPayload = (data) => {
    const email = data.email_addresses[0].email_address
    return {
        _id: data.id,
        email,
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        image: data.image_url,
        role: 'user',
    }
}

const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk", triggers: { event: "clerk/user.created" } },
    async ({ event }) => {
        await User.create(userPayload(event.data))
    }
)

const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk", triggers: { event: "clerk/user.updated" } },
    async ({ event }) => {
        const { id } = event.data
        const profile = userPayload(event.data)
        delete profile.role
        await User.findByIdAndUpdate(id, profile)
    }
)

const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-with-clerk", triggers: { event: "clerk/user.deleted" } },
    async ({ event }) => {
        const { id } = event.data
        await User.findByIdAndDelete(id)
    }
)

const releaseSeatsAndDeleteBooking = inngest.createFunction(
    { id: "release-seats-delete-booking", triggers: { event: "app/checkpayment" } },
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

        await step.run("check-payment-status", async () => {
            const booking = await Booking.findById(event.data.bookingId)
            if (!booking || booking.isPaid || booking.isRefunded) {
                return
            }

            const show = await Show.findById(booking.show);
            if (show) {
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeats[seat]
                });
                show.markModified("occupiedSeats")
                await show.save()
            }

            await Booking.findByIdAndDelete(booking._id)
        })
    }
)

export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    releaseSeatsAndDeleteBooking,
];
