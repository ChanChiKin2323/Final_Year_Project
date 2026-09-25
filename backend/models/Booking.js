import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        show: { type: String, required: true, ref: 'Show' },
        amount: { type: Number, required: true },
        bookedSeats: { type: Array, required: true },
        isPaid: { type: Boolean, default: false },
        isRefunded: { type: Boolean, default: false },
        paymentMethod: { type: String },
        paidAt: { type: Date },
        refundedAt: { type: Date }
    },
    { timestamps: true }
)

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking;
