import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        movie: { type: String, required: true, ref: 'Movie' },
        name: { type: String, required: true },
        image: { type: String, default: '' },
        text: { type: String, required: true, maxlength: 400 },
        stars: { type: Number, required: true, min: 1, max: 5 },
    },
    { timestamps: true }
)

commentSchema.index({ user: 1, movie: 1 }, { unique: true })

const Comment = mongoose.model('Comment', commentSchema)

export default Comment
