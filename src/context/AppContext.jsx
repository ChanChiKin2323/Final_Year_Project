import axios from 'axios'
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/react'
import toast from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

export const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
    const [shows, setShows] = useState([])
    const [favoriteMovies, setFavoriteMovies] = useState([])
    const [role, setRole] = useState(null)
    const { user } = useUser()
    const { getToken } = useAuth()

    const fetchShows = async () => {
        try {
            const { data } = await axios.get('/api/show/all')
            if (data.success) {
                setShows(data.shows)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchFavoriteMovies = async () => {
        try {
            const { data } = await axios.get('/api/user/favorites', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                setFavoriteMovies(data.movies)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchShows()
    }, [])

    useEffect(() => {
        if (user) {
            fetchFavoriteMovies()
        }
    }, [user])

    const refreshRole = async () => {
        if (!user) {
            setRole('guest')
            return
        }
        try {
            const { data } = await axios.get('/api/user/role', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            setRole(data.role === 'admin' ? 'admin' : 'user')
        } catch (error) {
            console.error(error)
            setRole('user')
        }
    }

    useEffect(() => {
        if (user === undefined) return
        refreshRole()
    }, [user])

    const value = {
        axios,
        fetchShows,
        shows,
        user,
        getToken,
        favoriteMovies,
        fetchFavoriteMovies,
        role,
        refreshRole,
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext)
