-- Loads the website's trust numbers (values confirmed by the owner on 2026-11-05). Safe to run twice: a figure that already has a
-- row is left alone, so an edit made in the admin is never overwritten. Run it with `npm run seed:site-metrics` (after the deploy
-- has migrated the database), or paste it into a SQL client. The website shows these same values even before the seed runs.

INSERT INTO cms.site_metrics (key, value)
VALUES
  ('years_experience', '5+'),
  ('businesses_supported', '50+'),
  ('client_retention', '95%'),
  ('systems_delivered', '25+'),
  ('projects_completed', '75+'),
  ('client_systems_supported', '35+'),
  ('google_rating', '4.8'),
  ('clutch_rating', '4.8'),
  ('fiverr_rating', '4.8')
ON CONFLICT (key) DO NOTHING;
