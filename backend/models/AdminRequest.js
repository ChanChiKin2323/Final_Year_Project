import mongoose from "mongoose";

const adminRequestSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, default: '' },
        reason: { type: String, default: '' },
        note: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    },
    { timestamps: true }
)

const AdminRequest = mongoose.model('AdminRequest', adminRequestSchema)

export default AdminRequest
