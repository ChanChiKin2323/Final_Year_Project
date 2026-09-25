import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

import connectDB from './configs/db.js';
import clerkWebhooks from './controllers/clerkWebhooks.js';
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';

const app = express();
const port = 3000;

await connectDB()

app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())



app.get('/', (req, res)=> res.send('Server is Live!'))
app.use('/api/inngest', serve({ client: inngest, functions }))

app.post('/api/clerk', clerkWebhooks)

// Without this, queries sit in Mongoose's buffer and fail with a vague timeout.
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Database not connected. Check MongoDB Atlas -> Network Access, then restart the server.'
        })
    }
    next()
})

app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)

app.listen(port, ()=>console.log(`Server listening at http://localhost:${port}`));
