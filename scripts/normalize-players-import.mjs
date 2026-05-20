#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {
    input: 'sql/seed/players_bulk_import.sql',
    output: null,
    write: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--input' && argv[i + 1]) {
      args.input = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--output' && argv[i + 1]) {
      args.output = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--write') {
      args.write = true;
      continue;
    }
    if (token === '--help' || token === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/normalize-players-import.mjs [--input sql/seed/players_bulk_import.sql] [--output out.sql] [--write]

Behavior:
  - Reads INSERT tuples from public.players
  - Rebuilds seasons JSONB from historic when available
  - Normalizes club aliases (PSG-focused) and season format (YY/YY)
  - Sorts seasons from newest to oldest
  - Deduplicates by season+club

Examples:
  node scripts/normalize-players-import.mjs --input sql/seed/players_bulk_import.sql --write
  node scripts/normalize-players-import.mjs --input sql/seed/players_bulk_import.sql --output sql/seed/players_bulk_import.normalized.sql
`);
}

function decodeSqlStringLiteral(token) {
  if (token == null) return null;
  const trimmed = token.trim();
  if (trimmed.toUpperCase() === 'NULL') return null;

  const withoutCast = trimmed.replace(/::jsonb\s*$/i, '');
  if (!(withoutCast.startsWith("'") && withoutCast.endsWith("'"))) {
    return withoutCast;
  }

  const body = withoutCast.slice(1, -1);
  return body.replace(/''/g, "'");
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJsonb(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function splitColumns(columnsBlock) {
  return columnsBlock
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function findTupleRanges(valuesBlock, offset) {
  const ranges = [];
  let inQuote = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < valuesBlock.length; i += 1) {
    const ch = valuesBlock[i];

    if (ch === "'") {
      if (inQuote && valuesBlock[i + 1] === "'") {
        i += 1;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }

    if (inQuote) continue;

    if (ch === '(') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (ch === ')') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        ranges.push({
          start: offset + start,
          end: offset + i + 1,
        });
        start = -1;
      }
    }
  }

  return ranges;
}

function splitTupleValues(tupleText) {
  const inner = tupleText.trim().replace(/^\(/, '').replace(/\)$/, '');
  const values = [];
  let inQuote = false;
  let token = '';

  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];

    if (ch === "'") {
      token += ch;
      if (inQuote && inner[i + 1] === "'") {
        token += "'";
        i += 1;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }

    if (ch === ',' && !inQuote) {
      values.push(token.trim());
      token = '';
      continue;
    }

    token += ch;
  }

  if (token.trim().length) values.push(token.trim());
  return values;
}

function formatTuple(values) {
  const lines = ['('];
  for (let i = 0; i < values.length; i += 1) {
    const suffix = i < values.length - 1 ? ',' : '';
    lines.push(`${values[i]}${suffix}`);
  }
  lines.push(')');
  return lines.join('\n');
}

function normalizeClubName(club, fallback = 'PSG') {
  const source = (club || fallback || '').trim();
  if (!source) return 'PSG';

  const lower = source
    .toLowerCase()
    .replace(/[\u2019']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const psgAliases = new Set([
    'psg',
    'paris sg',
    'paris saint germain',
    'paris saint-germain',
    'paris st germain',
    'paris st-germain',
  ]);

  if (psgAliases.has(lower)) return 'PSG';

  return source
    .split(/\s+/)
    .map((part) => {
      if (/^[A-Z]{2,}$/.test(part)) return part;
      if (part.includes('-')) {
        return part
          .split('-')
          .map((x) => (x ? x[0].toUpperCase() + x.slice(1).toLowerCase() : x))
          .join('-');
      }
      return part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part;
    })
    .join(' ');
}

function normalizeSeasonLabel(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/[–—-]/g, '/').replace(/\s+/g, '');
  const match = cleaned.match(/(\d{2,4})\/(\d{2,4})/);
  if (!match) return null;

  const toTwoDigits = (value) => {
    if (value.length <= 2) return value.padStart(2, '0');
    return value.slice(-2);
  };

  const a = toTwoDigits(match[1]);
  const b = toTwoDigits(match[2]);
  return `${a}/${b}`;
}

function seasonStartYear(label) {
  const m = label.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return Number.NEGATIVE_INFINITY;
  const yy = Number(m[1]);
  return yy < 50 ? 2000 + yy : 1900 + yy;
}

function parseHistoricEntry(item, defaultClub) {
  const raw = item.trim();
  if (!raw) return null;

  let left = raw;
  let right = '';

  const colonIndex = raw.indexOf(':');
  if (colonIndex >= 0) {
    left = raw.slice(0, colonIndex).trim();
    right = raw.slice(colonIndex + 1).trim();
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

function normalizePlayerRecord(values, columns) {
  const idx = Object.fromEntries(columns.map((col, i) => [col, i]));
  const historicIdx = idx.historic;
  const seasonsIdx = idx.seasons;
  const clubIdx = idx.club;

  if (historicIdx == null || seasonsIdx == null || clubIdx == null) {
    return { values, changed: false };
  }

  const out = [...values];
  const defaultClub = normalizeClubName(decodeSqlStringLiteral(values[clubIdx]), 'PSG');
  out[clubIdx] = sqlString(defaultClub);

  const historicRaw = decodeSqlStringLiteral(values[historicIdx]);

  let entries = [];

  if (historicRaw) {
    entries = historicRaw
      .split(',')
      .map((item) => parseHistoricEntry(item, defaultClub))
      .filter(Boolean);
  }

  if (!entries.length) {
    const seasonsRaw = decodeSqlStringLiteral(values[seasonsIdx]);
    try {
      const parsed = JSON.parse(seasonsRaw || '[]');
      if (Array.isArray(parsed)) {
        entries = parsed
          .map((row) => {
            const season = normalizeSeasonLabel(row?.season ? String(row.season) : '');
            if (!season) return null;
            return {
              season,
              club: normalizeClubName(row?.club ? String(row.club) : defaultClub, defaultClub),
            };
          })
          .filter(Boolean);
      }
    } catch {
      entries = [];
    }
  }

  const unique = new Map();
  for (const entry of entries) {
    const key = `${entry.season}|${entry.club}`;
    if (!unique.has(key)) unique.set(key, entry);
  }

  const normalized = [...unique.values()].sort((a, b) => seasonStartYear(b.season) - seasonStartYear(a.season));

  if (normalized.length) {
    out[historicIdx] = sqlString(normalized.map((e) => `${e.season}:${e.club}`).join(','));
  } else {
    out[historicIdx] = 'NULL';
  }

  out[seasonsIdx] = sqlJsonb(normalized.map((e) => ({ club: e.club, season: e.season })));

  const changed = out.join('|') !== values.join('|');
  return { values: out, changed };
}

function normalizeSqlInsert(content) {
  const insertRegex = /insert\s+into\s+public\.players\s*\(([\s\S]*?)\)\s*values/gi;
  const match = insertRegex.exec(content);
  if (!match) {
    throw new Error('Could not find "insert into public.players (...) values" block.');
  }

  const columns = splitColumns(match[1]);
  const valuesStart = insertRegex.lastIndex;

  const tail = content.slice(valuesStart);
  const conflictMatch = /\bon\s+conflict\b/i.exec(tail);
  if (!conflictMatch) {
    throw new Error('Could not find ON CONFLICT section after values block.');
  }

  const conflictStart = valuesStart + conflictMatch.index;
  const valuesBlock = content.slice(valuesStart, conflictStart);

  const tupleRanges = findTupleRanges(valuesBlock, valuesStart);
  if (!tupleRanges.length) {
    throw new Error('No tuple values found in INSERT block.');
  }

  const replacements = [];
  let changedRows = 0;

  for (const range of tupleRanges) {
    const tupleText = content.slice(range.start, range.end);
    const tupleValues = splitTupleValues(tupleText);

    if (tupleValues.length !== columns.length) {
      continue;
    }

    const result = normalizePlayerRecord(tupleValues, columns);
    if (result.changed) changedRows += 1;

    replacements.push({
      start: range.start,
      end: range.end,
      text: formatTuple(result.values),
    });
  }

  let output = content;
  for (let i = replacements.length - 1; i >= 0; i -= 1) {
    const r = replacements[i];
    output = output.slice(0, r.start) + r.text + output.slice(r.end);
  }

  return {
    output,
    totalRows: tupleRanges.length,
    changedRows,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), args.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(inputPath, 'utf8');
  const { output, totalRows, changedRows } = normalizeSqlInsert(source);

  const outputPath = args.output ? path.resolve(process.cwd(), args.output) : inputPath;
  const shouldWrite = args.write || Boolean(args.output);

  if (shouldWrite) {
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`Normalized ${changedRows}/${totalRows} rows.`);
    console.log(`Wrote: ${outputPath}`);
    return;
  }

  console.log(`Normalized ${changedRows}/${totalRows} rows (dry run).`);
  console.log('Use --write to update file in place, or --output <file> to write a new file.');
}

main();
