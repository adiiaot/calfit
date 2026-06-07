-- ─────────────────────────────────────────────────────────────
-- insert_partner_reverse
-- SECURITY DEFINER function to insert the reverse partner row.
--
-- Why this exists:
--   RLS on the `partners` table restricts inserts to rows where
--   user_id = auth.uid(). When Alice adds Bob as a partner, we
--   insert (user_id=Alice, partner_id=Bob) — RLS allows this.
--   But we also need to insert (user_id=Bob, partner_id=Alice)
--   so Bob sees the connection. RLS blocks this because
--   auth.uid() = Alice ≠ Bob.
--
--   This function runs AS the database owner (SECURITY DEFINER),
--   bypassing RLS for the single, narrow purpose of inserting
--   the reverse partner row. It is NOT a generic bypass — it
--   only inserts into the `partners` table with a fixed status.
--
-- Security notes:
--   - Only inserts the reverse row — never updates or deletes.
--   - Uses the caller-supplied user_id/partner_id from the
--     application layer, which already validated auth via RLS
--     on the forward insert.
--   - Status is hardcoded to 'active' — no arbitrary data.
--   - In production, add a security barrier or additional
--     application-level authorization check.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION insert_partner_reverse(
  p_user_id UUID,
  p_partner_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO partners (user_id, partner_id, status)
  VALUES (p_partner_id, p_user_id, 'active')
  ON CONFLICT (user_id, partner_id) DO NOTHING;
END;
$$;
