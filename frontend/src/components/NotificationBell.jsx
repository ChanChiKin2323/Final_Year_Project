import { useEffect, useState } from 'react'
import { BellIcon, XIcon } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const NotificationBell = () => {
  const { axios, getToken, user, refreshRole } = useAppContext()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])

  const load = async () => {
    if (!user) return
    try {
      const { data } = await axios.get('/api/user/notifications', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        setItems(data.notifications)
        if (data.notifications.some((item) => !item.read && /approved/i.test(item.message))) {
          refreshRole?.()
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [user])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && items.some((item) => !item.read)) {
      try {
        await axios.post('/api/user/notifications/read', {}, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        })
        setItems((prev) => prev.map((item) => ({ ...item, read: true })))
      } catch (error) {
        console.error(error)
      }
    }
  }

  const remove = async (id) => {
    try {
      const { data } = await axios.delete(`/api/user/notifications/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        setItems((prev) => prev.filter((item) => item._id !== id))
      }
    } catch (error) {
      console.error(error)
    }
  }

  if (!user) return null

  const unread = items.filter((item) => !item.read).length

  return (
    <div className="relative">
      <button onClick={toggle} aria-label="Notifications"
      className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line transition hover:border-ink">
        <BellIcon className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.6rem] text-canvas">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[70] w-80 border border-line bg-surface shadow-xl">
          <p className="border-b border-line px-4 py-3 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
            Notifications
          </p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">No messages yet.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item._id} className="border-b border-line px-4 py-3 text-sm last:border-none">
                  <p>{item.message}</p>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => remove(item._id)}
                    className="cursor-pointer text-[0.62rem] uppercase tracking-[0.14em] text-muted hover:text-accent"
                    aria-label="Delete notification">
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
