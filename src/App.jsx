import Navbar from './components/Navbar'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import Loading from './components/Loading'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favourite from './pages/Favourite'
import Payment from './pages/Payment'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import HandleRequests from './pages/admin/HandleRequests'

const CustomerOnly = ({ children }) => {
  const { role } = useAppContext()
  if (role === null) return <Loading />
  if (role === 'admin') return <Navigate to="/admin" replace />
  return children
}

const CinemaOnly = () => {
  const { role } = useAppContext()
  if (role === null) return <Loading />
  if (role !== 'admin') return <Navigate to="/" replace />
  return <Layout />
}

const App = () => {
  
  const isAdminRoute = useLocation().pathname.startsWith('/admin')
  
  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar/>}
      <Routes>
        <Route path='/' element={<CustomerOnly><Home/></CustomerOnly>} />
        <Route path='/movies' element={<CustomerOnly><Movies/></CustomerOnly>} />
        <Route path='/movies/:id' element={<CustomerOnly><MovieDetails/></CustomerOnly>} />
        <Route path='/movies/:id/:date' element={<CustomerOnly><SeatLayout/></CustomerOnly>} />
        <Route path='/my-bookings' element={<CustomerOnly><MyBookings/></CustomerOnly>} />
        <Route path='/payment/:bookingId' element={<CustomerOnly><Payment/></CustomerOnly>} />
        <Route path='/favourite' element={<CustomerOnly><Favourite/></CustomerOnly>} />
        <Route path='/admin/*' element={<CinemaOnly/>}>
          <Route index element={<Dashboard/>} />
          <Route path='add-shows' element={<AddShows/>} />
          <Route path='list-shows' element={<ListShows/>} />
          <Route path='list-bookings' element={<ListBookings/>} />
          <Route path='requests' element={<HandleRequests/>} />
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  )
}

export default App
