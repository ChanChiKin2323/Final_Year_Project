import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

const Pagination = ({ page, pageCount, onChange }) => {
  if (pageCount <= 1) return null

  const go = (next) => {
    onChange(next)
    scrollTo(0, 0)
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button type="button" onClick={() => go(page - 1)} disabled={page === 1}
      className="grid h-9 w-9 cursor-pointer place-items-center border border-line transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Previous page">
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted">
        Page {page} of {pageCount}
      </p>
      <button type="button" onClick={() => go(page + 1)} disabled={page === pageCount}
      className="grid h-9 w-9 cursor-pointer place-items-center border border-line transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Next page">
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Pagination
