import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboardIcon, MenuIcon, PencilIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useClerk, UserButton, useUser } from '@clerk/react'
import toast from 'react-hot-toast'
import Logo from './brand/Logo'
import ThemeToggle from './ThemeToggle'
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
  const {user} = useUser()
  const {openSignIn} = useClerk()
  const { axios, getToken } = useAppContext()

  const navigate = useNavigate()

  const closeMenu = () => {
    scrollTo(0, 0)
    setIsOpen(false)
  }

  const openRename = () => {
    setNameInput(user?.fullName || '')
    setRenameOpen(true)
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
                  <UserButton.Action label='Dashboard' labelIcon={<LayoutDashboardIcon width={15}/>} onClick={()=> navigate('/admin')}/>
                </UserButton.MenuItems>
              </UserButton>
            )
          }

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
            className='border-b border-line/70 py-3 text-sm uppercase tracking-[0.18em] last:border-none'>
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      {renameOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
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
        </div>
      )}
    </header>
  )
}

export default Navbar
