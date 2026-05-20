const PSG_ALIASES = new Set([
  'psg',
  'paris sg',
  'paris saint germain',
  'paris saint-germain',
  'paris st germain',
  'paris st-germain',
]);

export function normalizeClubName(input, fallback = 'PSG') {
  const raw = String(input || fallback || '').trim();
  if (!raw) return 'PSG';

  const key = raw
    .toLowerCase()
    .replace(/[\u2019']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (PSG_ALIASES.has(key)) return 'PSG';

  return raw
    .split(/\s+/)
    .map((part) => {
      if (!part) return part;
      if (/^[A-Z]{2,}$/.test(part)) return part;
      return part[0].toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

export function normalizeSeasonLabel(input) {
  if (!input) return null;

  const cleaned = String(input)
    .trim()
    .replace(/[–—-]/g, '/')
    .replace(/\s+/g, '');

  const m = cleaned.match(/(\d{2,4})\/(\d{2,4})/);
  if (!m) return null;

  const a = toTwoDigits(m[1]);
  const b = toTwoDigits(m[2]);
  return `${a}/${b}`;
}

function toTwoDigits(value) {
  if (value.length <= 2) return value.padStart(2, '0');
  return value.slice(-2);
}

export function seasonStartYear(season) {
  const m = String(season || '').match(/^(\d{2})\/(\d{2})$/);
  if (!m) return Number.NEGATIVE_INFINITY;
  const yy = Number(m[1]);
  return yy < 50 ? 2000 + yy : 1900 + yy;
}

export function mapPosition(pos) {
  const text = String(pos || '').toLowerCase();
  if (!text) return 'MID';

  const compact = text.replace(/[^a-z]/g, '');
  if (compact === 'gk' || compact === 'goalkeeper') return 'GK';
  if (compact === 'def' || compact === 'df' || compact === 'defender') return 'DEF';
  if (compact === 'mid' || compact === 'mf' || compact === 'midfielder') return 'MID';
  if (compact === 'fwd' || compact === 'fw' || compact === 'for' || compact === 'forward') return 'FWD';

  if (text.includes('goal')) return 'GK';
  if (text.includes('keeper')) return 'GK';
  if (/\bgk\b/.test(text)) return 'GK';

  // Prefer attacking role when mixed labels are present (e.g. "FW, MF").
  if (text.includes('wing')) return 'FWD';
  if (text.includes('for')) return 'FWD';
  if (/\bfw\b/.test(text)) return 'FWD';
  if (text.includes('striker')) return 'FWD';
  if (/\bst\b/.test(text) || /\bcf\b/.test(text)) return 'FWD';

  if (text.includes('def')) return 'DEF';
  if (/\bdf\b/.test(text)) return 'DEF';
  if (text.includes('back')) return 'DEF';

  if (text.includes('mid')) return 'MID';
  if (/\bmf\b/.test(text)) return 'MID';

  return 'MID';
}

function parseHistoricToken(token, defaultClub = 'PSG') {
  const raw = String(token || '').trim();
  if (!raw) return null;

  let left = raw;
  let right = '';
  const idx = raw.indexOf(':');

  if (idx >= 0) {
    left = raw.slice(0, idx).trim();
    right = raw.slice(idx + 1).trim();
  }

  let season = normalizeSeasonLabel(left);
  let club = right;

  if (!season) {
    season = normalizeSeasonLabel(right);
    club = season ? left : right || left;
  }

  if (!season) return null;

  return {
    season,
    club: normalizeClubName(club, defaultClub),
  };
}

export function normalizeSeasonEntries(entries, defaultClub = 'PSG') {
  const unique = new Map();

  for (const entry of entries || []) {
    const season = normalizeSeasonLabel(entry?.season);
    if (!season) continue;
    const club = normalizeClubName(entry?.club, defaultClub);
    const key = `${season}|${club}`;
    if (!unique.has(key)) {
      unique.set(key, { season, club });
    }
  }

  return [...unique.values()].sort((a, b) => seasonStartYear(b.season) - seasonStartYear(a.season));
}

export function parseHistoric(historic, defaultClub = 'PSG') {
  if (!historic) return [];

  const entries = String(historic)
    .split(',')
    .map((token) => parseHistoricToken(token, defaultClub))
    .filter(Boolean);

  return normalizeSeasonEntries(entries, defaultClub);
}

export function buildHistoric(entries) {
  if (!entries?.length) return null;
  return entries.map((entry) => `${entry.season}:${entry.club}`).join(',');
}

export function parseWikipediaYearsToSeasons(yearsText, defaultClub = 'PSG') {
  const raw = String(yearsText || '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\u00a0/g, ' ')
    .trim();

  if (!raw) return [];

  const chunks = raw.split(/[,;]+/).map((v) => v.trim()).filter(Boolean);
  const seasons = [];

  for (const chunk of chunks) {
    const normalizedChunk = chunk.replace(/[–—]/g, '-').replace(/\s+/g, '');

    const openRange = normalizedChunk.match(/^(\d{4})-(present)?$/i);
    if (openRange) {
      const start = Number(openRange[1]);
      const end = currentSeasonStartYear() + 1;

      for (let y = start; y < end; y += 1) {
        const season = `${String(y).slice(-2)}/${String(y + 1).slice(-2)}`;
        seasons.push({ season, club: defaultClub });
      }
      continue;
    }

    const yearRange = normalizedChunk.match(/^(\d{4})-(\d{2}|\d{4})$/);
    if (yearRange) {
      const start = Number(yearRange[1]);
      let end = Number(yearRange[2]);
      if (end < 100) end += Math.floor(start / 100) * 100;
      if (end < start) end += 100;

      for (let y = start; y < end; y += 1) {
        const season = `${String(y).slice(-2)}/${String(y + 1).slice(-2)}`;
        seasons.push({ season, club: defaultClub });
      }
      continue;
    }

    const seasonLabel = normalizeSeasonLabel(normalizedChunk);
    if (seasonLabel) {
      seasons.push({ season: seasonLabel, club: defaultClub });
    }
  }

  return normalizeSeasonEntries(seasons, defaultClub);
}

function currentSeasonStartYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? year : year - 1;
}
