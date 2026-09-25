import express from 'express';
import { getAccountRole, getFavorites, getUserBooking, getUserBookings, renameUser, updateFavorite } from '../controllers/userController.js';
import { deleteNotification, getNotifications, markNotificationsRead, requestAdmin } from '../controllers/requestController.js';

const userRouter = express.Router();

userRouter.get('/role', getAccountRole)
userRouter.get('/bookings', getUserBookings)
userRouter.get('/bookings/:id', getUserBooking)
userRouter.post('/update-favorite', updateFavorite)
userRouter.post('/rename', renameUser)
userRouter.post('/admin-request', requestAdmin)
userRouter.get('/notifications', getNotifications)
userRouter.post('/notifications/read', markNotificationsRead)
userRouter.delete('/notifications/:id', deleteNotification)
userRouter.get('/favorites', getFavorites)

export default userRouter;
