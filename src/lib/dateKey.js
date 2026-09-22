// "2026-10-31" parsed with new Date() is treated as UTC midnight, which shifts
// the day for some timezones. Build a local date instead.
const parseDateKey = (key) => {
    const [year, month, day] = String(key).split('-').map(Number)
    return new Date(year, month - 1, day)
}

export default parseDateKey
