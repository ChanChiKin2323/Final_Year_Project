import { useEffect, useState } from 'react'
import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UsersIcon } from 'lucide-react'
import Title from '../../components/admin/Title'
import dateFormat from '../../lib/dateFormat'
import { useAppContext } from '../../context/AppContext'
import imagePath from '../../lib/imagePath'
import Loading from '../../components/Loading'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 8

const Dashboard = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$'
    const { axios, getToken } = useAppContext()
    const [dashboardData, setDashboardData] = useState({
        totalBookings: 0,
        totalRevenue: 0,
        activeShows: [],
        totalUser: 0
    })
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const activeShows = dashboardData.activeShows || []
    const pageCount = Math.max(1, Math.ceil(activeShows.length / PAGE_SIZE))
    const visibleShows = activeShows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    useEffect(() => {
        if (page > pageCount) setPage(pageCount)
    }, [page, pageCount])

    const dashboardCards = [
        { title: "Total Bookings", value: dashboardData.totalBookings || "0", icon: ChartLineIcon },
        { title: "Total Revenue", value: currency + dashboardData.totalRevenue || "0", icon: CircleDollarSignIcon },
        { title: "Active Shows", value: dashboardData.activeShows.length || "0", icon: PlayCircleIcon },
        { title: "Total Users", value: dashboardData.totalUser || "0", icon: UsersIcon }
    ]

    const fetchDashboardData = async () => {
        try {
            const { data } = await axios.get('/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                setDashboardData(data.dashboardData)
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <>
            <Title text1="Admin" text2="Dashboard"/>

            <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
                {dashboardCards.map((card, index) => (
                    <div key={index} className="flex items-start justify-between bg-surface p-5">
                        <div>
                            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-muted">{card.title}</p>
                            <p className="mt-2 font-display text-3xl">{card.value}</p>
                        </div>
                        <card.icon className="h-5 w-5 text-accent" />
                    </div>
                ))}
            </div>

            <p className="mt-12 border-b border-line pb-4 text-[0.68rem] uppercase tracking-[0.24em] text-muted">
                Active shows
            </p>

            {dashboardData.activeShows.length === 0 ? (
                <p className="mt-8 border border-dashed border-line p-10 text-center text-sm text-muted">
                    No active shows yet. Add one from Add Shows.
                </p>
            ) : (
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleShows.map((show) => (
                        <div key={show._id} className="border border-line bg-surface transition hover:border-ink">
                            <img src={imagePath(show.movie?.poster_path)} alt={show.movie?.title}
                            className="aspect-[2/3] w-full object-cover" />
                            <div className="p-4">
                                <p className="truncate font-display text-base">{show.movie?.title}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="font-display text-xl">{currency}{show.showPrice}</p>
                                    <p className="flex items-center gap-1 text-xs text-muted">
                                        <StarIcon className="h-3.5 w-3.5 fill-accent text-accent" />
                                        {Number(show.movie?.vote_average || 0).toFixed(1)}
                                    </p>
                                </div>
                                <p className="mt-3 text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                                    {dateFormat(show.showDateTime)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
    )
}

export default Dashboard
