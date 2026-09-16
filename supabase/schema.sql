-- Schéma Supabase pour Fertil'Innov Environnement (Petit Pois + le Chef).
-- Toutes les tables sont préfixées "fi_" : le projet Supabase peut être partagé
-- avec un autre site (ex. L'Atelier Doré) sans collision.
-- À exécuter dans Supabase → SQL Editor → New query → Run.
-- Accès uniquement via la clé "service role" (serveur) : RLS activé sans policy.

create extension if not exists pgcrypto;

-- Sessions de chat (une par visiteur, cookie signé côté serveur)
create table if not exists fi_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_message_at timestamptz,
  ip_hash text,
  message_count integer not null default 0,
  offtopic_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'blocked'))
);
create index if not exists fi_chat_sessions_ip_idx on fi_chat_sessions (ip_hash, created_at desc);

create table if not exists fi_chat_messages (
  id bigserial primary key,
  session_id uuid not null references fi_chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  kind text not null default 'text' check (kind in ('text', 'tool')),
  content jsonb not null,
  display_text text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists fi_chat_messages_session_idx on fi_chat_messages (session_id, id);

-- Compteurs glissants (rate limiting par IP, anti-spam formulaire…)
create table if not exists fi_counters (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

-- Consommation quotidienne de tokens (budget global)
create table if not exists fi_usage_daily (
  day date primary key,
  requests integer not null default 0,
  input_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  output_tokens bigint not null default 0
);

-- Demandes clients : devis, formation, information, partenariat (via Petit Pois ou le formulaire)
create table if not exists fi_leads (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,                -- FI-XXXXXX
  session_id uuid references fi_chat_sessions (id) on delete set null,
  source text not null default 'chat' check (source in ('chat', 'formulaire')),
  type text not null check (type in ('devis', 'formation', 'info', 'partenariat')),
  status text not null default 'nouvelle' check (status in ('nouvelle', 'en_cours', 'devis_envoye', 'gagnee', 'perdue', 'traitee')),
  lang text not null default 'fr',
  client jsonb not null,                      -- { nom, email, telephone, organisation }
  client_email text not null,
  service text,                               -- id du service concerné (diagnostics, biofertilisation…)
  details jsonb,                              -- { surface_ha, localisation, formation, message, … }
  resume text,                                -- résumé rédigé par Petit Pois pour l'équipe
  notes text,                                 -- notes internes (Chef)
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists fi_leads_status_idx on fi_leads (status, created_at desc);
create index if not exists fi_leads_email_idx on fi_leads (client_email, created_at desc);

-- Conversations autorisées avec le Chef (Telegram, web admin…)
create table if not exists fi_chef_chats (
  chat_id text primary key,
  name text,
  authorized_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists fi_chef_messages (
  id bigserial primary key,
  chat_id text not null references fi_chef_chats (chat_id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  kind text not null default 'text' check (kind in ('text', 'tool')),
  content jsonb not null,
  display_text text,
  created_at timestamptz not null default now()
);
create index if not exists fi_chef_messages_chat_idx on fi_chef_messages (chat_id, id);

-- Configuration du site pilotée par le propriétaire (textes, listes, palette, images…)
create table if not exists fi_site_settings (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table fi_chat_sessions enable row level security;
alter table fi_chat_messages enable row level security;
alter table fi_counters enable row level security;
alter table fi_usage_daily enable row level security;
alter table fi_leads enable row level security;
alter table fi_chef_chats enable row level security;
alter table fi_chef_messages enable row level security;
alter table fi_site_settings enable row level security;

-- Incrémente un compteur dans une fenêtre glissante ; retourne la nouvelle valeur.
create or replace function fi_bump_counter(p_key text, p_window_seconds integer)
returns integer language plpgsql security definer as $$
declare v_count integer;
begin
  insert into fi_counters (key, count, window_start) values (p_key, 1, now())
  on conflict (key) do update
    set count = case when fi_counters.window_start < now() - make_interval(secs => p_window_seconds) then 1 else fi_counters.count + 1 end,
        window_start = case when fi_counters.window_start < now() - make_interval(secs => p_window_seconds) then now() else fi_counters.window_start end
  returning count into v_count;
  return v_count;
end; $$;

create or replace function fi_add_usage(p_input bigint, p_cache_read bigint, p_cache_write bigint, p_output bigint)
returns void language plpgsql security definer as $$
begin
  insert into fi_usage_daily (day, requests, input_tokens, cache_read_tokens, cache_write_tokens, output_tokens)
  values ((now() at time zone 'Europe/Paris')::date, 1, p_input, p_cache_read, p_cache_write, p_output)
  on conflict (day) do update
    set requests = fi_usage_daily.requests + 1,
        input_tokens = fi_usage_daily.input_tokens + excluded.input_tokens,
        cache_read_tokens = fi_usage_daily.cache_read_tokens + excluded.cache_read_tokens,
        cache_write_tokens = fi_usage_daily.cache_write_tokens + excluded.cache_write_tokens,
        output_tokens = fi_usage_daily.output_tokens + excluded.output_tokens;
end; $$;

create or replace function fi_today_tokens()
returns bigint language sql security definer as $$
  select coalesce(sum(input_tokens + cache_read_tokens + cache_write_tokens + output_tokens), 0)
  from fi_usage_daily where day = (now() at time zone 'Europe/Paris')::date;
$$;

create or replace function fi_refund_turn(p_id uuid)
returns void language sql security definer as $$
  update fi_chat_sessions set message_count = greatest(message_count - 1, 0) where id = p_id;
$$;

create or replace function fi_add_strike(p_id uuid, p_limit integer)
returns integer language plpgsql security definer as $$
declare v_count integer;
begin
  update fi_chat_sessions
     set offtopic_count = offtopic_count + 1,
         status = case when offtopic_count + 1 >= p_limit then 'blocked' else status end
   where id = p_id
   returning offtopic_count into v_count;
  return v_count;
end; $$;
