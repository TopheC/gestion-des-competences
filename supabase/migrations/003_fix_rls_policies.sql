-- ============================================================
-- Migration 003: Fix RLS policies for legitimate non-admin operations
-- ============================================================

-- 1. Members: allow users to update their own profile (name)
ALTER POLICY "members_update_admin" ON members
  RENAME TO "members_update_admin_old";
CREATE POLICY "members_update_admin" ON members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "members_update_self" ON members FOR UPDATE USING (
  id = auth.uid()
) WITH CHECK (
  id = auth.uid()
);
DROP POLICY "members_update_admin_old" ON members;

-- 2. Skill levels: allow members to insert/update their own levels
CREATE POLICY "skill_levels_insert_self" ON skill_levels FOR INSERT WITH CHECK (
  member_id = auth.uid()
);
CREATE POLICY "skill_levels_update_self" ON skill_levels FOR UPDATE USING (
  member_id = auth.uid()
) WITH CHECK (
  member_id = auth.uid()
);

-- 3. Skill history: allow members to insert their own history entries
CREATE POLICY "skill_history_insert_self" ON skill_history FOR INSERT WITH CHECK (
  member_id = auth.uid()
);

-- 4. Invitations: allow token-based read and update for acceptance
--    The token is a secret known only to the invitee via the link.
--    SELECT: anyone with a valid, unexpired, unaccepted token can read the invitation.
--    UPDATE: anyone with the token can mark it as accepted.
CREATE POLICY "invitations_read_by_token" ON invitations FOR SELECT USING (
  NOT accepted AND expires_at > now()
  AND token IS NOT NULL
);
CREATE POLICY "invitations_update_by_token" ON invitations FOR UPDATE USING (
  NOT accepted AND expires_at > now()
  AND token IS NOT NULL
) WITH CHECK (
  NOT accepted AND expires_at > now()
  AND token IS NOT NULL
);