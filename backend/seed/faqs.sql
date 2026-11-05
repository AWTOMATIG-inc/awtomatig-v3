-- Loads the six FAQs the Contact page showed before the CMS. Answers 2 to 6 were drafts from the start (only the first is from the design):
-- the owner should read them in the admin after the release. The cleaning landing page keeps its own questions in code, so they are not here.
-- Safe to run twice: a row whose id exists is left alone, so an edit made in the admin is never overwritten.
-- Run it with `npm run seed:faqs` (after the deploy), or paste it into a SQL client.

BEGIN;

INSERT INTO cms.faqs (id, status, sort_order, published_at, question, answer)
VALUES
  ('01a1b0c0-0000-7000-8000-000000000001', 'published', 0, now(), 'Do you work with existing websites or only new builds?', 'We can work with existing platforms, rebuilds, migrations and new infrastructure depending on what the current environment requires.'),
  ('01a1b0c0-0000-7000-8000-000000000002', 'published', 1, now(), 'Can you work with our existing CMS and systems?', 'Yes. We start by understanding the tools you already use, then build around them or connect them, and only replace what is holding the work back.'),
  ('01a1b0c0-0000-7000-8000-000000000003', 'published', 2, now(), 'Do you provide ongoing maintenance?', 'Yes. After launch we can support the processes and systems your business relies on, with fixes, updates and improvements as requirements evolve.'),
  ('01a1b0c0-0000-7000-8000-000000000004', 'published', 3, now(), 'Can you handle third-party integrations?', 'Yes. We connect websites, back-office tools, ERPs and ad platforms so data moves between them instead of being copied by hand.'),
  ('01a1b0c0-0000-7000-8000-000000000005', 'published', 4, now(), 'What happens before development starts?', 'We map the problem first: how the work runs today, where it gets stuck and what a better setup needs. Development starts once that is clear.'),
  ('01a1b0c0-0000-7000-8000-000000000006', 'published', 5, now(), 'How do we know what type of project we need?', 'You don’t need a defined solution. Tell us what is getting stuck and we will help identify whether it is a build, an ongoing operation or an improvement.')
ON CONFLICT (id) DO NOTHING;

COMMIT;
