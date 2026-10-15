export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const toHHMM = (min) => {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
export const floorTo = (min, step) => Math.floor(min / step) * step
export const ceilTo = (min, step) => Math.ceil(min / step) * step
