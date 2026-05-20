-- Create trigger to auto-scrape stats when match status changes to 'played'
CREATE OR REPLACE FUNCTION auto_scrape_match_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed to 'played'
  IF NEW.status = 'played' AND (OLD.status != 'played' OR OLD.status IS NULL) THEN
    -- Queue the match for scraping - in production, this would call a webhook/function
    -- For now, we log it for manual processing
    RAISE NOTICE 'Match % status changed to played - should trigger scraping', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_scrape_on_match_played ON matches;

-- Create trigger
CREATE TRIGGER trigger_auto_scrape_on_match_played
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION auto_scrape_match_stats();
