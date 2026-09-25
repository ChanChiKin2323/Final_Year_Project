import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import timeFormat from "../lib/timeFormat"
import dateFormat from "../lib/dateFormat"
import { useAppContext } from "../context/AppContext"
import imagePath from "../lib/imagePath"
import Loading from "../components/Loading"


const MyBookings = () => {

  const currency = import.meta.env.VITE_CURRENCY || "$"
  const { axios, getToken, user } = useAppContext()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get('/api/user/bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error(error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (user) {
      getMyBookings()
    } else {
      setIsLoading(false)
    }
  }, [user])

  return !isLoading ? (
    <div className="mx-auto min-h-[70vh] max-w-5xl px-5 pb-20 pt-12 md:px-10">

      <div className='flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-6'>
        <div>
          <p className='text-[0.7rem] uppercase tracking-[0.3em] text-accent'>Box office</p>
          <h1 className='mt-3 font-display text-4xl md:text-5xl'>My bookings</h1>
        </div>
        <p className='text-[0.7rem] uppercase tracking-[0.2em] text-muted'>
          {bookings.length} {bookings.length === 1 ? 'ticket order' : 'ticket orders'}
        </p>
      </div>

      {bookings.length === 0 && (
        <div className='mt-10 border border-dashed border-line px-6 py-24 text-center'>
          <h2 className='font-display text-2xl'>No bookings yet</h2>
          <p className='mt-3 text-sm text-muted'>Your tickets will show up here once you book a show.</p>
        </div>
      )}

      <div className='mt-10 space-y-5'>
        {bookings.map((item) => (
          <div key={item._id} className="flex flex-col border border-line bg-surface
          md:flex-row md:items-stretch">

            <div className='w-full shrink-0 md:w-40'>
              <img src={imagePath(item.show?.movie?.poster_path)} alt={item.show?.movie?.title}
              className="h-48 w-full object-cover md:h-full"/>
            </div>

            <div className="flex flex-1 flex-col gap-2 border-line p-5 md:border-r">
              <p className="font-display text-xl">{item.show?.movie?.title}</p>
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
                {timeFormat(item.show?.movie?.runtime)}
              </p>
              <p className="mt-auto text-sm text-muted">{dateFormat(item.show?.showDateTime)}</p>
            </div>

            <div className="flex w-full flex-col justify-between gap-4 p-5 md:w-64">
              <div className='flex items-center justify-between gap-4'>
                <p className="font-display text-3xl">{currency}{item.amount}</p>
                {item.isRefunded ? (
                  <span className="border border-muted px-3 py-1 text-[0.62rem] uppercase
                  tracking-[0.16em] text-muted">Refunded</span>
                ) : !item.isPaid ? (
                  <button onClick={() => { navigate(`/payment/${item._id}`); scrollTo(0, 0) }}
                  className="rounded-full bg-accent px-5 py-2 text-[0.68rem] uppercase
                  tracking-[0.16em] text-canvas transition hover:opacity-90 cursor-pointer">
                    Pay now
                  </button>
                ) : (
                  <span className="border border-primary px-3 py-1 text-[0.62rem] uppercase
                  tracking-[0.16em] text-primary">Paid</span>
                )}
              </div>

              <dl className="space-y-1.5 text-sm">
                <div className='flex justify-between gap-3'>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">Tickets</dt>
                  <dd>{item.bookedSeats.length}</dd>
                </div>
                <div className='flex justify-between gap-3'>
                  <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted">Seats</dt>
                  <dd className='text-right'>{item.bookedSeats.join(", ")}</dd>
                </div>
              </dl>
            </div>

          </div>
        ))}
      </div>
    </div>
  ) : (
    <Loading />
  )
}

export default MyBookings
