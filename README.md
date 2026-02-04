# Where is Simon? 📸

Plateforme SaaS pour photographes d'événements avec reconnaissance faciale.

## Fonctionnalités

- **Reconnaissance Faciale (ML)** : Upload et matching instantané via `face-api.js` et `pgvector`.
- **Rôles Multiples** : Admin, Photographe, Propriétaire, Invité.
- **Modèle Économique** : 3 Tiers (Starter, Pro, Premium).
- **Interface Invité** : "Where is Simon?" pour retrouver ses photos.

## Configuration Technique

### Pré-requis

1. Node.js 20+
2. Compte Supabase (avec extension `vector` activée)
3. Compte Stripe (pour les paiements)

### Installation

1. Cloner le repo :
   ```bash
   git clone <url>
   cd where-is-simon
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer les variables d'environnement `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   ```

### Base de Données (Supabase)

Exécutez le script SQL situé dans `supabase/schema.sql` dans l'éditeur SQL de votre dashboard Supabase.
Cela créera :
- Les tables (`events`, `photos`, `photo_faces`, etc.)
- Les types ENUM
- Les fonctions RPC (`match_face_photos_v2`)
- Les politiques de sécurité (RLS)

### Procédure Machine Learning (Reconnaissance Faciale)

Le système utilise `face-api.js` côté client pour générer les embeddings.

1. **Upload (Dashboard Photographe)** :
   - Lorsqu'une photo est déposée, le modèle `ssdMobilenetv1` détecte tous les visages.
   - Pour chaque visage, un embedding (vecteur de 128 nombres) est calculé.
   - La photo est uploadée sur Supabase Storage.
   - Les métadonnées de la photo et les embeddings des visages sont stockés dans `photos` et `photo_faces`.

2. **Recherche (Invité)** :
   - L'invité prend un selfie.
   - Un embedding est calculé localement.
   - Une requête RPC `match_face_photos_v2` est envoyée à Supabase.
   - La base de données compare le vecteur du selfie avec ceux stockés via la distance Cosine.
   - Les photos correspondantes sont renvoyées.

Les modèles ML sont stockés dans `public/models`.

### Configuration des Webhooks Stripe

Pour gérer les abonnements et les achats de tirages :

1. Aller dans le Dashboard Stripe > Developers > Webhooks.
2. Ajouter un endpoint pointant vers `https://votre-domaine.com/api/webhooks/stripe`.
3. Sélectionner les événements à écouter :
   - `checkout.session.completed` : Pour valider un paiement (abonnement ou tirage).
   - `customer.subscription.updated` : Pour mettre à jour le statut d'un abonnement.
   - `customer.subscription.deleted` : Pour gérer les annulations.

(Note : L'implémentation de l'API route `/api/webhooks/stripe` est à faire selon vos besoins spécifiques de business logic).

## Déploiement

Le workflow GitHub Actions (`.github/workflows/ci.yml`) vérifie le build à chaque push.
Pour déployer :
- **Vercel** : Connectez votre repo GitHub à Vercel. La configuration est automatique.
- **GitHub Pages** : Nécessite une configuration d'export statique (non compatible avec les routes dynamiques `[slug]` sans configuration serveur ou fallback). Vercel est recommandé.

## Licence

MIT
