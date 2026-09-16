# Fertil'Innov Environnement — site React (v2)

Refonte du site vitrine de **Fertil'Innov Environnement** (ingénierie écologique, microbiologie des sols, Grabels) : React + Vite, animations GSAP/Framer Motion, **trilingue (FR / EN / ES)**, pré-rendu statique pour Google et les IA, **Petit Pois** (assistant IA) et **le Chef** (agent du propriétaire sur Telegram et `/admin`) qui permet de modifier tout le site en langage naturel.

Le design, la palette verte, le logo, les images, la mascotte Petit Pois et tout le contenu du site d'origine sont conservés ; seuls l'exécution, les animations et les fonctionnalités changent.

## Ce que fait le site

| | |
|---|---|
| **Pages** | Accueil, Services, Activités, Expertise, Formations, Chiffres, Blog, FAQ, Contact — chacune en `/`, `/en/…`, `/es/…` (sélecteur de langue dans le header). |
| **Petit Pois** | Assistant IA (Claude ou Groq) côté serveur : répond dans la langue du visiteur, consulte services / FAQ / formations, qualifie le besoin et **enregistre la demande de devis** (`create_lead`) → email à l'entreprise, accusé de réception au client, notification Telegram au propriétaire. Filtre de périmètre, quotas et budget de tokens (voir plus bas). |
| **Le Chef** | Agent du propriétaire sur **Telegram (@Fertilinnov_bot)** et sur **`/admin`** : demandes clients (liste, statuts, réponse par email), statistiques, synthèse des questions des visiteurs, et **tout le contenu du site** : nom, slogan, coordonnées, horaires, textes, services, activités, expertise, formations, FAQ, blog, équipe, partenaires, réalisations, chiffres clés, couleurs (palettes prêtes ou codes hex), police, photos (envoyées dans Telegram). Le propriétaire écrit en français, **les traductions EN/ES sont automatiques**. |
| **SEO / GEO** | Pré-rendu HTML de 27 pages (9 pages × 3 langues) au build, `hreflang`, canonical, Open Graph, JSON-LD (Organization/LocalBusiness, Service, Course, FAQPage, Blog, BreadcrumbList), `sitemap.xml`, `robots.txt` autorisant explicitement GPTBot, ClaudeBot, Google-Extended, PerplexityBot, DeepSeek, Kimi…, `llms.txt`. Images WebP optimisées (41 Mo → 2,7 Mo), lazy-loading, polices pré-connectées. |
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
| Messages max par IP et par jour | `CHAT_MAX_MESSAGES_PER_IP_PER_DAY` | 40 |
| Nouvelles conversations par IP et par jour | `CHAT_MAX_SESSIONS_PER_IP_PER_DAY` | 3 |
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

1. **GitHub** : dépôt `fertil-innov` (branche `main`).
2. **Vercel** → *Add New Project* → importer le dépôt (Vite détecté ; build = `npm run build`, sortie = `dist`). Node 22 est demandé par `engines`.
3. *Settings → Environment Variables* : copier toutes les variables de `.env.local` **plus** `PUBLIC_SITE_URL=https://<votre-domaine>`.
4. Déployer. Puis, une seule fois, enregistrer le webhook Telegram :
   `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<votre-domaine>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>`
5. Dans Telegram, envoyer `/start <ADMIN_PASSWORD>` à @Fertilinnov_bot. Le même mot de passe ouvre `/admin`.
6. (Recommandé) *Settings → Git → Deploy Hooks* : créer un hook et le mettre dans `VERCEL_DEPLOY_HOOK_URL` — le Chef pourra régénérer les pages pré-rendues (`/deploy` ou « régénère les pages SEO ») après des modifications de contenu. Les visiteurs voient de toute façon les changements immédiatement (configuration chargée depuis `/api/site`).
7. Le cron Vercel (`vercel.json`, 06:00 UTC) envoie chaque matin le briefing des demandes sur Telegram.

Domaine `www.fertilinnov-environnement.com` : l'ajouter dans Vercel → *Domains* et mettre à jour les DNS chez le registrar.

## Coûts et modèle

`LLM_PROVIDER=groq` (gratuit, `openai/gpt-oss-120b`, limité à 8 000 tokens/min sur le palier gratuit — le SDK réessaie) ou `LLM_PROVIDER=anthropic` (`claude-sonnet-5` par défaut pour Petit Pois, prompt caching, plus fiable). `POIS_MODEL`, `CHEF_MODEL`, `POIS_GUARD_MODEL` permettent de choisir les modèles sans toucher au code.

## Personnaliser dans le code

- **Couleurs / typo** : `tailwind.config.js` (jetons `fi.*`), `src/index.css` (variables `--fi-*`), `src/site/SiteProvider.jsx` (`FONT_PRESETS`, `PALETTE_DEFAULT`), `api/_lib/settings.js` (`PALETTE_PRESETS`, `IMAGE_SLOTS`).
- **Textes** : `src/data/content.js` · **Contenu structuré** : `src/data/site.js` · **Coordonnées et horaires** : `src/data/infos.js`.
- **Comportement de Petit Pois / du Chef** : `api/_lib/petitpois.js`, `api/_lib/chef.js`, `api/_lib/guard.js`.
- **Images** : `scripts/optimize-images.mjs` régénère `public/images` depuis le dossier d'origine.

## Note de sécurité

L'ancien site appelait Groq directement depuis le navigateur avec une clé API visible dans le HTML (`gsk_KV3x…`). Cette clé est publique : **la révoquer** sur console.groq.com. Le nouveau site n'expose aucune clé.
