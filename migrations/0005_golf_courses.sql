-- Display names for the courses on the shared-bus schedule, keyed by the name
-- the partner publishes. Operations edit them in /ops/golf-courses/; the code
-- map (lib/golf-course-images.ts) is the seed and the fallback.
CREATE TABLE golf_courses (
  name TEXT PRIMARY KEY,
  name_en TEXT,
  name_ja TEXT,
  name_es TEXT,
  name_fr TEXT,
  name_zh_tw TEXT,
  area TEXT,
  photo TEXT,
  note TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);
