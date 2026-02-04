# Instructions d'Authentification (Google OAuth)

Pour que la connexion Google fonctionne sur votre application déployée (Vercel) et en local, vous devez configurer le fournisseur "Google" dans votre projet Supabase.

## Étape 1 : Créer les identifiants Google Cloud

1. Allez sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un nouveau projet.
3. Allez dans **APIs & Services > OAuth consent screen**.
   - Configurez-le en "External".
   - Remplissez les champs obligatoires (Nom de l'app, emails).
4. Allez dans **Credentials > Create Credentials > OAuth client ID**.
   - Type : **Web application**.
   - **Authorized JavaScript origins** :
     - `http://localhost:3000` (pour le dev local)
     - `https://votre-projet.vercel.app` (votre URL de prod)
   - **Authorized redirect URIs** :
     - `https://nuusmzfnmkzfucophlew.supabase.co/auth/v1/callback` (C'est l'URL de votre projet Supabase, trouvable dans Supabase > Auth > URL Configuration)

5. Notez le **Client ID** et le **Client Secret**.

## Étape 2 : Configurer Supabase

1. Allez dans votre Dashboard Supabase > **Authentication > Providers**.
2. Cliquez sur **Google**.
3. Activez le provider ("Enable Sign in with Google").
4. Collez le **Client ID** et le **Client Secret** obtenus à l'étape 1.
5. Sauvegardez.

## Étape 3 : Configurer les URLs de redirection Supabase

1. Allez dans **Authentication > URL Configuration**.
2. **Site URL** : Mettez votre URL de production (ex: `https://where-is-simon.vercel.app`).
3. **Redirect URLs** : Ajoutez :
   - `http://localhost:3000/auth/callback`
   - `https://where-is-simon.vercel.app/auth/callback`

Une fois cela fait, le bouton "Continuer avec Google" sur la page `/login` fonctionnera !
