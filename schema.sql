PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  custom_badge TEXT NOT NULL DEFAULT '',
  price_tier TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  max_people INTEGER NOT NULL CHECK (max_people BETWEEN 1 AND 9999),
  location TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  phone_required INTEGER NOT NULL DEFAULT 1,
  custom_questions TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  is_proxy INTEGER NOT NULL DEFAULT 0,
  proxy_name TEXT NOT NULL DEFAULT '',
  proxy_email TEXT NOT NULL DEFAULT '',
  answers TEXT NOT NULL DEFAULT '{}',
  checked_in INTEGER NOT NULL DEFAULT 0,
  registered_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE (event_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id, registered_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  blocked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_updated_at ON admin_login_attempts(updated_at);
