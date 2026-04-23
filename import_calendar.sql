-- ================================================
-- PSG Calendar 2025/2026 — generated SQL
-- ================================================

-- TEAMS
INSERT INTO teams (name, default_stadium) VALUES
  ('Paris Saint-Germain', 'Parc des Princes'),
  ('Tottenham Hotspur FC', NULL),
  ('FC Nantes', 'Stade de la Beaujoire - Louis Fonteneau'),
  ('Angers SCO', 'Stade Raymond Kopa'),
  ('Toulouse FC', 'Stadium de Toulouse'),
  ('Racing Club de Lens', 'Stade Bollaert-Delelis'),
  ('Atalanta Bergamo', NULL),
  ('Olympique de Marseille', 'Orange Vélodrome'),
  ('AJ Auxerre', 'Stade de l''Abbé Deschamps'),
  ('FC Barcelona', 'Estadi Olímpic Lluís Companys'),
  ('LOSC', 'Decathlon Arena - Stade Pierre-Mauroy'),
  ('RC Strasbourg', 'Stade de la Meinau'),
  ('Bayer 04 Leverkusen', 'BayArena'),
  ('Stade Brestois 29', 'Stade Francis-Le Blé'),
  ('FC Lorient', 'Stade du Moustoir - Yves Allainmat'),
  ('OGC Nice', 'Allianz Riviera'),
  ('FC Bayern München', 'Allianz Arena'),
  ('Olympique Lyonnais', 'Groupama Stadium'),
  ('Le Havre AC', 'Stade Océane'),
  ('AS Monaco', 'Stade Louis-II'),
  ('Stade Rennais', 'Roazhon Park'),
  ('Athletic Club', 'Estadio de San Mamés'),
  ('FC Metz', 'Stade Saint-Symphorien'),
  ('Vendée Fontenay Foot', 'Stade de la Beaujoire - Louis Fonteneau'),
  ('Paris FC', 'Stade Jean Bouin'),
  ('Sporting Clube de Portugal', 'Estádio José Alvalade'),
  ('Newcastle United FC', NULL),
  ('Chelsea FC', 'Stamford Bridge'),
  ('Liverpool FC', 'Anfield')
ON CONFLICT (name) DO UPDATE SET default_stadium = EXCLUDED.default_stadium;

-- COMPETITIONS
INSERT INTO competitions (name) VALUES
  ('UEFA Super Cup'),
  ('French Ligue 1'),
  ('UEFA Champions League'),
  ('Coupe de France'),
  ('French Champions'' Trophy')
ON CONFLICT (name) DO NOTHING;

-- MATCHES
-- Paris Saint-Germain vs Tottenham Hotspur FC · 2025-08-13 (pens 4-3)
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-08-13', '19:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Tottenham Hotspur FC'), (SELECT id FROM competitions WHERE name = 'UEFA Super Cup'), 2, 2, 'played', 'Bluenergy Stadium');
-- FC Nantes vs Paris Saint-Germain · 2025-08-17
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-08-17', '18:45', (SELECT id FROM teams WHERE name = 'FC Nantes'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 0, 1, 'played', 'Stade de la Beaujoire - Louis Fonteneau');
-- Paris Saint-Germain vs Angers SCO · 2025-08-22
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-08-22', '18:45', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Angers SCO'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 0, 'played', 'Parc des Princes');
-- Toulouse FC vs Paris Saint-Germain · 2025-08-30
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-08-30', '19:05', (SELECT id FROM teams WHERE name = 'Toulouse FC'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 3, 6, 'played', 'Stadium de Toulouse');
-- Paris Saint-Germain vs Racing Club de Lens · 2025-09-14
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-09-14', '15:15', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Racing Club de Lens'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 2, 0, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs Atalanta Bergamo · 2025-09-17
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-09-17', '19:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Atalanta Bergamo'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 4, 0, 'played', 'Parc des Princes');
-- Olympique de Marseille vs Paris Saint-Germain · 2025-09-22
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-09-22', '18:00', (SELECT id FROM teams WHERE name = 'Olympique de Marseille'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 0, 'played', 'Orange Vélodrome');
-- Paris Saint-Germain vs AJ Auxerre · 2025-09-27
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-09-27', '19:05', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'AJ Auxerre'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 2, 0, 'played', 'Parc des Princes');
-- FC Barcelona vs Paris Saint-Germain · 2025-10-01
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-10-01', '19:00', (SELECT id FROM teams WHERE name = 'FC Barcelona'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 1, 2, 'played', 'Estadi Olímpic Lluís Companys');
-- LOSC vs Paris Saint-Germain · 2025-10-05
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-10-05', '18:45', (SELECT id FROM teams WHERE name = 'LOSC'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 1, 'played', 'Decathlon Arena - Stade Pierre-Mauroy');
-- Paris Saint-Germain vs RC Strasbourg · 2025-10-17
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-10-17', '18:45', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'RC Strasbourg'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 3, 3, 'played', 'Parc des Princes');
-- Bayer 04 Leverkusen vs Paris Saint-Germain · 2025-10-21
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-10-21', '19:00', (SELECT id FROM teams WHERE name = 'Bayer 04 Leverkusen'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 2, 7, 'played', 'BayArena');
-- Stade Brestois 29 vs Paris Saint-Germain · 2025-10-25
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-10-25', '15:00', (SELECT id FROM teams WHERE name = 'Stade Brestois 29'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 0, 3, 'played', 'Stade Francis-Le Blé');
-- FC Lorient vs Paris Saint-Germain · 2025-10-29
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-10-29', '18:00', (SELECT id FROM teams WHERE name = 'FC Lorient'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 1, 'played', 'Stade du Moustoir - Yves Allainmat');
-- Paris Saint-Germain vs OGC Nice · 2025-11-01
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-11-01', '16:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'OGC Nice'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 0, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs FC Bayern München · 2025-11-04
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-11-04', '20:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'FC Bayern München'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 1, 2, 'played', 'Parc des Princes');
-- Olympique Lyonnais vs Paris Saint-Germain · 2025-11-09
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-11-09', '19:45', (SELECT id FROM teams WHERE name = 'Olympique Lyonnais'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 2, 3, 'played', 'Groupama Stadium');
-- Paris Saint-Germain vs Le Havre AC · 2025-11-22
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-11-22', '20:05', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Le Havre AC'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 3, 0, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs Tottenham Hotspur FC · 2025-11-26
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-11-26', '20:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Tottenham Hotspur FC'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 5, 3, 'played', 'Parc des Princes');
-- AS Monaco vs Paris Saint-Germain · 2025-11-29
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-11-29', '16:00', (SELECT id FROM teams WHERE name = 'AS Monaco'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 0, 'played', 'Stade Louis-II');
-- Paris Saint-Germain vs Stade Rennais · 2025-12-06
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-12-06', '20:05', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Stade Rennais'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 5, 0, 'played', 'Parc des Princes');
-- Athletic Club vs Paris Saint-Germain · 2025-12-10
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-12-10', '20:00', (SELECT id FROM teams WHERE name = 'Athletic Club'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 0, 0, 'played', 'Estadio de San Mamés');
-- FC Metz vs Paris Saint-Germain · 2025-12-13
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-12-13', '18:00', (SELECT id FROM teams WHERE name = 'FC Metz'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 2, 3, 'played', 'Stade Saint-Symphorien');
-- Vendée Fontenay Foot vs Paris Saint-Germain · 2025-12-20
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2025-12-20', '20:00', (SELECT id FROM teams WHERE name = 'Vendée Fontenay Foot'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'Coupe de France'), 0, 4, 'played', 'Stade de la Beaujoire - Louis Fonteneau');
-- Paris Saint-Germain vs Paris FC · 2026-01-04
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-01-04', '19:45', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Paris FC'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 2, 1, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs Olympique de Marseille · 2026-01-08 (pens 4-1)
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-01-08', '18:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Olympique de Marseille'), (SELECT id FROM competitions WHERE name = 'French Champions'' Trophy'), 6, 3, 'played', 'Jaber Al-Ahmad International Stadium');
-- Paris Saint-Germain vs Paris FC · 2026-01-12
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-01-12', '20:10', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Paris FC'), (SELECT id FROM competitions WHERE name = 'Coupe de France'), 0, 1, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs LOSC · 2026-01-16
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-01-16', '20:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'LOSC'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 3, 0, 'played', 'Parc des Princes');
-- Sporting Clube de Portugal vs Paris Saint-Germain · 2026-01-20
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-01-20', '20:00', (SELECT id FROM teams WHERE name = 'Sporting Clube de Portugal'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 2, 1, 'played', 'Estádio José Alvalade');
-- AJ Auxerre vs Paris Saint-Germain · 2026-01-23
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-01-23', '19:00', (SELECT id FROM teams WHERE name = 'AJ Auxerre'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 0, 1, 'played', 'Stade de l''Abbé Deschamps');
-- Paris Saint-Germain vs Newcastle United FC · 2026-01-28
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-01-28', '20:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Newcastle United FC'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 1, 1, 'played', 'Parc des Princes');
-- RC Strasbourg vs Paris Saint-Germain · 2026-02-01
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-02-01', '19:45', (SELECT id FROM teams WHERE name = 'RC Strasbourg'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 2, 'played', 'Stade de la Meinau');
-- Paris Saint-Germain vs Olympique de Marseille · 2026-02-08
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-02-08', '19:45', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Olympique de Marseille'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 5, 0, 'played', 'Parc des Princes');
-- Stade Rennais vs Paris Saint-Germain · 2026-02-13
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-02-13', '18:00', (SELECT id FROM teams WHERE name = 'Stade Rennais'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 3, 1, 'played', 'Roazhon Park');
-- AS Monaco vs Paris Saint-Germain · 2026-02-17
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-02-17', '20:00', (SELECT id FROM teams WHERE name = 'AS Monaco'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 2, 3, 'played', 'Stade Louis-II');
-- Paris Saint-Germain vs FC Metz · 2026-02-21
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-02-21', '20:05', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'FC Metz'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 3, 0, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs AS Monaco · 2026-02-25
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-02-25', '20:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'AS Monaco'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 2, 2, 'played', 'Parc des Princes');
-- Le Havre AC vs Paris Saint-Germain · 2026-02-28
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-02-28', '20:05', (SELECT id FROM teams WHERE name = 'Le Havre AC'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 0, 1, 'played', 'Stade Océane');
-- Paris Saint-Germain vs AS Monaco · 2026-03-06
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-03-06', '19:45', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'AS Monaco'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 3, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs Chelsea FC · 2026-03-11
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-03-11', '20:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Chelsea FC'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 5, 2, 'played', 'Parc des Princes');
-- Chelsea FC vs Paris Saint-Germain · 2026-03-17
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-03-17', '20:00', (SELECT id FROM teams WHERE name = 'Chelsea FC'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 0, 3, 'played', 'Stamford Bridge');
-- OGC Nice vs Paris Saint-Germain · 2026-03-21
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-03-21', '20:05', (SELECT id FROM teams WHERE name = 'OGC Nice'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 0, 4, 'played', 'Allianz Riviera');
-- Paris Saint-Germain vs Toulouse FC · 2026-04-03
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-04-03', '18:45', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Toulouse FC'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 3, 1, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs Liverpool FC · 2026-04-08
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-04-08', '19:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Liverpool FC'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 2, 0, 'played', 'Parc des Princes');
-- Liverpool FC vs Paris Saint-Germain · 2026-04-14
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-04-14', '19:00', (SELECT id FROM teams WHERE name = 'Liverpool FC'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), 0, 2, 'played', 'Anfield');
-- Paris Saint-Germain vs Olympique Lyonnais · 2026-04-19
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-04-19', '18:45', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Olympique Lyonnais'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), 1, 2, 'played', 'Parc des Princes');
-- Paris Saint-Germain vs FC Nantes · 2026-04-22
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-04-22', '17:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'FC Nantes'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), NULL, NULL, 'upcoming', 'Parc des Princes');
-- Angers SCO vs Paris Saint-Germain · 2026-04-25
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-04-25', '17:00', (SELECT id FROM teams WHERE name = 'Angers SCO'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), NULL, NULL, 'upcoming', 'Stade Raymond Kopa');
-- Paris Saint-Germain vs FC Bayern München · 2026-04-28
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-04-28', '19:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'FC Bayern München'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), NULL, NULL, 'upcoming', 'Parc des Princes');
-- Paris Saint-Germain vs FC Lorient · 2026-05-02
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-05-02', '15:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'FC Lorient'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), NULL, NULL, 'upcoming', 'Parc des Princes');
-- FC Bayern München vs Paris Saint-Germain · 2026-05-06
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-05-06', '19:00', (SELECT id FROM teams WHERE name = 'FC Bayern München'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'UEFA Champions League'), NULL, NULL, 'upcoming', 'Allianz Arena');
-- Paris Saint-Germain vs Stade Brestois 29 · 2026-05-10
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-05-10', '19:00', (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM teams WHERE name = 'Stade Brestois 29'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), NULL, NULL, 'upcoming', 'Parc des Princes');
-- Racing Club de Lens vs Paris Saint-Germain · 2026-05-13
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-05-13', '19:00', (SELECT id FROM teams WHERE name = 'Racing Club de Lens'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), NULL, NULL, 'upcoming', 'Stade Bollaert-Delelis');
-- Paris FC vs Paris Saint-Germain · 2026-05-17
INSERT INTO matches (match_date, kickoff_time, home_team_id, away_team_id, competition_id, home_score, away_score, status, venue_name)
VALUES ('2026-05-17', '19:00', (SELECT id FROM teams WHERE name = 'Paris FC'), (SELECT id FROM teams WHERE name = 'Paris Saint-Germain'), (SELECT id FROM competitions WHERE name = 'French Ligue 1'), NULL, NULL, 'upcoming', 'Stade Jean Bouin');