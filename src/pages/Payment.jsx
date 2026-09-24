import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  CalendarIcon, CheckIcon, CircleCheckIcon, ClockIcon, CreditCardIcon,
  GlobeIcon, LoaderCircleIcon, LockIcon, MessageCircleIcon, QrCodeIcon,
  ShieldCheckIcon, TagIcon, TicketIcon, WalletIcon
} from "lucide-react"
import toast from "react-hot-toast"
import { useAppContext } from "../context/AppContext"
import imagePath from "../lib/imagePath"
import timeFormat from "../lib/timeFormat"
import isoTimeFormat from "../lib/isoTimeFormat"
import Loading from "../components/Loading"

const TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
}

const COUNTRIES = [
  'Hong Kong SAR China', 'Macau SAR China', 'Mainland China', 'Taiwan',
  'Singapore', 'United Kingdom', 'United States',
]

const METHODS = [
  { id: 'card', label: 'Card', icon: CreditCardIcon },
  { id: 'alipay', label: 'Alipay', icon: WalletIcon },
  { id: 'wechat', label: 'WeChat Pay', icon: MessageCircleIcon },
]

const luhnValid = (digits) => {
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  digits.split('').reverse().forEach((char, index) => {
    let n = Number(char)
    if (index % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  })
  return sum % 10 === 0
}

const cardBrand = (digits) => {
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  if (/^62/.test(digits)) return 'UnionPay'
  return ''
}

const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

const expiryValid = (value) => {
  const [mm, yy] = value.split('/')
  if (!mm || !yy || yy.length !== 2) return false
  const month = Number(mm)
  if (month < 1 || month > 12) return false
  // A card is valid through the last day of its expiry month.
  return new Date(2000 + Number(yy), month, 1) > new Date()
}

const languageName = (code) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code)
  } catch {
    return code?.toUpperCase() || '—'
  }
}

// Decorative QR-style pattern seeded by the booking id. It encodes nothing.
const SandboxQr = ({ seed }) => {
  const size = 21
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0

  const finderCell = (r, c) => {
    for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
      if (r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7) {
        const lr = r - r0
        const lc = c - c0
        return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)
      }
    }
    return null
  }

  const cells = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const finder = finderCell(r, c)
      let filled = finder
      if (finder === null) {
        let x = (hash ^ Math.imul(r + 1, 73856093) ^ Math.imul(c + 1, 19349663)) >>> 0
        x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0
        filled = ((x >>> 7) & 1) === 1
      }
      cells.push(<span key={`${r}-${c}`} className={filled ? 'bg-[#14120F]' : 'bg-white'} />)
    }
  }

  return (
    <div className="rounded-md bg-white p-3">
      <div className="grid h-44 w-44" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {cells}
      </div>
    </div>
  )
}

const Stepper = ({ done }) => {
  const steps = ['Choose seat', 'Confirm booking', 'Process payment']
  return (
    <ol className="flex items-center">
      {steps.map((label, index) => {
        const complete = index < 2 || done
        const current = index === 2 && !done
        return (
          <li key={label} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[0.65rem]
              ${complete ? 'bg-primary text-canvas' : current ? 'border-2 border-primary text-primary' : 'border border-line text-muted'}`}>
                {complete ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
              </span>
              <span className={`text-[0.68rem] uppercase tracking-[0.14em] ${current ? 'text-ink' : 'text-muted'} max-sm:hidden`}>
                {label}
              </span>
            </span>
            {index < steps.length - 1 && <span className="mx-4 h-px flex-1 bg-line" />}
          </li>
        )
      })}
    </ol>
  )
}

const Field = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="text-[0.62rem] uppercase tracking-[0.18em] text-muted">{label}</span>
    <div className="mt-2 flex items-center gap-2 border border-line bg-canvas px-3 py-2.5 focus-within:border-ink">
      {children}
    </div>
  </label>
)

const Payment = () => {

  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { axios, getToken, user } = useAppContext()
  const currency = import.meta.env.VITE_CURRENCY || "$"

  const [status, setStatus] = useState('loading')
  const [booking, setBooking] = useState(null)
  const [method, setMethod] = useState('card')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [country, setCountry] = useState(COUNTRIES[0])
  const [processing, setProcessing] = useState(false)

  const loadBooking = async () => {
    try {
      const { data } = await axios.get(`/api/user/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success && data.booking) {
        setBooking(data.booking)
        if (data.booking.isRefunded) setStatus('refunded')
        else setStatus(data.booking.isPaid ? 'paid' : 'ready')
      } else {
        setStatus('notfound')
      }
    } catch (error) {
      console.error(error)
      setStatus('notfound')
    }
  }

  useEffect(() => {
    if (user === undefined) return
    if (user === null) {
      setStatus('signin')
      return
    }
    loadBooking()
  }, [user, bookingId])

  const handlePay = async () => {
    const digits = cardNumber.replace(/\s/g, '')

    if (method === 'card') {
      if (!cardName.trim()) return toast.error('Enter the name on the card')
      if (!luhnValid(digits)) return toast.error('Card number is invalid')
      if (!expiryValid(expiry)) return toast.error('Expiry date is invalid or in the past')
      if (!/^\d{3,4}$/.test(cvc)) return toast.error('Security code must be 3 or 4 digits')
    }

    setProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1800))

    if (method === 'card' && digits === TEST_CARDS.declined) {
      setProcessing(false)
      return toast.error('Card declined. This is the sandbox "declined" test card.')
    }

    try {
      const { data } = await axios.post(`/api/booking/pay/${bookingId}`, { method }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        setBooking((prev) => ({ ...prev, ...data.booking, show: prev.show }))
        setStatus('paid')
        toast.success(data.message)
        scrollTo(0, 0)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setProcessing(false)
  }

  if (status === 'loading') return <Loading />

  if (status === 'signin' || status === 'notfound' || status === 'refunded') {
    return (
      <div className="mx-auto max-w-3xl px-5 py-32 text-center">
        <div className="border border-dashed border-line px-6 py-20">
          <h1 className="font-display text-3xl">
            {status === 'signin' ? 'Sign in to pay' : status === 'refunded' ? 'This booking was refunded' : 'Booking not found'}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {status === 'signin'
              ? 'Log in with the account that made this booking.'
              : status === 'refunded'
                ? 'The sandbox payment was returned to the original account. These seats are back on sale.'
                : 'It may belong to another account, or it was released after 10 minutes unpaid.'}
          </p>
          <button onClick={() => navigate('/my-bookings')} className="mt-8 cursor-pointer rounded-full
          border border-ink px-8 py-3 text-[0.7rem] uppercase tracking-[0.18em] transition hover:bg-ink hover:text-canvas">
            Back to my bookings
          </button>
        </div>
      </div>
    )
  }

  const movie = booking.show?.movie || {}
  const showDate = booking.show?.showDateTime ? new Date(booking.show.showDateTime) : null
  const digits = cardNumber.replace(/\s/g, '')
  const brand = cardBrand(digits)
  const reference = `SBX-${booking._id.slice(-8).toUpperCase()}`

  const screenNumber = booking.show?._id
    ? (parseInt(String(booking.show._id).slice(-4), 16) % 8) + 1
    : 1
  const starring = (movie.casts || []).slice(0, 2).map((cast) => cast.name).filter(Boolean).join(', ')

  const movieRows = [
    { icon: GlobeIcon, label: 'Language', value: languageName(movie.original_language) },
    { icon: TagIcon, label: 'Genre', value: (movie.genres || []).map((g) => g.name).join(', ') || '—' },
    { icon: CalendarIcon, label: 'Release date', value: movie.release_date || '—' },
    { icon: ClockIcon, label: 'Running time', value: movie.runtime ? timeFormat(movie.runtime) : '—' },
  ]
  if (starring) {
    movieRows.unshift({ icon: TicketIcon, label: 'Starring', value: starring })
  }

  const ticketRows = [
    { label: 'Cinema', value: 'Cinemora' },
    { label: 'Screen number', value: screenNumber },
    { label: 'Date', value: showDate ? showDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
    { label: 'Time', value: showDate ? isoTimeFormat(showDate) : '—' },
    { label: 'Selected seats', value: booking.bookedSeats.join(', ') },
  ]

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-10 md:px-10">
      <div className="border border-line bg-surface p-5 md:p-8">

        <Stepper done={status === 'paid'} />

        <div className="mt-8 grid overflow-hidden border border-line md:grid-cols-[190px_1fr_280px]">
          <img src={imagePath(movie.poster_path)} alt={movie.title}
          className="h-64 w-full object-cover md:h-full" />

          <div className="p-6">
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-accent">Now paying for</p>
            <h1 className="mt-2 font-display text-2xl">{movie.title}</h1>
            <ul className="mt-5 space-y-3 text-sm">
              {movieRows.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <row.icon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="text-muted">{row.label}:</span>
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-line bg-accent-soft p-6 max-md:border-t md:border-l">
            <p className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.24em] text-muted">
              <TicketIcon className="h-4 w-4" /> Ticket information
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              {ticketRows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-6 border border-primary bg-primary/10 py-4 text-center font-display text-2xl md:text-3xl">
          Total amount: {currency} {booking.amount}
        </div>

        {status === 'paid' ? (
          <div className="mt-6 border border-line bg-canvas px-6 py-12 text-center">
            <CircleCheckIcon className="mx-auto h-14 w-14 text-primary" strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-3xl">Payment successful</h2>
            <p className="mt-3 text-sm text-muted">
              Your seats {booking.bookedSeats.join(', ')} are confirmed. No real money was charged.
            </p>
            <p className="mt-5 text-[0.68rem] uppercase tracking-[0.2em] text-muted">
              Reference {reference}
              {booking.paymentMethod && ` · ${METHODS.find((m) => m.id === booking.paymentMethod)?.label}`}
            </p>
            <button onClick={() => { navigate('/my-bookings'); scrollTo(0, 0) }} className="mt-8 cursor-pointer
            rounded-full bg-primary px-10 py-3.5 text-[0.72rem] uppercase tracking-[0.18em] text-canvas transition hover:bg-primary-dull">
              View my bookings
            </button>
          </div>
        ) : (
          <div className="mt-6 border border-line bg-canvas p-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Checkout</h2>
              <span className="flex items-center gap-1.5 border border-accent px-3 py-1 text-[0.62rem]
              uppercase tracking-[0.18em] text-accent">
                <ShieldCheckIcon className="h-3.5 w-3.5" /> Sandbox — no real money is charged
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {METHODS.map((item) => {
                const active = method === item.id
                return (
                <button key={item.id} onClick={() => setMethod(item.id)} disabled={processing}
                className={`flex cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm transition
                ${item.id === 'card' && active ? 'bg-primary text-canvas' : ''}
                ${item.id !== 'card' && active ? 'bg-ink text-canvas' : ''}
                ${!active ? 'border border-line bg-surface text-ink hover:border-ink' : ''}`}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
                )
              })}
            </div>

            {method === 'card' ? (
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <Field label="Name on card" className="md:col-span-4">
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Chan Tai Man"
                  className="w-full bg-transparent text-sm outline-none" autoComplete="off" />
                </Field>

                <Field label="Card number" className="md:col-span-2">
                  <input value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4242 4242 4242 4242" inputMode="numeric" autoComplete="off"
                  className="w-full bg-transparent text-sm tracking-[0.08em] outline-none" />
                  {brand && <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.14em] text-muted">{brand}</span>}
                </Field>

                <Field label="Expiration date">
                  <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY" inputMode="numeric" autoComplete="off"
                  className="w-full bg-transparent text-sm outline-none" />
                </Field>

                <Field label="Security code">
                  <input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVC" inputMode="numeric" autoComplete="off"
                  className="w-full bg-transparent text-sm outline-none" />
                </Field>

                <Field label="Country" className="md:col-span-4">
                  <select value={country} onChange={(e) => setCountry(e.target.value)}
                  className="w-full cursor-pointer bg-transparent text-sm outline-none">
                    {COUNTRIES.map((name) => (
                      <option key={name} value={name} className="bg-surface text-ink">{name}</option>
                    ))}
                  </select>
                </Field>

                <div className="border border-dashed border-line p-4 text-xs leading-relaxed text-muted md:col-span-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.18em]">Sandbox test cards</p>
                  <p className="mt-2"><span className="text-ink">4242 4242 4242 4242</span> — payment succeeds</p>
                  <p><span className="text-ink">4000 0000 0000 0002</span> — payment is declined</p>
                  <p className="mt-1">Use any future expiry date and any 3-digit security code.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-6 border border-line bg-surface p-6 md:flex-row">
                <SandboxQr seed={`${booking._id}-${method}`} />
                <div className="text-sm">
                  <p className="flex items-center gap-2 font-display text-xl">
                    <QrCodeIcon className="h-5 w-5 text-primary" />
                    Scan with {method === 'alipay' ? 'Alipay' : 'WeChat'}
                  </p>
                  <p className="mt-3 leading-relaxed text-muted">
                    This QR code is a sandbox placeholder and cannot be scanned. Press the button below
                    to simulate a successful scan and payment of {currency} {booking.amount}.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-3">
              <button onClick={handlePay} disabled={processing} className="flex min-w-56 cursor-pointer items-center
              justify-center gap-2 rounded-full bg-primary px-10 py-3.5 text-[0.72rem] uppercase tracking-[0.18em]
              text-canvas transition hover:bg-primary-dull disabled:cursor-wait disabled:opacity-70">
                {processing ? (
                  <><LoaderCircleIcon className="h-4 w-4 animate-spin" /> Processing…</>
                ) : method === 'card' ? (
                  <><LockIcon className="h-4 w-4" /> Pay {currency} {booking.amount}</>
                ) : (
                  <>Simulate scan &amp; pay</>
                )}
              </button>
              <p className="flex items-center gap-1.5 text-[0.65rem] text-muted">
                <ClockIcon className="h-3.5 w-3.5" />
                Unpaid bookings are released 10 minutes after booking.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Payment
