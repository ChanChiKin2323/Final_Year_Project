const Loading = () => {
  return (
    <div className='flex h-[70vh] flex-col items-center justify-center gap-5'>
      <div className='flex items-end gap-1.5'>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className='h-9 w-1.5 animate-pulse bg-primary'
          style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </div>
      <p className='text-[0.7rem] uppercase tracking-[0.28em] text-muted'>Rolling film</p>
    </div>
  )
}

export default Loading
