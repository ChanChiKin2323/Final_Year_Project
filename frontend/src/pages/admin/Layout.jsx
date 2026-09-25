import AdminNavbar from '../../components/admin/AdminNavbar'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className='min-h-screen bg-canvas'>
      <AdminNavbar />
      <div className='flex'>
        <AdminSidebar/>
        <div className='h-[calc(100vh-64px)] flex-1 overflow-y-auto px-5 py-10 md:px-10'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout
