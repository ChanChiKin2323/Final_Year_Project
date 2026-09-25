import MovieSection from '../components/MovieSection'
import FeaturedSection from '../components/FeaturedSection'
import TrailersSection from '../components/TrailersSection'

const steps = [
  { no: '01', title: 'Pick a film', text: 'Everything currently on the bill, with runtimes and ratings.' },
  { no: '02', title: 'Pick a night', text: 'Choose a date, then the screening time that suits you.' },
  { no: '03', title: 'Pick a seat', text: 'Up to five seats per booking, held the moment you confirm.' },
]

const Home = () => {
  return (
    <>
      <MovieSection />

      <section className='border-b border-line bg-canvas'>
        <div className='mx-auto grid max-w-7xl gap-px bg-line px-0 md:grid-cols-3'>
          {steps.map((step) => (
            <div key={step.no} className='bg-canvas px-5 py-10 md:px-10'>
              <p className='font-display text-3xl text-accent'>{step.no}</p>
              <p className='mt-4 text-sm uppercase tracking-[0.18em]'>{step.title}</p>
              <p className='mt-3 text-sm leading-relaxed text-muted'>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <FeaturedSection />
      <TrailersSection />
    </>
  )
}

export default Home
