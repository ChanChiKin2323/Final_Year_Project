import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'

const getInitialTheme = () => {
    try {
        const saved = localStorage.getItem('theme')
        if (saved === 'light' || saved === 'dark') return saved
        return 'dark'
    } catch {
        return 'dark'
    }
}

const ThemeToggle = () => {

    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        try {
            localStorage.setItem('theme', theme)
        } catch {
            // storage can be blocked; the toggle still works for this session
        }
    }, [theme])

    const isDark = theme === 'dark'

  return (
    <button onClick={()=> setTheme(isDark ? 'light' : 'dark')}
    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    className='grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line
    transition hover:border-ink'>
        {isDark ? <SunIcon className='h-4 w-4'/> : <MoonIcon className='h-4 w-4'/>}
    </button>
  )
}

export default ThemeToggle
