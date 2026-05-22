-- ============================================
-- Seed : 20 collaborateurs fictifs + compétences
-- À exécuter dans Supabase Studio → SQL Editor
-- ============================================

-- Fonction utilitaire pour générer un hash bcrypt (mot de passe: password123)
-- Le hash est pré-généré pour éviter d'avoir besoin de pgcrypto

-- 1. Créer les skills manquants
DO $$
DECLARE
  cat_rec RECORD;
  skill_id_var uuid;
BEGIN
  -- Réseau
  FOR cat_rec IN SELECT id FROM categories WHERE name = 'Réseau' LOOP
    INSERT INTO skills (name, category_id) VALUES ('Routage & Switching', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Firewall', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('VPN', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Wireshark / Analyse', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
  END LOOP;
  -- Système
  FOR cat_rec IN SELECT id FROM categories WHERE name = 'Système' LOOP
    INSERT INTO skills (name, category_id) VALUES ('Linux', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Windows Server', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Virtualisation (Proxmox)', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Ansible', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
  END LOOP;
  -- Cloud
  FOR cat_rec IN SELECT id FROM categories WHERE name = 'Cloud' LOOP
    INSERT INTO skills (name, category_id) VALUES ('AWS', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Azure', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('GCP', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Terraform', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
  END LOOP;
  -- Sécurité
  FOR cat_rec IN SELECT id FROM categories WHERE name = 'Sécurité' LOOP
    INSERT INTO skills (name, category_id) VALUES ('Pentest', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('SOC / SIEM', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('PKI', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('ISO 27001', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
  END LOOP;
  -- Base de données
  FOR cat_rec IN SELECT id FROM categories WHERE name = 'Base de données' LOOP
    INSERT INTO skills (name, category_id) VALUES ('PostgreSQL', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('MySQL', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('MongoDB', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Admin BDD', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
  END LOOP;
  -- Monitoring
  FOR cat_rec IN SELECT id FROM categories WHERE name = 'Monitoring' LOOP
    INSERT INTO skills (name, category_id) VALUES ('Prometheus', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Grafana', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('ELK Stack', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Zabbix', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
  END LOOP;
  -- Stockage
  FOR cat_rec IN SELECT id FROM categories WHERE name = 'Stockage' LOOP
    INSERT INTO skills (name, category_id) VALUES ('SAN / NAS', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Backup (Veeam)', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Ceph', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
    INSERT INTO skills (name, category_id) VALUES ('Minio', cat_rec.id) ON CONFLICT (name, category_id) DO NOTHING;
  END LOOP;
END $$;

-- 2. Créer les utilisateurs dans auth.users et members

-- Extension pgcrypto pour le hash des mots de passe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insérer les utilisateurs
DO $$
DECLARE
  users_data text[][] := ARRAY[
    ['alice.martin@example.com', 'Alice Martin'],
    ['bob.bernard@example.com', 'Bob Bernard'],
    ['chloe.dubois@example.com', 'Chloé Dubois'],
    ['david.petit@example.com', 'David Petit'],
    ['emma.leroy@example.com', 'Emma Leroy'],
    ['francois.moreau@example.com', 'François Moreau'],
    ['gaelle.lambert@example.com', 'Gaëlle Lambert'],
    ['hugo.girard@example.com', 'Hugo Girard'],
    ['ines.roux@example.com', 'Inès Roux'],
    ['jules.vincent@example.com', 'Jules Vincent'],
    ['karine.fournier@example.com', 'Karine Fournier'],
    ['lucas.morel@example.com', 'Lucas Morel'],
    ['manon.lefebvre@example.com', 'Manon Lefebvre'],
    ['nathan.mercier@example.com', 'Nathan Mercier'],
    ['oceane.caron@example.com', 'Océane Caron'],
    ['pierre.gauthier@example.com', 'Pierre Gauthier'],
    ['quitterie.perrin@example.com', 'Quitterie Perrin'],
    ['romain.boucher@example.com', 'Romain Boucher'],
    ['sarah.dumont@example.com', 'Sarah Dumont'],
    ['thomas.giraud@example.com', 'Thomas Giraud']
  ];
  i int;
  user_email text;
  user_name text;
  new_user_id uuid;
  existing_id uuid;
BEGIN
  FOR i IN 1..array_length(users_data, 1) LOOP
    user_email := users_data[i][1];
    user_name := users_data[i][2];

    -- Vérifier si le membre existe déjà
    SELECT id INTO existing_id FROM members WHERE email = user_email;
    IF existing_id IS NOT NULL THEN
      RAISE NOTICE '⏩ % existe déjà (id: %)', user_name, existing_id;
      CONTINUE;
    END IF;

    -- Vérifier si l'utilisateur auth existe déjà
    SELECT id INTO existing_id FROM auth.users WHERE email = user_email;
    IF existing_id IS NOT NULL THEN
      RAISE NOTICE '⏩ % existe dans auth.users, création du member manquant...', user_name;
      INSERT INTO members (id, email, full_name, role)
      VALUES (existing_id, user_email, user_name, 'member')
      ON CONFLICT (id) DO NOTHING;
      CONTINUE;
    END IF;

    -- Créer l'utilisateur auth
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token, is_super_admin
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      user_email,
      crypt('password123', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', user_name),
      now(),
      now(),
      '', '', '', '',
      false
    );

    -- Créer la ligne dans members manuellement
    INSERT INTO members (id, email, full_name, role)
    VALUES (new_user_id, user_email, user_name, 'member');

    RAISE NOTICE '✓ % créé (id: %)', user_name, new_user_id;
  END LOOP;
END $$;

-- 3. Assigner des niveaux de compétence aléatoires
DO $$
DECLARE
  member_rec RECORD;
  skill_rec RECORD;
  level_val int;
BEGIN
  FOR member_rec IN SELECT id FROM members WHERE role = 'member' LOOP
    FOR skill_rec IN SELECT id FROM skills LOOP
      level_val := floor(random() * 4) + 1;
      INSERT INTO skill_levels (member_id, skill_id, level)
      VALUES (member_rec.id, skill_rec.id, level_val)
      ON CONFLICT (member_id, skill_id) DO UPDATE SET level = level_val;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Niveaux assignés à tous les membres';
END $$;

-- 4. Créer un historique pour les 10 premiers membres
DO $$
DECLARE
  member_rec RECORD;
  skill_rec RECORD;
  admin_id uuid;
  skill_ids uuid[];
  old_lvl int;
  new_lvl int;
  num_changes int;
  days_ago int;
BEGIN
  -- Récupérer l'ID de l'admin
  SELECT id INTO admin_id FROM members WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE NOTICE '⚠ Aucun admin trouvé, historique ignoré';
    RETURN;
  END IF;

  -- Récupérer tous les skill IDs
  SELECT array_agg(id) INTO skill_ids FROM skills;

  FOR member_rec IN SELECT id FROM members WHERE role = 'member' ORDER BY created_at LIMIT 10 LOOP
    num_changes := floor(random() * 5) + 2;
    FOR i IN 1..num_changes LOOP
      skill_rec := (SELECT s FROM unnest(skill_ids) AS s ORDER BY random() LIMIT 1);
      old_lvl := floor(random() * 3) + 1;
      new_lvl := old_lvl + floor(random() * (4 - old_lvl)) + 1;
      days_ago := floor(random() * 30) + 1;

      INSERT INTO skill_history (member_id, skill_id, old_level, new_level, changed_by, created_at)
      VALUES (member_rec.id, skill_rec, old_lvl, new_lvl, admin_id, now() - (days_ago || ' days')::interval);
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Historique créé';
END $$;

-- 5. Afficher le résumé
SELECT 'RÉSULTAT DU SEED' AS "";
SELECT 'Catégories' AS "Table", count(*) AS "Total" FROM categories
UNION ALL
SELECT 'Skills', count(*) FROM skills
UNION ALL
SELECT 'Membres', count(*) FROM members
UNION ALL
SELECT 'Niveaux', count(*) FROM skill_levels
UNION ALL
SELECT 'Historique', count(*) FROM skill_history;
