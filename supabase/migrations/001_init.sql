-- ============================================================
-- Migration 001: Structure initiale
-- Application de gestion des compétences
-- ============================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'member');

-- 2. TABLES

-- Catégories de compétences
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Compétences
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, category_id)
);

-- Profils membres (liés à auth.users)
CREATE TABLE members (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Descriptifs des niveaux
CREATE TABLE level_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level int2 NOT NULL CHECK (level BETWEEN 1 AND 4),
  label text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Niveaux de compétences par membre
CREATE TABLE skill_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level int2 NOT NULL CHECK (level BETWEEN 1 AND 4),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, skill_id)
);

-- Historique des changements
CREATE TABLE skill_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  old_level int2,
  new_level int2 NOT NULL,
  changed_by uuid NOT NULL REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invitations
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL REFERENCES members(id),
  accepted bool NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX idx_skills_category ON skills(category_id);
CREATE INDEX idx_skill_levels_member ON skill_levels(member_id);
CREATE INDEX idx_skill_levels_skill ON skill_levels(skill_id);
CREATE INDEX idx_skill_history_member ON skill_history(member_id);
CREATE INDEX idx_skill_history_skill ON skill_history(skill_id);
CREATE INDEX idx_skill_history_created ON skill_history(created_at DESC);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- 4. SEED DATA

-- Catégories initiales
INSERT INTO categories (name, color) VALUES
  ('Réseau', '#3b82f6'),
  ('Système', '#10b981'),
  ('Cloud', '#f59e0b'),
  ('Sécurité', '#ef4444'),
  ('Base de données', '#8b5cf6'),
  ('Monitoring', '#ec4899'),
  ('Stockage', '#14b8a6');

-- Descriptifs des niveaux
INSERT INTO level_descriptions (level, label, description) VALUES
  (1, 'Débutant', 'Connaissances théoriques, nécessite un accompagnement'),
  (2, 'Intermédiaire', 'Réalise les tâches courantes en autonomie'),
  (3, 'Avancé', 'Gère des situations complexes, forme les autres'),
  (4, 'Expert', 'Référence technique, conçoit l''architecture');

-- 5. ROW LEVEL SECURITY

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Categories: tout le monde peut lire, seuls les admins écrivent
CREATE POLICY "categories_read_all" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_write_admin" ON categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);

-- Skills: tout le monde peut lire, seuls les admins écrivent
CREATE POLICY "skills_read_all" ON skills FOR SELECT USING (true);
CREATE POLICY "skills_write_admin" ON skills FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "skills_update_admin" ON skills FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "skills_delete_admin" ON skills FOR DELETE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);

-- Members: tout le monde peut lire, les admins peuvent modifier
CREATE POLICY "members_read_all" ON members FOR SELECT USING (true);
CREATE POLICY "members_insert_self" ON members FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "members_update_admin" ON members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "members_delete_admin" ON members FOR DELETE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);

-- Level descriptions: tout le monde peut lire
CREATE POLICY "level_descriptions_read_all" ON level_descriptions FOR SELECT USING (true);

-- Skill levels: tout le monde peut lire, seuls les admins modifient
CREATE POLICY "skill_levels_read_all" ON skill_levels FOR SELECT USING (true);
CREATE POLICY "skill_levels_insert_admin" ON skill_levels FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "skill_levels_update_admin" ON skill_levels FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "skill_levels_delete_admin" ON skill_levels FOR DELETE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);

-- Skill history: tout le monde peut lire, seuls les admins insèrent
CREATE POLICY "skill_history_read_all" ON skill_history FOR SELECT USING (true);
CREATE POLICY "skill_history_insert_admin" ON skill_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);

-- Invitations: seuls les admins peuvent tout faire
CREATE POLICY "invitations_read_admin" ON invitations FOR SELECT USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "invitations_insert_admin" ON invitations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "invitations_update_admin" ON invitations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "invitations_delete_admin" ON invitations FOR DELETE USING (
  EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin')
);

-- 6. TRIGGER: Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skill_levels_updated_at
  BEFORE UPDATE ON skill_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. FONCTION: Créer automatiquement un membre lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.members (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
