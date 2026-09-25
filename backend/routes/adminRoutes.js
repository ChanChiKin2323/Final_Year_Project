import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { deleteBooking, deleteShow, getAllBookings, getAllShows, getDashboardData, isAdmin, refundBooking, updateBooking, updateShow } from '../controllers/adminController.js';
import { approveAdminRequest, getAdminRequests, rejectAdminRequest } from '../controllers/requestController.js';

const adminRouter = express.Router();

adminRouter.get('/is-admin', protectAdmin, isAdmin)
adminRouter.get('/dashboard', protectAdmin, getDashboardData)
adminRouter.get('/all-shows', protectAdmin, getAllShows)
adminRouter.get('/all-bookings', protectAdmin, getAllBookings)
adminRouter.put('/show/:id', protectAdmin, updateShow)
adminRouter.delete('/show/:id', protectAdmin, deleteShow)
adminRouter.put('/booking/:id', protectAdmin, updateBooking)
adminRouter.post('/booking/:id/refund', protectAdmin, refundBooking)
adminRouter.delete('/booking/:id', protectAdmin, deleteBooking)
adminRouter.get('/requests', protectAdmin, getAdminRequests)
adminRouter.post('/requests/:id/approve', protectAdmin, approveAdminRequest)
adminRouter.post('/requests/:id/reject', protectAdmin, rejectAdminRequest)

export default adminRouter;
