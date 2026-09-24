// Home-page trailers for the films currently on the Movies page.
// Each id is the official YouTube trailer listed for that title on TMDB.
const videos = [
  { id: 'H-43VeYGiPM', title: 'Coyote vs. Acme' },
  { id: 'LW6dpj1uCK8', title: 'Colony' },
  { id: '3oB9AxspVow', title: 'The End of Oak Street' },
  { id: 'ZSdOwt-G49w', title: 'Minions & Monsters' },
  { id: 'FKSdXH89jbo', title: 'Mutiny' },
  { id: 'f_bKjZeJBBI', title: 'The Odyssey' },
  { id: '8PAy3i9uU0A', title: 'One Last Shot' },
  { id: 'mNd1gb19A-c', title: 'Resident Evil' },
]

export const trailers = videos.map(({ id, title }) => ({
  title,
  videoUrl: `https://www.youtube.com/watch?v=${id}`,
  image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
}))

export default trailers
