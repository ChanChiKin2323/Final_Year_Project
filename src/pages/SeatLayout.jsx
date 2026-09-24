import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowRightIcon, ClockIcon } from "lucide-react"
import isoTimeFormat from "../lib/isoTimeFormat"
import toast from 'react-hot-toast'
import { useAppContext } from "../context/AppContext"
import Loading from "../components/Loading"


const SeatLayout = () => {

  const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]]

   const {id, date} = useParams()
   const [selectedSeats, setSelectedSeats] = useState([])
   const [selectedTime, setSelectedTime] = useState(null)
   const [show, setShow] = useState(null)
   const [occupiedSeats, setOccupiedSeats] = useState([])
   const [showSummary, setShowSummary] = useState(false)

   const currency = import.meta.env.VITE_CURRENCY || "$"
   const totalPrice = selectedSeats.length * (selectedTime?.showPrice || 0)

   const navigate = useNavigate()
   const { axios, getToken, user } = useAppContext()

   const getShow = async () =>{
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      if (data.success) {
        setShow({
          movie: data.movie,
          dateTime: data.dateTime
        })
      }
    } catch (error) {
      console.error(error)
    }
   }

   const getOccupiedSeats = async (showId) => {
    try {
      const { data } = await axios.get(`/api/booking/seats/${showId}`)
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats)
      }
    } catch (error) {
      console.error(error)
    }
   }

   const handleSeatClick = (seatId) =>{
    if(!selectedTime){
      return toast("Please select time first")
    }
    if (occupiedSeats.includes(seatId)) {
      return toast("This seat is already booked")
    }
    if(!selectedSeats.includes(seatId) && selectedSeats.length > 4){
      return toast("You can only select 5 seats")
    }
    setShowSummary(false)
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat !==
      seatId) : [...prev, seatId])
   }

   const handleProceed = () => {
    if (!user) return toast.error('Please login to proceed')
    if (!selectedTime || selectedSeats.length === 0) {
      return toast.error('Please select time and seats')
    }
    setShowSummary(true)
   }

   const handleCheckout = async () => {
    try {
      if (!user) return toast.error('Please login to proceed')
      if (!selectedTime || selectedSeats.length === 0) {
        return toast.error('Please select time and seats')
      }

      const { data } = await axios.post('/api/booking/create', {
        showId: selectedTime.showId,
        selectedSeats,
        userName: user.fullName,
        userEmail: user.primaryEmailAddress?.emailAddress,
        userImage: user.imageUrl,
      }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        toast.success(data.message)
        navigate(`/payment/${data.booking._id}`)
        scrollTo(0,0)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
   }

   const renderSeats = (row, count = 9)=>(
    <div key={row} className='mt-2 flex gap-2'>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          const isSelected = selectedSeats.includes(seatId)
          const isTaken = occupiedSeats.includes(seatId)
          return (
            <button key={seatId} onClick={() => handleSeatClick(seatId)}
            className={`h-8 w-8 cursor-pointer border text-[0.65rem] transition
            ${isTaken
              ? "cursor-not-allowed border-red-700 bg-red-700 text-transparent hover:border-red-700"
              : isSelected
                ? "border-ink bg-ink text-canvas"
                : "border-ink/25 bg-surface hover:border-ink"}`}>
              {isTaken ? '' : seatId}
            </button>
          );
        })}
      </div>
    </div>
   )

   useEffect(()=>{
    getShow()
   },[id])

   // Pick the first screening straight away so booked seats are visible on arrival.
   useEffect(()=>{
    const timings = show?.dateTime?.[date] || []
    if (timings.length > 0 && !selectedTime) {
      setSelectedTime(timings[0])
      getOccupiedSeats(timings[0].showId)
    }
   },[show, date])

  return show ? (
  <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 pb-24 pt-12 md:flex-row md:px-10">

    {/* Available Timings */}
    <div className="h-max w-full border border-ink bg-surface md:sticky md:top-28 md:w-64">
      <p className="border-b border-ink px-5 py-4 text-[0.7rem] uppercase tracking-[0.22em]">
        Available timings
      </p>
      <div className="p-3">
        {(show.dateTime[date] || []).map((item) => (
          <div key={item.time} onClick={()=> {setSelectedTime(item); setSelectedSeats([]); setShowSummary(false); getOccupiedSeats(item.showId)}}
          className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 transition
          ${selectedTime?.time === item.time ? "bg-ink text-canvas" : "hover:bg-accent-soft"}`}>
            <ClockIcon className="h-4 w-4"/>
            <p className="text-sm">{isoTimeFormat(item.time)}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Seats Layout */}
    <div className="flex flex-1 flex-col items-center">
      <p className='text-[0.7rem] uppercase tracking-[0.3em] text-accent'>Step two</p>
      <h1 className="mt-3 font-display text-3xl">Select your seat</h1>

      <svg viewBox="0 0 400 44" className="mt-10 w-full max-w-xl text-ink/30" aria-hidden="true">
        <path d="M6 38C100 8 300 8 394 38" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </svg>
      <p className="mt-2 text-[0.65rem] uppercase tracking-[0.28em] text-muted">Screen side</p>

      <div className='mt-12 flex flex-col items-center text-xs'>
        <div className='mb-6 grid grid-cols-2 gap-8 md:grid-cols-1 md:gap-2'>
          {groupRows[0].map(row => renderSeats(row))}
        </div>

        <div className='grid grid-cols-2 gap-11'>
          {groupRows.slice(1).map((group, idx)=>(
            <div key={idx}>
              {group.map(row => renderSeats(row))}
            </div>
          ))}
        </div>
      </div>

      <div className='mt-10 flex flex-wrap items-center justify-center gap-6 text-[0.65rem]
      uppercase tracking-[0.16em] text-muted'>
        <span className='flex items-center gap-2'>
          <span className='h-3.5 w-3.5 border border-ink/25 bg-surface'/> Available
        </span>
        <span className='flex items-center gap-2'>
          <span className='h-3.5 w-3.5 border border-ink bg-ink'/> Selected
        </span>
        <span className='flex items-center gap-2'>
          <span className='h-3.5 w-3.5 border border-red-700 bg-red-700'/> Taken ({occupiedSeats.length})
        </span>
      </div>

      <button onClick={handleProceed} className='mt-12 flex cursor-pointer items-center gap-2
      rounded-full bg-primary px-10 py-3.5 text-[0.72rem] uppercase tracking-[0.18em] text-canvas
      transition hover:bg-primary-dull'>
        Proceed to checkout
        <ArrowRightIcon strokeWidth={3} className="h-4 w-4"/>
      </button>
    </div>

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={() => setShowSummary(false)}>
          <div className="w-full max-w-md rounded-lg bg-[#5A232A] p-6 text-[#F2EDE3] shadow-xl"
          onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-6 text-center text-lg font-semibold">Order Summary</h2>

            <div className="flex justify-between py-2 text-sm">
              <span>Selected Seats:</span>
              <span>{selectedSeats.join(", ")}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span>Total Number of Tickets:</span>
              <span>{selectedSeats.length}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-[#F2EDE3]/40 pt-4 text-sm">
              <span>Total Price:</span>
              <span>{currency} {totalPrice}</span>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowSummary(false)}
              className="cursor-pointer rounded-full border border-[#F2EDE3]/50 px-6 py-2 text-xs uppercase tracking-[0.16em]">
                Back
              </button>
              <button onClick={handleCheckout}
              className="cursor-pointer rounded-full bg-[#F2EDE3] px-6 py-2 text-xs uppercase tracking-[0.16em] text-[#5A232A]">
                Confirm booking
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
) : (
  <Loading />
)
}

export default SeatLayout
