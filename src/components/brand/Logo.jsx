const Logo = ({ withWordmark = true, className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path d="M20.8 11.2a6.8 6.8 0 1 0 0 9.6" fill="none" stroke="#F2EDE3" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.2" fill="#F2EDE3" />
      </svg>
      {withWordmark && (
        <span className="font-display text-xl font-semibold leading-none tracking-[0.18em]">
          CINEMORA
        </span>
      )}
    </span>
  )
}

export default Logo
