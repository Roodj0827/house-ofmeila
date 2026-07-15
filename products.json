// ═══════════════════════════════════════════════════════════════
// /api/save — Proxy sécurisé vers l'API GitHub
// ═══════════════════════════════════════════════════════════════
// Ce endpoint remplace les anciens appels directs à l'API GitHub
// effectués depuis admin-panel.html. Auparavant, le token GitHub
// (avec droit d'écriture sur le dépôt) était écrit en clair dans le
// code source de la page — visible par QUICONQUE via "Afficher le
// code source". C'est une faille de sécurité critique : n'importe
// qui aurait pu récupérer ce token et modifier/supprimer le dépôt.
//
// Le token vit désormais uniquement ici, côté serveur, sous forme
// de variable d'environnement Vercel (jamais envoyée au navigateur).
//
// ─── Configuration requise sur Vercel (Project Settings → Environment Variables) ───
//   GITHUB_TOKEN   → un token GitHub (fine-grained recommandé) avec accès
//                     "Contents: Read and write" sur le dépôt uniquement.
//   ADMIN_KEY      → une clé secrète de ton choix, saisie une fois dans
//                     l'admin (stockée dans sessionStorage du navigateur).
//                     Elle protège ce endpoint — sans elle, personne ne
//                     peut écrire dans le dépôt via ce proxy.
//   GITHUB_USER    → (optionnel) défaut : "Roodj0827"
//   GITHUB_REPO    → (optionnel) défaut : "house-ofmeila"
//   GITHUB_BRANCH  → (optionnel) défaut : "main"
//
// ⚠️ IMPORTANT : le token GitHub qui était visible dans l'ancien code
// (admin-panel.html) doit être révoqué immédiatement sur GitHub
// (Settings → Developer settings → Personal access tokens), puisqu'il
// a déjà été exposé publiquement. Génère-en un nouveau et mets-le
// uniquement dans les variables d'environnement Vercel.

const GITHUB_USER = process.env.GITHUB_USER || 'Roodj0827';
const GITHUB_REPO = process.env.GITHUB_REPO || 'house-ofmeila';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// Dossiers autorisés en écriture — évite qu'un appel malveillant
// n'écrive n'importe où ailleurs dans le dépôt.
const ALLOWED_PREFIXES = ['data/', 'images/uploads/'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
    return;
  }

  const adminKey = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    res.status(401).json({ ok: false, error: 'Clé d\'administration invalide' });
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    res.status(500).json({ ok: false, error: 'GITHUB_TOKEN non configuré sur le serveur' });
    return;
  }

  const { path, content, encoding, message } = req.body || {};

  if (!path || typeof content !== 'string') {
    res.status(400).json({ ok: false, error: 'Paramètres manquants (path, content)' });
    return;
  }

  const cleanPath = String(path).replace(/^\/+/, '');
  if (!ALLOWED_PREFIXES.some(prefix => cleanPath.startsWith(prefix))) {
    res.status(400).json({ ok: false, error: 'Chemin non autorisé' });
    return;
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${cleanPath}`;
  const ghHeaders = {
    'Authorization': 'token ' + process.env.GITHUB_TOKEN,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'house-ofmeila-admin'
  };

  try {
    // 1. Récupérer le SHA actuel du fichier (requis par GitHub pour le mettre à jour)
    let sha = null;
    const getRes = await fetch(apiUrl + '?ref=' + GITHUB_BRANCH, { headers: ghHeaders });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Encoder le contenu en base64 si nécessaire
    const encodedContent = encoding === 'base64'
      ? content
      : Buffer.from(content, 'utf8').toString('base64');

    // 3. Envoyer la mise à jour (ou création) du fichier
    const body = {
      message: message || `Admin: mise à jour ${cleanPath.split('/').pop()}`,
      content: encodedContent,
      branch: GITHUB_BRANCH
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const putData = await putRes.json();

    if (putRes.ok) {
      res.status(200).json({
        ok: true,
        sha: putData.content && putData.content.sha,
        download_url: putData.content && putData.content.download_url
      });
    } else {
      console.error('Erreur GitHub API:', putData);
      res.status(502).json({ ok: false, error: putData.message || 'Erreur GitHub inconnue' });
    }
  } catch (e) {
    console.error('Erreur /api/save:', e);
    res.status(500).json({ ok: false, error: 'Erreur serveur' });
  }
};
