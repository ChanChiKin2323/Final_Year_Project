const Title = ({ text1, text2 }) => {
  return (
    <div className='border-b border-ink pb-5'>
        <p className='text-[0.68rem] uppercase tracking-[0.3em] text-accent'>{text1}</p>
        <h1 className='mt-2 font-display text-3xl'>{text2}</h1>
    </div>
  )
}

export default Title
