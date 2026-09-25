const IMAGE_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/original'

const imagePath = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${IMAGE_BASE}${path}`
}

export default imagePath
