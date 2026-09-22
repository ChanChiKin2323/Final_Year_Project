import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboardIcon, MenuIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useClerk, UserButton, useUser } from '@clerk/react'
import Logo from './brand/Logo'
import ThemeToggle from './ThemeToggle'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Movies', to: '/movies' },
  { label: 'Theaters', to: '/' },
  { label: 'Releases', to: '/' },
  { label: 'Favourites', to: '/favourite' },
]

const Navbar = () => {

  const [isOpen, setIsOpen] = useState(false)
  const {user} = useUser()
  const {openSignIn} = useClerk()

  const navigate = useNavigate()

  const closeMenu = () => {
    scrollTo(0, 0)
    setIsOpen(false)
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
    </header>
  )
}

export default Navbar
