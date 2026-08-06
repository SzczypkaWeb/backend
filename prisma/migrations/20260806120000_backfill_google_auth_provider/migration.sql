-- Data migration (no schema change).
--
-- The `authProvider` column was added (20260805231522_add_marketplace_schema)
-- with a hard default of 'email' for every existing row, including accounts
-- that had already signed up exclusively via Google (googleId set,
-- passwordHash null). This backfills those specific rows to 'google'.
--
-- Accounts that *linked* a Google account to a pre-existing email/password
-- signup (googleId set AND passwordHash set) are intentionally left alone:
-- 'email' correctly reflects how those accounts were originally created.
--
-- Safe to run more than once: rows already corrected no longer match the
-- `authProvider = 'email'` condition below.
UPDATE "User"
SET "authProvider" = 'google'
WHERE "googleId" IS NOT NULL
  AND "passwordHash" IS NULL
  AND "authProvider" = 'email';
