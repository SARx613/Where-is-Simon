# Where is Simon? 📸

Plateforme SaaS pour photographes d'evenements avec reconnaissance faciale.

## Vision produit

Le produit aide chaque invite a retrouver automatiquement ses photos dans des evenements volumineux (mariage, bar mitzvah, gala), puis ouvre des options business pour le photographe: ventes, upsell et services premium.

## Stack

- Next.js App Router + React + TypeScript
- Supabase (Auth, Postgres, Storage, RLS)
- `pgvector` + `face-api.js`
- Stripe pour facturation et checkout

## Demarrage rapide

### Prerequis

1. Node.js 20+
2. Projet Supabase
3. Compte Stripe

### Installation

```bash
npm install
```

### Variables d'environnement

`.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
STRIPE_SECRET_KEY=<stripe-secret-key>
```

### Base Supabase (source unique)

Le schema SQL canonique est:

1. `supabase/migrations/20260101000000_initial_schema.sql`
2. `supabase/migrations/20260102000000_add_vector_index.sql` (optionnel, apres volume de donnees)

Si votre projet existait deja avant cette refonte et que vous voyez `PGRST203` sur `create_event_v3`, executez aussi:

3. `supabase/migrations/20260103000000_hotfix_drop_legacy_create_event_v3.sql` (one-shot hotfix)

`supabase/schema.sql` est desormais un fichier pointeur (non source de verite).

## Flux principal ML

1. Le photographe upload des photos dans le dashboard.
2. L'API `/api/photos/process` detecte les visages et enregistre les embeddings dans `photo_faces`.
3. L'invite prend un selfie, un embedding est calcule cote client.
4. L'app appelle `match_face_photos_v2` pour trouver les meilleurs matchs.

## Securite et architecture

- Validation Zod sur les endpoints critiques (`checkout`, `photos/process`)
- Auth/Authz forcees sur routes sensibles
- RLS durcie sur les tables metier
- Couches applicatives introduites:
  - `src/services/*` (logique metier)
  - `src/hooks/*` (etat/react)
  - `src/lib/validation/*`, `src/lib/env.ts`, `src/lib/logger.ts`

## Qualite

```bash
npm run lint
npm run test
npm run build
```

Le workflow CI (`.github/workflows/ci.yml`) execute lint + tests + build.

## Backlog produit priorise

### MVP (impact fort / delai court)

1. Onboarding selfie via QR a l'entree de l'evenement
2. Mode vie privee (masquer/signaler une photo)
3. Notifications "you've been spotted"

### Growth (retention / monetisation)

1. Livre d'or digital (texte + vocal)
2. Selection album par likes
3. Statistiques de popularite des photos
4. Partage social optimise avec tags pre-remplis

### Premium (upsell avancé)

1. Upselling tirages (integration impression)
2. Archive cloud long terme (10-20 ans)
3. Gestion contrats/paiements photographe
4. Reels auto-generes par IA

Roadmap detaillee: `docs/product-roadmap.md`.

## Notes historiques SQL

Voir `supabase/LEGACY_NOTES.md` pour la consolidation des anciens scripts.

## Licence

MIT
