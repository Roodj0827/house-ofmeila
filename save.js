# ⚠️ Sécurité — À lire avant de déployer

## Ce qui a été corrigé

L'ancienne version de `admin-panel.html` contenait un **token GitHub personnel
codé en dur** directement dans le fichier HTML (volontairement "découpé" en
plusieurs morceaux pour tenter d'échapper aux scanners automatiques de
secrets). Ce fichier étant servi publiquement sur ton site, **n'importe qui**
pouvait :

1. Ouvrir `/admin-panel.html` (même sans connaître le mot de passe admin, en
   regardant juste le code source de la page),
2. Récupérer ce token,
3. S'en servir pour écrire ou supprimer des fichiers dans ton dépôt GitHub
   `Roodj0827/house-ofmeila` — sans jamais passer par ton mot de passe admin.

**Cette version corrige le problème** : le token GitHub n'apparaît plus nulle
part dans le code envoyé au navigateur. Il est désormais stocké côté serveur
uniquement, dans une variable d'environnement Vercel, et utilisé par une
fonction serverless (`/api/save.js`) qui fait le lien entre l'admin et
GitHub.

## Ce que tu dois faire maintenant (important, à faire avant de redéployer)

1. **Révoque immédiatement l'ancien token** sur GitHub :
   `Settings → Developer settings → Personal access tokens` → trouve le
   token qui commence par `ghp_eJhx...` et supprime-le. Il a été exposé
   publiquement, il faut le considérer comme compromis même si tu ne
   redéploies pas tout de suite.
2. **Crée un nouveau token** GitHub (fine-grained de préférence), avec accès
   en écriture (`Contents: Read and write`) limité au seul dépôt
   `house-ofmeila`.
3. Sur ton projet Vercel, va dans **Project Settings → Environment
   Variables** et ajoute :
   - `GITHUB_TOKEN` = le nouveau token
   - `ADMIN_KEY` = une clé secrète de ton choix (une phrase aléatoire, par
     exemple générée sur un gestionnaire de mots de passe)
   - (optionnel) `GITHUB_USER`, `GITHUB_REPO`, `GITHUB_BRANCH` si jamais tu
     changes de dépôt ou de branche.
4. Redéploie le site.
5. Ouvre `/admin-panel.html`, connecte-toi avec ton mot de passe habituel.
   La première fois que tu enregistres un produit ou une image, une fenêtre
   te demandera la **clé d'administration serveur** : entre la valeur que tu
   as mise dans `ADMIN_KEY`. Elle est ensuite retenue pour la session en
   cours.

## À savoir

- Le mot de passe affiché sur l'écran de connexion (`ADMIN_PASSWORD`) reste
  un simple verrou d'interface : comme tout le code d'une page web est
  visible via "Afficher le code source", ce mot de passe n'empêche pas
  techniquement quelqu'un de le lire. Ce n'est pas nouveau — il en était déjà
  ainsi avant cette mise à jour — mais il est bon de le garder en tête : ce
  n'est pas une vraie barrière de sécurité, juste un filtre pour l'usage
  quotidien. La vraie protection contre l'écriture sur GitHub, c'est
  désormais `ADMIN_KEY`, qui elle ne quitte jamais le serveur Vercel.
- Si tu utilises Netlify plutôt que Vercel pour héberger ce site,
  `/api/save.js` (format fonction Vercel) devra être adapté en fonction
  Netlify (`netlify/functions/save.js`) — dis-le-moi si c'est ton cas.
