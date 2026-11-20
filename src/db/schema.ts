// Idempotent schema: runs on every cold start.
export const schemaSql = /* sql */ `

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only a SHA-256 hash of the session token is stored, so a leaked
-- database dump can't be used to hijack sessions.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id           SERIAL PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min > 0),
  price_rsd    INTEGER NOT NULL CHECK (price_rsd >= 0)
);

CREATE TABLE IF NOT EXISTS appointments (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id),
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  status     TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS appointments_starts_at_idx ON appointments (starts_at) WHERE status = 'booked';
CREATE INDEX IF NOT EXISTS appointments_user_idx ON appointments (user_id);

INSERT INTO services (slug, name, description, duration_min, price_rsd) VALUES
  ('haircut',      'Haircut',          'Classic or modern cut, wash and styling.', 30, 1200),
  ('beard',        'Beard trim',       'Shape-up, hot towel and beard oil.',       20,  800),
  ('haircut-beard','Haircut + beard',  'The full package.',                         50, 1800),
  ('kids',         'Kids haircut',     'For the little ones, up to 12 years.',      20,  900)
ON CONFLICT (slug) DO NOTHING;
`;
