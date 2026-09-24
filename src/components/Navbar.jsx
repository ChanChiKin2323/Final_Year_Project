import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboardIcon, MenuIcon, PencilIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useClerk, UserButton, useUser } from '@clerk/react'
import toast from 'react-hot-toast'
import Logo from './brand/Logo'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'
import { useAppContext } from '../context/AppContext'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Movies', to: '/movies' },
  { label: 'Favourites', to: '/favourite' },
]

const Navbar = () => {

  const [isOpen, setIsOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [authorizeOpen, setAuthorizeOpen] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '', note: '' })
  const {user} = useUser()
  const {openSignIn} = useClerk()
  const { axios, getToken, role } = useAppContext()

  const navigate = useNavigate()

  const closeMenu = () => {
    scrollTo(0, 0)
    setIsOpen(false)
  }

  const openRename = () => {
    setNameInput(user?.fullName || '')
    setRenameOpen(true)
  }

  const openAuthorize = () => {
    if (!user) return openSignIn()
    setForm({
      name: user.fullName || '',
      phone: '',
      email: user.primaryEmailAddress?.emailAddress || '',
      reason: '',
      note: '',
    })
    setAuthorizeOpen(true)
    setIsOpen(false)
  }

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const sendRequest = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.phone.trim()) return toast.error('Phone number is required')
    try {
      setSendingRequest(true)
      const { data } = await axios.post('/api/user/admin-request', form, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        toast.success(data.message)
        setAuthorizeOpen(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setSendingRequest(false)
  }

  const saveName = async () => {
    try {
      setSavingName(true)
      const { data } = await axios.post('/api/user/rename', { name: nameInput }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        await user?.reload?.()
        toast.success('Name updated')
        setRenameOpen(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setSavingName(false)
  }

  return (
    <header className='sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur'>
      <div className='mx-auto flex max-w-7xl items-center gap-10 px-5 py-4 md:px-10'>

        <Link to='/' onClick={closeMenu} className='shrink-0'>
          <Logo />
        </Link>

        <nav className='hidden items-center gap-7 text-[0.72rem] uppercase tracking-[0.18em] text-muted md:flex'>
          {navLinks.map((link) => (
            <Link key={link.label} to={link.to} onClick={closeMenu}
            className='transition hover:text-ink'>{link.label}</Link>
          ))}
          <button onClick={openAuthorize} className='cursor-pointer uppercase tracking-[0.18em] transition hover:text-ink'>
            Authorize
          </button>
        </nav>

        <div className='ml-auto flex items-center gap-3'>
          <button className='hidden h-9 w-9 place-items-center rounded-full border border-line
          transition hover:border-ink sm:grid' aria-label='Search'>
            <SearchIcon className='h-4 w-4'/>
          </button>

          {
            !user ? (
              <button onClick={openSignIn} className='px-5 py-2 sm:px-7 sm:py-2.5 bg-primary
              hover:bg-primary-dull transition rounded-full text-xs uppercase tracking-[0.14em]
              text-canvas font-medium cursor-pointer'>Login</button>
            ) : (
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action label='My Bookings' labelIcon={<TicketPlus width={15}/>} onClick={()=> navigate('/my-bookings')}/>
                  <UserButton.Action label='Rename' labelIcon={<PencilIcon width={15}/>} onClick={openRename}/>
                  {role === 'admin' && (
                    <UserButton.Action label='Dashboard' labelIcon={<LayoutDashboardIcon width={15}/>} onClick={()=> navigate('/admin')}/>
                  )}
                </UserButton.MenuItems>
              </UserButton>
            )
          }

          <NotificationBell />
          <ThemeToggle />

          <button className='grid h-9 w-9 place-items-center rounded-full border border-line md:hidden'
          onClick={()=> setIsOpen(!isOpen)} aria-label='Menu'>
            {isOpen ? <XIcon className='h-5 w-5'/> : <MenuIcon className='h-5 w-5'/>}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav className='flex flex-col border-t border-line bg-canvas px-5 py-3 md:hidden'>
          {navLinks.map((link) => (
            <Link key={link.label} to={link.to} onClick={closeMenu}
            className='border-b border-line/70 py-3 text-sm uppercase tracking-[0.18em]'>
              {link.label}
            </Link>
          ))}
          <button onClick={openAuthorize}
          className='border-b border-line/70 py-3 text-left text-sm uppercase tracking-[0.18em]'>
            Authorize
          </button>
        </nav>
      )}

      {authorizeOpen && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
        onClick={() => setAuthorizeOpen(false)}>
          <form className="w-full max-w-lg border border-line bg-surface p-6"
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => { e.preventDefault(); sendRequest() }}>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-accent">Authorize</p>
            <h2 className="mt-2 font-display text-2xl">Request admin access</h2>
            <p className="mt-2 text-sm text-muted">Name and phone number are required. The other fields are optional.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                Name
                <input value={form.name} onChange={setField('name')}
                className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
              </label>
              <label className="block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                Phone number
                <input value={form.phone} onChange={setField('phone')}
                className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
              </label>
            </div>
            <label className="mt-3 block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
              Email
              <input value={form.email} onChange={setField('email')} type="email"
              className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
            </label>
            <label className="mt-3 block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
              Why do you want to become an admin?
              <textarea value={form.reason} onChange={setField('reason')} rows={2}
              className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
            </label>
            <label className="mt-3 block text-[0.65rem] uppercase tracking-[0.16em] text-muted">
              Anything else
              <textarea value={form.note} onChange={setField('note')} rows={2}
              className="mt-1.5 w-full border border-ink bg-canvas px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none" />
            </label>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setAuthorizeOpen(false)}
              className="cursor-pointer rounded-full border border-ink px-5 py-2 text-[0.68rem] uppercase tracking-[0.16em]">
                Cancel
              </button>
              <button type="submit" disabled={sendingRequest}
              className="cursor-pointer rounded-full bg-primary px-5 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-canvas disabled:opacity-60">
                {sendingRequest ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {renameOpen && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
        onClick={() => setRenameOpen(false)}>
          <form className="w-full max-w-sm border border-line bg-surface p-6"
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => { e.preventDefault(); saveName() }}>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-accent">Account</p>
            <h2 className="mt-2 font-display text-2xl">Rename</h2>
            <p className="mt-2 text-sm text-muted">This name is what appears on your bookings.</p>
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            maxLength={40} autoFocus
            className="mt-5 w-full border border-ink bg-canvas px-3 py-2.5 text-sm outline-none" />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setRenameOpen(false)}
              className="cursor-pointer rounded-full border border-ink px-5 py-2 text-[0.68rem] uppercase tracking-[0.16em]">
                Cancel
              </button>
              <button type="submit" disabled={savingName}
              className="cursor-pointer rounded-full bg-primary px-5 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-canvas disabled:opacity-60">
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </header>
  )
}

export default Navbar
