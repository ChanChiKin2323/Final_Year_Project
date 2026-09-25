import { InboxIcon, LayoutDashboardIcon, ListCollapseIcon, ListIcon, PlusSquareIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useUser } from '@clerk/react'

const AdminSidebar = () => {

    const { user } = useUser()
    const name = user?.fullName || 'Admin'
    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()

    const adminNavlinks = [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboardIcon },
        { name: 'Add Shows', path: '/admin/add-shows', icon: PlusSquareIcon },
        { name: 'List Shows', path: '/admin/list-shows', icon: ListIcon },
        { name: 'List Bookings', path: '/admin/list-bookings', icon: ListCollapseIcon },
        { name: 'Handle Request', path: '/admin/requests', icon: InboxIcon },
    ]

  return (
    <div className='flex h-[calc(100vh-64px)] w-full max-w-16 flex-col border-r border-line
    bg-surface pt-8 text-sm md:max-w-60'>

        <div className='flex flex-col items-center px-3'>
            {user?.imageUrl ? (
                <img src={user.imageUrl} alt={name}
                className='h-11 w-11 rounded-full object-cover md:h-14 md:w-14' />
            ) : (
                <div className='grid h-11 w-11 place-items-center rounded-full bg-primary
                text-[0.7rem] tracking-[0.1em] text-canvas md:h-14 md:w-14 md:text-sm'>
                    {initials}
                </div>
            )}
            <p className='mt-3 text-center text-[0.68rem] uppercase tracking-[0.2em] text-muted max-md:hidden'>
                {name}
            </p>
        </div>

        <div className='mt-8 w-full'>
            {adminNavlinks.map((link, index)=>(
                <NavLink key={index} to={link.path} end className={({isActive}) => `relative flex
                items-center gap-3 border-l-2 py-3 max-md:justify-center min-md:pl-8 transition
                ${isActive
                    ? 'border-primary bg-accent-soft text-ink'
                    : 'border-transparent text-muted hover:text-ink'}`}>
                    <link.icon className="h-4.5 w-4.5" />
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] max-md:hidden">{link.name}</p>
                </NavLink>
            ))}
        </div>
    </div>
  )
}

export default AdminSidebar
