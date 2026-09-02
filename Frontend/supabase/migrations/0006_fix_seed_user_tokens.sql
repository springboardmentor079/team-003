-- BuildTrack — Fix manually-seeded auth.users rows.
--
-- GoTrue scans several token columns into non-nullable Go strings. When rows
-- are inserted directly (as in 0004), those columns default to NULL and every
-- sign-in fails with "Database error querying schema". Backfill them to ''.

update auth.users
set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, '')
where email in (
  'admin@buildtrack.com', 'manager@buildtrack.com', 'engineer@buildtrack.com',
  'contractor@buildtrack.com', 'worker@buildtrack.com', 'client@buildtrack.com'
);
