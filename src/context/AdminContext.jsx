import { createContext, useContext, useEffect, useState } from 'react'
import { dummyBookingData, dummyDashboardData } from '../assets/assets'

const AdminContext = createContext(null)

const SHOWS_KEY = 'quickshow_admin_shows'
const BOOKINGS_KEY = 'quickshow_admin_bookings'

const defaultShows = dummyDashboardData.activeShows
const defaultBookings = dummyBookingData.map((booking, index) => ({
  ...booking,
  _id: `${booking._id}-${index}`,
}))

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export const AdminProvider = ({ children }) => {
  const [shows, setShows] = useState(() => readStorage(SHOWS_KEY, defaultShows))
  const [bookings, setBookings] = useState(() => readStorage(BOOKINGS_KEY, defaultBookings))

  useEffect(() => {
    localStorage.setItem(SHOWS_KEY, JSON.stringify(shows))
  }, [shows])

  useEffect(() => {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
  }, [bookings])

  const addShows = (newShows) => setShows((prev) => [...newShows, ...prev])

  const updateShow = (id, updates) => setShows((prev) =>
    prev.map((show) => show._id === id ? { ...show, ...updates } : show)
  )

  const deleteShow = (id) => setShows((prev) => prev.filter((show) => show._id !== id))

  const toggleBookingPaid = (id) => setBookings((prev) =>
    prev.map((booking) => booking._id === id ? { ...booking, isPaid: !booking.isPaid } : booking)
  )

  const deleteBooking = (id) => setBookings((prev) => prev.filter((booking) => booking._id !== id))

  const totalBookings = shows.reduce((sum, show) => sum + Object.keys(show.occupiedSeats || {}).length, 0)
  const totalRevenue = shows.reduce((sum, show) => sum + Object.keys(show.occupiedSeats || {}).length * Number(show.showPrice || 0), 0)

  return (
    <AdminContext.Provider value={{
      shows,
      bookings,
      addShows,
      updateShow,
      deleteShow,
      toggleBookingPaid,
      deleteBooking,
      totalBookings,
      totalRevenue,
      totalUser: dummyDashboardData.totalUser,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
