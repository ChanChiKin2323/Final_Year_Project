import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on('connected', () => console.log('Database connected'));
    mongoose.connection.on('error', (err) => console.log('Database error:', err.message));
    mongoose.connection.on('disconnected', () => console.log('Database disconnected'));

    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/bookings`, {
            serverSelectionTimeoutMS: 8000,
        })
    } catch (error) {
        console.log('\nDatabase connection FAILED:', error.message)
        console.log('If this mentions an IP whitelist, open MongoDB Atlas -> Network Access,')
        console.log('add your current IP address (or 0.0.0.0/0 while developing), then restart.\n')
    }
}

export default connectDB;
