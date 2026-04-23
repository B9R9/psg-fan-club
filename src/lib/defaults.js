export const DEFAULT_RESULTS = [
  { id:1, home:'PSG', away:'Marseille', scoreHome:4, scoreAway:1, competition:'Ligue 1', date:'2025-04-13' },
  { id:2, home:'Barcelona', away:'PSG', scoreHome:3, scoreAway:4, competition:'Champions League', date:'2025-04-09' },
  { id:3, home:'PSG', away:'Nantes', scoreHome:3, scoreAway:0, competition:'Ligue 1', date:'2025-04-05' },
  { id:4, home:'Lyon', away:'PSG', scoreHome:1, scoreAway:1, competition:'Ligue 1', date:'2025-03-30' },
  { id:5, home:'PSG', away:'Barcelona', scoreHome:2, scoreAway:1, competition:'Champions League', date:'2025-03-15' },
  { id:6, home:'PSG', away:'Montpellier', scoreHome:5, scoreAway:0, competition:'Ligue 1', date:'2025-03-22' },
]

export const DEFAULT_CALENDAR = [
  { id:1, home:'PSG', away:'Marseille', competition:'Ligue 1 · Classique', date:'2025-04-26', time:'21:00', venue:'home' },
  { id:2, home:'Arsenal', away:'PSG', competition:'Champions League Semi-Final', date:'2025-04-30', time:'21:00', venue:'away' },
  { id:3, home:'PSG', away:'Rennes', competition:'Ligue 1', date:'2025-05-04', time:'17:00', venue:'home' },
  { id:4, home:'PSG', away:'Arsenal', competition:'Champions League SF 2nd Leg', date:'2025-05-07', time:'21:00', venue:'home' },
  { id:5, home:'Monaco', away:'PSG', competition:'Ligue 1', date:'2025-05-10', time:'21:00', venue:'away' },
  { id:6, home:'PSG', away:'TBD', competition:'Champions League Final · Munich', date:'2025-05-24', time:'21:00', venue:'neutral' },
]

export const DEFAULT_EVENTS = [
  { id:1, name:'Match Night — PSG vs Marseille', date:'2025-04-26', time:'21:00', venue:'Bar Loose, Annankatu 21, Helsinki', mapUrl:'https://maps.google.com/?q=Bar+Loose+Annankatu+21+Helsinki', featured:true },
  { id:2, name:'Watch Party — Ligue 1 Final Day', date:'2025-05-10', time:'19:00', venue:"Molly Malone's, Kaisaniemenkatu 1C", mapUrl:'https://maps.google.com/?q=Molly+Malones+Helsinki', featured:false },
  { id:3, name:'Champions League Final Watch', date:'2025-05-24', time:'20:00', venue:'TBA — Helsinki City Centre', mapUrl:'#', featured:false },
  { id:4, name:'End of Season Fan Gathering', date:'2025-06-14', time:'18:00', venue:'Ravintola Teatteri, Pohjoisesplanadi', mapUrl:'https://maps.google.com/?q=Ravintola+Teatteri+Helsinki', featured:false },
]

export const DEFAULT_HISTORY = [
  { id:1, author:'Mikael H.', title:'My first time at the Parc — UCL 2023', text:'Nothing compares to that night. Walking in through Gate K, the roar of the Virage Auteuil, the flares…', type:'video', date:'2023-03' },
  { id:2, author:'Laura T.', title:'Helsinki fan meet 2024', text:'25 Parisiens in Helsinki, glued to the screen. What a night.', type:'photo', date:'2024-11' },
  { id:3, author:'Janne K. — Founder', title:'How it all started', text:'Six friends, one group chat, and a love for Le Rouge et Bleu. Today we are 200+.', type:'text', date:'2018' },
]

export const DEFAULT_SETTINGS = {
  joinUrl: 'https://helsinkipsg.fi/join',
  videoUrl: 'https://www.youtube.com/embed/J_SJNftbFrk?si=kcBhasuoZdPlnCB9',
  heroTitle: 'Helsinki PSG Supporters Club',
  joinBg: null,
}

export const mapResult   = r => ({ id:r.id, home:r.home, away:r.away, scoreHome:r.score_home, scoreAway:r.score_away, competition:r.competition, date:r.date })
export const toDbResult  = r => ({ id:r.id, home:r.home, away:r.away, score_home:r.scoreHome, score_away:r.scoreAway, competition:r.competition, date:r.date })
export const mapEvent    = r => ({ id:r.id, name:r.name, date:r.date, time:r.time, venue:r.venue, mapUrl:r.map_url, featured:r.featured })
export const toDbEvent   = r => { const o = { name:r.name, date:r.date, time:r.time, venue:r.venue, map_url:r.mapUrl, featured:r.featured }; if (r.id) o.id = r.id; return o }
export const mapMember   = r => {
  let addedAt = r.added_at || ''
  if (addedAt) {
    const d = new Date(addedAt)
    if (!isNaN(d)) {
      const fmt = new Intl.DateTimeFormat('fi-FI', {
        timeZone: 'Europe/Helsinki',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
      // fi-FI gives "dd.mm.yyyy klo hh.mm" — normalize to "dd.mm.yyyy hh:mm"
      const parts = fmt.formatToParts(d)
      const get = t => parts.find(p => p.type === t)?.value ?? '00'
      addedAt = `${get('day')}.${get('month')}.${get('year')}`
    }
  }
  return { id:r.id, email:r.email, name:r.name||'', addedAt }
}
export const mapSettings = r => ({ joinUrl:r.join_url, videoUrl:r.video_url, heroTitle:r.hero_title||'Helsinki PSG Supporters Club', joinBg:r.join_bg||null })

export const MATCHES_SELECT = `
  id, match_date, kickoff_time, home_score, away_score, status, venue_name,
  home_team_id, away_team_id, competition_id,
  home_team:teams!matches_home_team_id_fkey(id, name),
  away_team:teams!matches_away_team_id_fkey(id, name),
  competition:competitions!matches_competition_id_fkey(id, name)
`

const isPsgTeam = name => !!name && (name.toLowerCase().includes('psg') || name.toLowerCase().includes('paris'))

export const mapMatch = r => ({
  id: r.id,
  home: r.home_team?.name || '',
  away: r.away_team?.name || '',
  competition: r.competition?.name || '',
  date: r.match_date,
  time: r.kickoff_time,
  venue: isPsgTeam(r.home_team?.name) ? 'home' : 'away',
  status: r.status,
  scoreHome: r.home_score,
  scoreAway: r.away_score,
  homeTeamId: r.home_team_id,
  awayTeamId: r.away_team_id,
  competitionId: r.competition_id,
  venueName: r.venue_name || '',
})

export const toDbMatch = m => {
  const row = {
    match_date: m.date,
    kickoff_time: m.time || null,
    home_team_id: m.homeTeamId,
    away_team_id: m.awayTeamId,
    competition_id: m.competitionId || null,
    home_score: m.scoreHome ?? null,
    away_score: m.scoreAway ?? null,
    status: m.status,
    venue_name: m.venueName || null,
  }
  if (m.id) row.id = m.id
  return row
}

export const MATCH_STATUS = { PLAYED: 'played', UPCOMING: 'upcoming' }
