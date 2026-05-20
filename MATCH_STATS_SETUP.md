# PSG Vue - Match Stats Scraper Configuration

## ✅ Completed Setup

Vous avez configuré le système de scraping Footmercato pour enrichir les cartes de match.

### 1. 📦 Migrations Created
- ✅ `20260520100000_add_match_stats_table.sql` - Creates `match_stats` table
- ✅ `20260520110000_add_auto_scrape_trigger.sql` - Auto-trigger on match status change

### 2. 🔧 Scraper Scripts Installed
- ✅ `src/scraper/footmercato.js` - Footmercato scraper module
- ✅ `src/commands/scrape-stats.js` - One-time scrape command  
- ✅ `src/commands/watch-matches.js` - Continuous watcher daemon
- ✅ `bin/cli.js` - Added new CLI commands

---

## ⚠️ IMPORTANT: Create match_stats Table

**You must run this SQL in Supabase to create the table:**

1. Go to: https://app.supabase.com/ → Your Project → SQL Editor
2. Click "+ New Query"  
3. **Copy ONLY the SQL below (NOT the markdown text)**
4. Paste it into the SQL editor
5. Click "RUN"

---

## 🔧 SQL - Copy Everything Below This Line

```sql
CREATE TABLE IF NOT EXISTS public.match_stats (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  formations JSONB,
  stats JSONB,
  player_performances JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_stats_match_id ON public.match_stats(match_id);

ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on match_stats" ON public.match_stats FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write on match_stats" ON public.match_stats FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on match_stats" ON public.match_stats FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
```

**After executing:** You should see "Query executed successfully" ✅

---

## 🚀 Usage

### Scrape last 10 matches once:
```bash
npm run psg-seed -- scrape-stats
```

### Check for newly played matches:
```bash
npm run psg-seed -- check-matches
```

### Run continuous watcher (checks every 15 minutes):
```bash
npm run psg-seed -- watch
# Or with custom interval:
npm run psg-seed -- watch 10  # every 10 minutes
```

### Scrape specific match:
```bash
npm run psg-seed -- scrape-stats [matchId]
```

---

## 🎯 How It Works

### Auto-Update After Match
1. When a match status changes to `played` in admin
2. Trigger automatically records the change
3. Next time watcher runs, it:
   - Finds newly played matches without stats
   - Scrapes Footmercato for formations/stats/performances
   - Stores data in `match_stats` table

### Display in MatchCard
- ✅ 5 tabs in MatchCard reveal stats when available:
  - Formations (4-3-3 vs 3-5-2)
  - Lineups (titulaires + remplaçants)
  - Events (goals, assists, changes)
  - Statistics (possession, shots, passes, etc.)
  - Performances (player ratings, minutes)

---

## 📊 Data Structure

```jsonb
{
  "formations": {
    "home": "4-3-3",
    "homeSystem": "4-3-3",
    "away": "3-5-2", 
    "awaySystem": "3-5-2"
  },
  "stats": {
    "home": {
      "possession": 58,
      "shots": 12,
      "shotsOnTarget": 5,
      "passes": 324,
      "passAccuracy": 87
    },
    "away": { }
  },
  "playerPerformances": {
    "home": [
      {
        "name": "Player Name",
        "position": "MID",
        "rating": 7.5,
        "minutesPlayed": 90
      }
    ],
    "away": [ ]
  }
}
```

---

## 🔄 Running in Production

### Option 1: Cron Job (Recommended)
Add to your crontab or server scheduler:
```bash
*/15 * * * * cd /path/to/psg-vue && npm run psg-seed -- check-matches >> logs/scraper.log 2>&1
```

### Option 2: Background Service
Use PM2 or supervisor:
```bash
npm run psg-seed -- watch 15 &
```

### Option 3: Cloud Function
Deploy `watch-matches.js` as a Google Cloud Function/AWS Lambda, triggered every 15 minutes.

---

## ⚠️ Known Limitations

- Footmercato HTML structure may change → scraper needs updates
- Some matches may not have detailed stats available
- Rate limiting: 2 second delay between scrapes (adjust as needed)
- Web scraping may violate Footmercato's ToS (consider using official API if available)

---

## 🎮 Test the MatchCard

1. Go to app in browser (results section)
2. Click any match card
3. Scroll through tabs - stats appear if scraped data exists

✨ Done! Your match stats system is ready to go!
