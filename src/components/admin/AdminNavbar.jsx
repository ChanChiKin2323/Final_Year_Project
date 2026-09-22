import { Link } from 'react-router-dom'
import Logo from '../brand/Logo'
import ThemeToggle from '../ThemeToggle'

const AdminNavbar = () => {
  return (
    <div className='flex h-16 items-center justify-between border-b border-line bg-surface px-6 md:px-10'>
        <Link to="/" className='flex items-center gap-3'>
            <Logo />
        </Link>
        <div className='flex items-center gap-4'>
            <span className='border border-ink px-3 py-1 text-[0.62rem] uppercase tracking-[0.22em]'>
                Box office admin
            </span>
            <ThemeToggle />
        </div>
    </div>
  )
}

export default AdminNavbar
