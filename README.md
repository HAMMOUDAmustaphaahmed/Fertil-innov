# Fertil'Innov Environnement — site React (v2)

Refonte du site vitrine de **Fertil'Innov Environnement** (ingénierie écologique, microbiologie des sols, Grabels) : React + Vite, animations GSAP/Framer Motion, **trilingue (FR / EN / ES)**, pré-rendu statique pour Google et les IA, **Petit Pois** (assistant IA) et **le Chef** (agent du propriétaire sur Telegram et `/admin`) qui permet de modifier tout le site en langage naturel.

Le design, la palette verte, le logo, les images, la mascotte Petit Pois et tout le contenu du site d'origine sont conservés ; seuls l'exécution, les animations et les fonctionnalités changent.

## Ce que fait le site

| | |
|---|---|
| **Pages** | Accueil, Services, Activités, Expertise, Formations, Chiffres, Blog, Guide des sols, FAQ, Contact — chacune en `/`, `/en/…`, `/es/…` (sélecteur de langue dans le header). |
| **Petit Pois** | Assistant IA (Claude ou Groq) côté serveur : répond dans la langue du visiteur, consulte services / FAQ / formations, qualifie le besoin et **enregistre la demande de devis** (`create_lead`) → email à l'entreprise, accusé de réception au client, notification Telegram au propriétaire. Filtre de périmètre, quotas et budget de tokens (voir plus bas). |
| **Le Chef** | Agent du propriétaire sur **Telegram (@Fertilinnov_bot)** et dans l'**espace de pilotage** (`/pilotage`, voir plus bas). Sur Telegram, un **menu à boutons** (`/site`) guide le propriétaire : palettes et police en un clic, afficher / masquer / supprimer un élément de n’importe quelle liste, photos, **annulation sur 5 niveaux** (`/annuler`), régénération SEO ; le reste se fait en langage naturel : demandes clients (liste, statuts, réponse par email), statistiques, synthèse des questions des visiteurs, et **tout le contenu du site** : nom, slogan, coordonnées, horaires, textes, services, activités, expertise, formations, FAQ, blog, équipe, partenaires, réalisations, chiffres clés, couleurs (palettes prêtes ou codes hex), police, photos (envoyées dans Telegram). Le propriétaire écrit en français, **les traductions EN/ES sont automatiques**. |
| **SEO / GEO** | Pré-rendu HTML de 30 pages (10 pages × 3 langues) au build, `hreflang`, canonical, Open Graph, JSON-LD (Organization/LocalBusiness, Service, Course, FAQPage, Blog, BreadcrumbList), `sitemap.xml`, `robots.txt` autorisant explicitement GPTBot, ClaudeBot, Google-Extended, PerplexityBot, DeepSeek, Kimi…, `llms.txt`. Images WebP optimisées (41 Mo → 2,7 Mo), lazy-loading, polices hébergées sur le site. |
| **Emails** | Mailjet via l’API REST (l’adresse expéditrice doit être **validée** dans le compte Mailjet : `MAILJET_SENDER`), accusé de réception au client dans sa langue, notification à `COMPANY_EMAIL`. |
| **Formulaire de contact** | Mêmes demandes que Petit Pois (table `fi_leads`), honeypot anti-spam, 5 envois/IP/jour. |

## Architecture

```
src/                    front React (Vite)
  data/infos.js         coordonnées, horaires, helpers heure de Paris (partagé front + API)
  data/content.js       tous les textes d'interface en fr/en/es (modifiables par le Chef)
  data/site.js          services, activités, formations, FAQ, blog, équipe, partenaires, chiffres (fr/en/es)
  i18n/LangProvider     langue depuis l'URL, t(), L(), p()
  site/SiteProvider     configuration dynamique (/api/site) → palette CSS, police, textes, listes, images
  pages/, components/   pages et composants (Chatbot = Petit Pois, DepthRail = rail de profondeur de l'accueil)
  entry-server.jsx      rendu serveur pour le pré-rendu
api/                    fonctions serverless Vercel (Request → Response)
  session.js, chat.js   Petit Pois (session cookie signée, flux SSE, boucle d'outils)
  contact.js            formulaire de contact → demande + emails + Telegram
  site.js               configuration publique du site
  telegram.js           webhook du bot · admin/*  espace propriétaire · cron/daily.js  briefing du matin
  _lib/petitpois.js     prompt et outils de Petit Pois · _lib/chef.js  prompt et outils du Chef
  _lib/settings.js      configuration du site (défauts du code + surcharges Supabase) · _lib/i18n.js  traduction auto
  _lib/leads.js, emails.js, guard.js, llm.js, store.js, telegram.js, session.js, admin.js
scripts/prerender.mjs   pré-rendu statique après `vite build` · optimize-images.mjs · telegram-dev.mjs · chef-test.mjs
supabase/schema.sql     tables fi_* + fonctions SQL (déjà appliqué sur le projet « Fertil-innov »)
```

Aucune clé ne quitte le serveur : le navigateur n'appelle que `/api/*`.

## Garde-fous de Petit Pois (côté serveur)

| Garde-fou | Variable | Défaut |
|---|---|---|
| Messages max par conversation | `CHAT_MAX_MESSAGES_PER_SESSION` | 20 |
| Messages max par IP et par jour | `CHAT_MAX_MESSAGES_PER_IP_PER_DAY` | 80 |
| Nouvelles conversations par IP et par jour | `CHAT_MAX_SESSIONS_PER_IP_PER_DAY` | 10 | 
| Intervalle minimum entre deux messages | `CHAT_MIN_INTERVAL_MS` | 2500 ms |
| Longueur max d'un message | `CHAT_MAX_INPUT_CHARS` | 500 |
| Budget global de tokens par jour | `CHAT_DAILY_TOKEN_BUDGET` | 2 000 000 |
| Demandes max par conversation / par email et par jour | `LEADS_MAX_PER_SESSION` / `LEADS_MAX_PER_EMAIL_PER_DAY` | 2 / 3 |
| Messages hors sujet avant clôture | `CHAT_OFFTOPIC_STRIKES` | 3 |

Un petit modèle classe chaque message (OK / HORS) avant d'appeler Petit Pois ; les tentatives de manipulation reçoivent une réponse fixe sans dépenser de tokens du modèle principal. Le compteur est incrémenté avant l'appel ; un refresh ne coûte rien (historique rechargé depuis la base).

## Lancer en local

```bash
npm install
npm run dev          # site + /api/* sur http://localhost:5173
npm run telegram     # bot Telegram en long polling (pas besoin d'URL publique)
node scripts/chef-test.mjs "Quelles sont les demandes de la semaine ?"
```

`.env.local` contient déjà les clés (Groq, Supabase « Fertil-innov », Mailjet, Telegram). `.env.example` liste toutes les variables.

## Déploiement

1. **GitHub** : dépôt public `Fertil-innov` (branche `main`) — l’ancien site statique est dans `Fertil-Innov-ancien-site`. (Le plan Hobby de Vercel refuse les dépôts privés dont l’auteur du commit n’est pas le propriétaire du projet ; le dépôt est donc public — `.env.local` n’est jamais commité.)
2. **Vercel** → *Add New Project* → importer le dépôt (Vite détecté ; build = `npm run build`, sortie = `dist`). Node 22 est demandé par `engines`.
3. *Settings → Environment Variables* : copier toutes les variables de `.env.local`. `PUBLIC_SITE_URL` ne sert qu’aux liens dans les emails ; le SEO (canonical, hreflang, sitemap, JSON-LD) pointe toujours vers le domaine officiel `https://www.fertilinnov-environnement.com`, et toute autre adresse (ex. `*.vercel.app`) est servie en `noindex`.
4. Déployer. Puis, une seule fois, enregistrer le webhook Telegram :
   `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<votre-domaine>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>`
5. Dans Telegram, envoyer `/start <ADMIN_PASSWORD>` à @Fertilinnov_bot. Ce mot de passe d'installation ne sert qu'à relier la conversation au bot : l'espace de pilotage a ses propres identifiants (commande `/acces`).
6. (Recommandé) *Settings → Git → Deploy Hooks* : créer un hook et le mettre dans `VERCEL_DEPLOY_HOOK_URL` — le Chef pourra régénérer les pages pré-rendues (`/deploy` ou « régénère les pages SEO ») après des modifications de contenu. Les visiteurs voient de toute façon les changements immédiatement (configuration chargée depuis `/api/site`).
7. Le cron Vercel (`vercel.json`, 06:00 UTC) envoie chaque matin le briefing des demandes sur Telegram.

Domaine `www.fertilinnov-environnement.com` : l'ajouter dans Vercel → *Domains* et mettre à jour les DNS chez le registrar.

## Hébergement hors Vercel

Le site tourne aussi bien sur Vercel que chez un hébergeur classique. `vercel.json` reste la source unique des redirections, en-têtes et tâches planifiées ; `server.mjs` les relit.

| Cas | Ce qu'il faut | Ce qui fonctionne |
|---|---|---|
| **A. L'hébergeur exécute Node.js** (VPS, cPanel « Setup Node.js App », Passenger) | Node 20 ou plus. Déposer `dist/`, `api/`, `src/data/`, `node_modules/` (ou `npm ci --omit=dev` sur place), `server.mjs`, `app.cjs`, `vercel.json`, `package.json` et le fichier `.env`. Démarrer avec `npm start` (ou fichier de démarrage `app.cjs` pour Passenger). | Tout : pages, Petit Pois, formulaire, espace propriétaire, Telegram, briefing du matin, mesure d'audience. |
| **B. Apache sert les pages, `/api` est transmis ailleurs** | `npm run build:apache`, déposer le contenu de `dist/`, puis décommenter le bloc « API » de `.htaccess` (vers un serveur Node ou vers le déploiement Vercel). Demande `mod_proxy` autorisé par l'hébergeur. | Tout, si le proxy est autorisé. |
| **C. Apache seul, sans Node** | `npm run build:apache`, déposer le contenu de `dist/`. | Les pages uniquement : le chat, le formulaire et l'espace propriétaire ne répondent pas. |

- **Variables** : les mêmes que sur Vercel, dans un fichier `.env` à côté de `server.mjs` (ou dans le panneau de l'hébergeur). `PORT` choisit le port (3000 par défaut). Mettre `PUBLIC_SITE_URL=https://www.fertilinnov-environnement.com`.
- **Briefing du matin** : `server.mjs` le lance lui-même à l'heure de `vercel.json`. Si l'hébergeur démarre plusieurs processus, poser `DISABLE_CRON=1` et appeler `GET /api/cron/daily` (en-tête `Authorization: Bearer <CRON_SECRET>`) depuis une tâche planifiée.
- **Pages SEO** : elles sont générées par `npm run build`. Après des modifications de contenu via le Chef, relancer le build et redéposer `dist/` (les visiteurs voient de toute façon les changements tout de suite). `DEPLOY_HOOK_URL` peut pointer vers un outil qui automatise ce rebuild.
- **Telegram** : enregistrer le webhook sur le nouveau domaine, comme à l'étape 4 ci-dessus.
- Le fichier `hosting/apache/.htaccess` n'a pas été essayé sur un vrai serveur Apache : le vérifier sur un sous-domaine de test avant la bascule.

## Espace de pilotage (`/pilotage`)

Espace privé du propriétaire : tableau de bord, réglages de l'assistant IA, le Chef. L'adresse est définie une seule fois (`ESPACE_PATH` dans `src/data/infos.js`, à reporter dans `index.html` et `public/robots.txt`) ; `/admin` y redirige.

**Connexion en deux étapes.** Identifiant + mot de passe, puis code à 8 caractères envoyé par le bot Telegram (valable 5 minutes, une seule utilisation, 5 essais). Chaque connexion déclenche une alerte Telegram et un e-mail à `COMPANY_EMAIL`. La page de connexion ne dit rien de ce mécanisme.

- **Créer ou changer ses identifiants** : envoyer `/acces` au bot. Il répond par un lien personnel (15 minutes, une seule utilisation) vers une page où l'on choisit identifiant et mot de passe. Aucun mot de passe ne transite par Telegram. Un compte par conversation Telegram autorisée.
- **Ce qui est enregistré** (lignes privées `vault` et `vault-tmp` de `fi_site_settings`, jamais envoyées au navigateur) : empreinte scrypt du mot de passe, clé d'IA chiffrée en AES-256-GCM avec une clé dérivée de `SESSION_SECRET`, empreinte des codes et des liens, journal des 50 derniers événements. Changer `SESSION_SECRET` rend la clé d'IA enregistrée illisible (il faut la ressaisir) et déconnecte tout le monde.
- **Protections** : 5 mots de passe erronés bloquent le compte une heure (alerte Telegram), limite d'essais par adresse, session de 12 h (cookie `HttpOnly`, `SameSite=Strict`, `Secure` en production), origine vérifiée sur toutes les écritures, bot limité aux conversations privées.

**Tableau de bord.** Demandes par jour / semaine / mois et par type, travail à faire (demandes ouvertes, les plus anciennes d'abord), statuts, services, canal, langue, heures d'arrivée, délai de prise en charge, taux de transformation, audience du site, activité de Petit Pois, comparaison avec la période précédente. Exports **PDF** (rapport mis en page) et **Excel** (5 feuilles avec filtres), générés dans le navigateur.

**Assistant IA.** Interrupteur marche / arrêt, fournisseur, clé, modèle, consignes supplémentaires, quotas — sans toucher au code ni à l'hébergeur. Fournisseurs : Anthropic, Groq, OpenAI, Google Gemini, Mistral, DeepSeek, xAI, OpenRouter, Together, Fireworks, Cerebras, ou toute adresse compatible avec l'API d'OpenAI (`api/_lib/providers.js`). « Charger les modèles » demande la liste réelle au fournisseur ; un réglage actif n'est enregistré que si l'essai réussit (réponse **et** appel d'outil, indispensable à l'enregistrement des devis). Changer la clé ou le fournisseur redemande le mot de passe. Les variables du serveur (`LLM_PROVIDER`, clés) restent le réglage de secours. Sur Telegram : `/ia`, `/ia off`, `/ia on`.

## Mesure d'audience (sans cookie)

Chaque page affichée envoie son chemin à `POST /api/hit`, qui incrémente des compteurs anonymes par jour (table `fi_counters`, clés `pv:<jour>:…`) : pages vues par page, visites, provenance (Google, LinkedIn, accès direct…), type d'appareil. Aucune adresse IP, aucun identifiant de visiteur, aucun cookie ni stockage dans le navigateur : pas de bandeau de consentement à afficher. Les robots et les visiteurs ayant activé « ne pas me pister » ne sont pas comptés. Les chiffres s'affichent dans l'espace de pilotage, dans `/stats` sur Telegram et sur demande au Chef. Une « visite » correspond à un chargement du site : ce n'est pas un nombre de visiteurs uniques.

## Coûts et modèle

`LLM_PROVIDER=groq` (gratuit, `openai/gpt-oss-120b`, limité à 8 000 tokens/min sur le palier gratuit — le SDK réessaie) ou `LLM_PROVIDER=anthropic` (`claude-sonnet-5` par défaut pour Petit Pois, prompt caching, plus fiable). `POIS_MODEL`, `CHEF_MODEL`, `POIS_GUARD_MODEL` permettent de choisir les modèles sans toucher au code.

## Personnaliser dans le code

- **Couleurs / typo** : `tailwind.config.js` (jetons `fi.*`), `src/index.css` (variables `--fi-*`), `src/site/SiteProvider.jsx` (`FONT_PRESETS`, `PALETTE_DEFAULT`), `api/_lib/settings.js` (`PALETTE_PRESETS`, `IMAGE_SLOTS`).
- **Textes** : `src/data/content.js` · **Contenu structuré** : `src/data/site.js` · **Coordonnées et horaires** : `src/data/infos.js`.
- **Comportement de Petit Pois / du Chef** : `api/_lib/petitpois.js`, `api/_lib/chef.js`, `api/_lib/guard.js`.
- **Images** : `scripts/optimize-images.mjs` régénère `public/images` depuis le dossier d'origine.

## Note de sécurité

L'ancien site appelait Groq directement depuis le navigateur avec une clé API visible dans le HTML (`gsk_KV3x…`). Cette clé est publique : **la révoquer** sur console.groq.com. Le nouveau site n'expose aucune clé.
