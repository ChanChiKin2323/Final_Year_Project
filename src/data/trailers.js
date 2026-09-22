// Trailer playlist for the home page. Thumbnails are derived from the video id,
// so nothing has to be stored locally.
const videos = [
  { id: 'Way9Dexny3w', title: 'Dune: Part Two' },
  { id: 'uYPbbksJxIg', title: 'Oppenheimer' },
  { id: 'mqqft2x_Aa4', title: 'The Batman' },
  { id: 'zSWdZVtXT7E', title: 'Interstellar' },
]

export const trailers = videos.map(({ id, title }) => ({
  title,
  videoUrl: `https://www.youtube.com/watch?v=${id}`,
  image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
}))

export default trailers
