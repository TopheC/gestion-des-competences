-- ============================================================
-- Migration 002: RLS WITH CHECK + GIN indexes + level_descriptions policies
-- ============================================================

-- 1. Ajout WITH CHECK sur les policies UPDATE existantes
-- (fonctionnellement identique au USING, mais explicite)

ALTER POLICY "categories_update_admin" ON categories
  RENAME TO "categories_update_admin_old";
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY "categories_update_admin_old" ON categories;

ALTER POLICY "skills_update_admin" ON skills
  RENAME TO "skills_update_admin_old";
CREATE POLICY "skills_update_admin" ON skills FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY "skills_update_admin_old" ON skills;

ALTER POLICY "members_update_admin" ON members
  RENAME TO "members_update_admin_old";
CREATE POLICY "members_update_admin" ON members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY "members_update_admin_old" ON members;

ALTER POLICY "skill_levels_update_admin" ON skill_levels
  RENAME TO "skill_levels_update_admin_old";
CREATE POLICY "skill_levels_update_admin" ON skill_levels FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY "skill_levels_update_admin_old" ON skill_levels;

ALTER POLICY "invitations_update_admin" ON invitations
  RENAME TO "invitations_update_admin_old";
CREATE POLICY "invitations_update_admin" ON invitations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY "invitations_update_admin_old" ON invitations;

-- 2. Filtre expiration sur invitations_read_admin

ALTER POLICY "invitations_read_admin" ON invitations
  RENAME TO "invitations_read_admin_old";
CREATE POLICY "invitations_read_admin" ON invitations FOR SELECT USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
  AND expires_at > now()
);
DROP POLICY "invitations_read_admin_old" ON invitations;

-- 3. Policies d'écriture pour level_descriptions

CREATE POLICY "level_descriptions_insert_admin" ON level_descriptions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "level_descriptions_update_admin" ON level_descriptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "level_descriptions_delete_admin" ON level_descriptions FOR DELETE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Index GIN pour full-text search (stemming français)

CREATE INDEX idx_skills_name_gin ON skills USING gin(to_tsvector('french', name));
CREATE INDEX idx_members_full_name_gin ON members USING gin(to_tsvector('french', full_name));
