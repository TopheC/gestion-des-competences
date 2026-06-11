# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Reporting a Vulnerability

**Pour les vulnérabilités critiques (failles actives, données exposées, RCE, injection) :**

- ✉️ **Email privé** : [tophec@ccado.fr](mailto:tophec@ccado.fr)
- ⏱️ Accusé de réception sous **48h**, correctif sous **7 jours** selon sévérité

**Pour les vulnérabilités non critiques (dépendances obsolètes, OWASP basse sévérité, recommandations) :**

- Ouvrez une [issue GitHub](https://github.com/TopheC/gestion-des-competences/issues)
- Utilisez le label `security` si applicable

## Security Measures

Ce projet utilise les mesures de sécurité suivantes :

### Authentication & Authorization
- Authentification gérée via **Supabase Auth** (JWT, email/password, OAuth)
- Row-Level Security (RLS) côté Supabase pour l'accès aux données
- Sessions JWT avec expiration configurable côté serveur

### Transmission
- HTTPS/TLS 1.2+ obligatoire (Vercel/ Supabase)
- HSTS configuré via déploiement Vercel

### Dépendances
- Mises à jour de sécurité automatisées via **Dependabot** (npm)
- Revue manuelle des dépendances avant merge des PR Dependabot

### CI/CD
- Scan de sécurité SAST via le skill `senior-secops` (secrets, SQLi, XSS, injections)
- Analyse des vulnérabilités des dépendances npm

## Security Checklist

Avant chaque déploiement :

- [ ] Dépendances npm à jour (Dependabot approuvé)
- [ ] Scan SAST exécuté sur le code modifié (senior-secops)
- [ ] Revue de sécurité pour les changements d'auth/API
- [ ] Variables d'environnement vérifiées (`.env.example` à jour)

## Disclosure Policy

1. La vulnérabilité est rapportée par email privé
2. Accusé de réception sous 48h ouvrées
3. Correctif préparé et testé
4. Correctif déployé et l'issue publique est ouverte (le cas échéant)
5. Crédit au reporter dans les notes de version (sauf demande contraire)