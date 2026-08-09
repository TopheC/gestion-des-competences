# CONTEXT.md — Vocabulaire de domaine

Glossaire des concepts du domaine utilisés dans le code et les décisions d'architecture.
Ce fichier donne des noms aux modules et aux invariants — la documentation de référence pour les revues d'architecture.

## Agrégats

### members (membre)
Un membre est une personne de l'équipe, représentée par une ligne de la table `members` liée au compte auth Supabase.
- Créé automatiquement à l'inscription par le trigger `handle_new_user()`.
- Rôles : `admin` (écritures sur tout) ou `member` (écritures sur soi uniquement, via RLS).
- RLS : lecture pour tous ; update admin-ou-soi ; delete admin uniquement.

**Module : `members`** — module profond avec cache + listeners, au même titre que `skillLevels`.
- Interface (design verrouillé, 8 méthodes) :
  - `refresh()` → `{ data, error }` — remplace le cache, tri canonique, notify ; tout-ou-rien (l'ancien cache survit à une erreur).
  - `loadIfNeeded()` → `{ data, error }` — idempotent, déduplique les hydratations concurrentes (promesse in-flight partagée). Le chemin de lecture « je veux juste la liste » = `await loadIfNeeded(); list()`.
  - `list()` → `Member[]` — synchrone, ordre canonique `full_name` ; vide avant hydratation.
  - `getById(id)` → `{ data, error }` — cache d'abord, fetch de l'adaptateur au miss, **sans peupler le cache** (pas de cache partiel). Fonctionne avant tout refresh (boot AuthContext).
  - `count()` → `{ count, error }` — **depuis le cache** (zéro requête SQL), après hydratation.
  - `update(id, changes)` → `{ data, error }` — whitelist de champs (`full_name`, `role`) ; écriture → `refresh()` → notify.
  - `remove(id)` → `{ error }` — refuse l'auto-suppression (identité via `adapter.getCurrentUserId()`) ; écriture → `refresh()` → notify.
  - `subscribe(cb)` → `() => void` — canal local (pas de temps réel Supabase pour `members`) ; événements `{ type: 'members_changed' }` et `{ type: 'error', source, error }`.
  - `isHydrated()` → `boolean` — état d'hydratation du cache, utilisé par le hook pour l'état `loading` initial.
- Invariants possédés par le module : **interdire l'auto-suppression** ; toute écriture déclenche `refresh()` + notification (les appelants n'ont jamais à penser au rechargement) ; ordre canonique `full_name` ; `getById` ne peuple jamais le cache ; erreurs en `{ data, error }` jamais en throw.
- La présentation (ex. `created_at` desc sur la page Membres) est une décision de l'appelant, appliquée localement.
- Interface de l'adaptateur : `fetchAll()`, `fetchById(id)`, `update(id, changes)`, `remove(id)`, `getCurrentUserId()` — pas de `subscribeToChanges` (table non publiée en temps réel). Adaptateur stupide : ni tri, ni garde, ni validation.
- `setRole` et `search` sont volontairement **hors interface** : aucun appelant vivant ; la whitelist de `update` absorbera un futur changement de rôle.

### skills (compétence) / categories (catégorie)
Référentiel hiérarchique : une catégorie (nom + couleur) contient des compétences.
RLS : lecture pour tous, écriture admin uniquement.
Pas encore de module dédié — les hooks de lecture `useSkills` / `useCategories` sont des candidats à approfondir.

### skill_levels (niveau) / skill_history (historique)
Ligne `skill_levels` = niveau 1-4 d'un membre sur une compétence (clé métier `member_id + skill_id`).
`skill_history` = journal des changements (`old_level`, `new_level`, `changed_by`).
**Module : `skillLevels`** — cache + écritures orchestrées + temps réel Supabase (publié).
La clé de cache `${memberId}-${skillId}` est **interne au module**, jamais reconstruite par les appelants.

### invitations
Invitation d'un membre par un admin (table `invitations`, expirée après `expires_at`).
Lu et accepté par le destinataire via token. Pas encore de module dédié.

## Composition inter-modules

- **Chaque module compte son propre agrégat** : `members.count()` pour les membres, `skillLevels` pour les niveaux, etc. Un module ne traverse jamais le seam d'un autre agrégat (ex. : le comptage des membres ne vit pas dans l'adaptateur de skillLevels).
- Le Dashboard compose les comptages des modules de données plutôt que d'interroger les tables lui-même.

## Conventions d'erreur

- Toutes les opérations des modules retournent `{ data, error }` — jamais de throw silencieux.
- Les hooks consommateurs exposent un état d'erreur aux pages.
- Les refus RLS remontent tels quels aux appelants, une seule fois, au seam du module.
