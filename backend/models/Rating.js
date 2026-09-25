import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        movie: { type: String, required: true, ref: 'Movie' },
        stars: { type: Number, required: true, min: 1, max: 5 },
    },
    { timestamps: true }
)

ratingSchema.index({ user: 1, movie: 1 }, { unique: true })

const Rating = mongoose.model('Rating', ratingSchema)

export default Rating
