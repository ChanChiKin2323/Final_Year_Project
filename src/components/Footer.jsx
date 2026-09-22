import { Link } from 'react-router-dom'
import Logo from './brand/Logo'

const Footer = () => {
  return (
    <footer className='mt-24 border-t border-line bg-surface'>
      <div className='mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.6fr_1fr_1fr] md:px-10'>
        <div>
          <Logo />
          <p className='mt-4 max-w-sm text-sm leading-relaxed text-muted'>
            An independent booking desk for the cinema down the road. Pick a night,
            pick a seat, and we will hold it for you.
          </p>
        </div>

        <div>
          <p className='text-[0.7rem] uppercase tracking-[0.22em] text-muted'>Explore</p>
          <ul className='mt-4 space-y-2.5 text-sm'>
            <li><Link to='/movies' onClick={()=> scrollTo(0,0)} className='hover:text-primary'>Now showing</Link></li>
            <li><Link to='/favourite' onClick={()=> scrollTo(0,0)} className='hover:text-primary'>Favourites</Link></li>
            <li><Link to='/my-bookings' onClick={()=> scrollTo(0,0)} className='hover:text-primary'>My bookings</Link></li>
          </ul>
        </div>

        <div>
          <p className='text-[0.7rem] uppercase tracking-[0.22em] text-muted'>Box office</p>
          <ul className='mt-4 space-y-2.5 text-sm text-muted'>
            <li>Open daily, 10:00 – 23:00</li>
            <li>hello@cinemora.example</li>
            <li>+1 (555) 019 8823</li>
          </ul>
        </div>
      </div>

      <div className='border-t border-line py-5 text-center text-[0.7rem] uppercase tracking-[0.22em] text-muted'>
        © {new Date().getFullYear()} Cinemora — all seats reserved
      </div>
    </footer>
  )
}

export default Footer
