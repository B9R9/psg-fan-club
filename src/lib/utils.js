export function resultOutcome(r) {
  const psgHome = r.home.toUpperCase().includes('PSG')
  const psgAway = r.away.toUpperCase().includes('PSG')
  if (psgHome) return r.scoreHome > r.scoreAway ? 'win' : r.scoreHome < r.scoreAway ? 'loss' : 'draw'
  if (psgAway) return r.scoreAway > r.scoreHome ? 'win' : r.scoreAway < r.scoreHome ? 'loss' : 'draw'
  return 'draw'
}

export function toHelsinkiTime(dateStr, timeStr) {
  if (!timeStr || !dateStr) return timeStr
  try {
    const hhmm = timeStr.slice(0, 5) // handles both "19:00" and "19:00:00"
    const dt = new Date(`${dateStr}T${hhmm}:00Z`)
    return new Intl.DateTimeFormat('fi-FI', {
      timeZone: 'Europe/Helsinki',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(dt)
  } catch {
    return timeStr
  }
}

export function fmtDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return {
      day: d.getDate(),
      month: d.toLocaleString('en', { month: 'short' }),
      weekday: d.toLocaleString('en', { weekday: 'long' }),
    }
  } catch {
    return { day: dateStr, month: '', weekday: '' }
  }
}

export function fmtEventDate(dateStr) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return dateStr }
}

export function fmtDay(dateStr) {
  try { return new Date(dateStr + 'T12:00:00').getDate() } catch { return dateStr }
}

export function fmtMon(dateStr) {
  try { return new Date(dateStr + 'T12:00:00').toLocaleString('en', { month: 'short' }) } catch { return '' }
}

export function buildVideoUrl(src) {
  if (!src) return src
  // Extract video ID from any YouTube URL format
  const m = src.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  if (m) {
    const vid = m[1]
    return `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&controls=0&rel=0&modestbranding=1&playlist=${vid}`
  }
  return src
}
