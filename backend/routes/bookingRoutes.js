import express from 'express';
import { createBooking, getOccupiedSeats, payBooking } from '../controllers/bookingController.js';

const bookingRouter = express.Router();

bookingRouter.post('/create', createBooking);
bookingRouter.get('/seats/:showId', getOccupiedSeats);
bookingRouter.post('/pay/:bookingId', payBooking);

export default bookingRouter;
