// Couche de stockage : Supabase en production, mémoire en local si SUPABASE_URL
// est absent. Toutes les tables sont préfixées (fi_ par défaut) pour pouvoir
// partager un projet Supabase avec un autre site sans collision.
// Le mode mémoire est refusé sur Vercel : les fonctions y sont sans état.

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { env, assertEnv } from './env.js';

const ON_VERCEL = !!process.env.VERCEL;

function supabaseStore() {
  assertEnv(['supabaseUrl', 'supabaseServiceKey']);
  const P = env.tablePrefix;
  const db = createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: globalThis.WebSocket ?? function NoWebSocket() { throw new Error('Realtime désactivé'); } },
  });
  const t = (name) => db.from(`${P}${name}`);
  const rpc = async (fn, args) => {
    const { data, error } = await db.rpc(`${P}${fn}`, args);
    if (error) throw error;
    return data;
  };
  return {
    kind: 'supabase',
    // ----- Sessions du chat (Petit Pois) -----
    async getSession(id) {
      const { data, error } = await t('chat_sessions').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async createSession(ipHash) {
      const { data, error } = await t('chat_sessions').insert({ id: randomUUID(), ip_hash: ipHash }).select('*').single();
      if (error) throw error;
      return data;
    },
    async beginTurn(id, currentCount) {
      const now = new Date().toISOString();
      const { data, error } = await t('chat_sessions').update({ message_count: currentCount + 1, last_message_at: now, last_seen_at: now }).eq('id', id).select('message_count').single();
      if (error) throw error;
      return data.message_count;
    },
    addStrike: (id, limit) => rpc('add_strike', { p_id: id, p_limit: limit }),
    async refundTurn(id) {
      const { error } = await db.rpc(`${P}refund_turn`, { p_id: id });
      if (error) console.error('refund_turn', error.message);
    },
    bumpCounter: (key, windowSeconds) => rpc('bump_counter', { p_key: key, p_window_seconds: windowSeconds }),
    async addUsage(u) {
      try {
        await rpc('add_usage', { p_input: u.input_tokens || 0, p_cache_read: u.cache_read_input_tokens || 0, p_cache_write: u.cache_creation_input_tokens || 0, p_output: u.output_tokens || 0 });
      } catch (e) { console.error('add_usage', e.message); }
    },
    async todayTokens() {
      try { return Number(await rpc('today_tokens')) || 0; } catch (e) { console.error('today_tokens', e.message); return 0; }
    },
    async saveMessage(sessionId, row) {
      const { error } = await t('chat_messages').insert({ session_id: sessionId, role: row.role, kind: row.kind, content: row.content, display_text: row.displayText ?? null, meta: row.meta ?? null });
      if (error) throw error;
    },
    async loadRows(sessionId) {
      const { data, error } = await t('chat_messages').select('id, role, kind, content, display_text, meta, created_at').eq('session_id', sessionId).order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async recentCustomerMessages(sinceIso, limit = 300) {
      const { data, error } = await t('chat_messages').select('display_text, role, created_at').gte('created_at', sinceIso).not('display_text', 'is', null).order('id', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).reverse();
    },
    async usageSince(day) {
      const { data, error } = await t('usage_daily').select('*').gte('day', day).order('day');
      if (error) throw error;
      return data || [];
    },

    // ----- Demandes (devis, formation, info, partenariat) -----
    async createLead(lead) {
      const { data, error } = await t('leads').insert(lead).select('*').single();
      if (error) throw error;
      return data;
    },
    async getLead(id) {
      const { data, error } = await t('leads').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getLeadByNumero(numero) {
      const { data, error } = await t('leads').select('*').eq('numero', numero).maybeSingle();
      if (error) throw error;
      return data;
    },
    async updateLead(id, patch) {
      const { data, error } = await t('leads').update(patch).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },
    async countLeads(field, value, sinceIso) {
      const { count, error } = await t('leads').select('id', { count: 'exact', head: true }).eq(field, value).gte('created_at', sinceIso);
      if (error) throw error;
      return count || 0;
    },
    async listLeads({ fromIso, toIso, statuses, types, limit = 200 } = {}) {
      let q = t('leads').select('*').order('created_at', { ascending: false }).limit(limit);
      if (fromIso) q = q.gte('created_at', fromIso);
      if (toIso) q = q.lt('created_at', toIso);
      if (statuses?.length) q = q.in('status', statuses);
      if (types?.length) q = q.in('type', types);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    // ----- Chef (agent du propriétaire) -----
    async getChefChat(chatId) {
      const { data, error } = await t('chef_chats').select('*').eq('chat_id', chatId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async authorizeChefChat(chatId, name) {
      const { error } = await t('chef_chats').upsert({ chat_id: chatId, name: name ?? null, last_seen_at: new Date().toISOString() });
      if (error) throw error;
    },
    async listChefChats() {
      const { data, error } = await t('chef_chats').select('*');
      if (error) throw error;
      return data || [];
    },
    async saveChefMessage(chatId, row) {
      const { error } = await t('chef_messages').insert({ chat_id: chatId, role: row.role, kind: row.kind, content: row.content, display_text: row.displayText ?? null });
      if (error) throw error;
    },
    async loadChefMessages(chatId, limit = 60) {
      const { data, error } = await t('chef_messages').select('id, role, kind, content, display_text, created_at').eq('chat_id', chatId).order('id', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).reverse();
    },
    async clearChefMessages(chatId) {
      const { error } = await t('chef_messages').delete().eq('chat_id', chatId);
      if (error) throw error;
    },

    // ----- Configuration du site -----
    async getSettings() {
      const { data, error } = await t('site_settings').select('data').eq('id', 'main').maybeSingle();
      if (error) throw error;
      return data?.data || null;
    },
    async saveSettings(data) {
      const { error } = await t('site_settings').upsert({ id: 'main', data, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    // Fichier public (images du site). Crée le bucket au premier usage.
    async uploadPublicFile(path, buffer, contentType) {
      const bucket = env.storageBucket;
      let { error } = await db.storage.from(bucket).upload(path, buffer, { contentType, upsert: false });
      if (error && /bucket/i.test(error.message)) {
        await db.storage.createBucket(bucket, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
        ({ error } = await db.storage.from(bucket).upload(path, buffer, { contentType, upsert: false }));
      }
      if (error) throw error;
      return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
  };
}

// ---------------------------------------------------------------------------
// Implémentation mémoire (développement local uniquement)
// ---------------------------------------------------------------------------
function memoryStore() {
  const sessions = new Map(); const messages = new Map(); const counters = new Map();
  const leads = new Map(); const chefChats = new Map(); const chefMsgs = new Map();
  let settings = null; const usage = { tokens: 0, day: '' }; let nextId = 1;
  const today = () => new Date().toISOString().slice(0, 10);
  return {
    kind: 'memory',
    async getSession(id) { return sessions.get(id) || null; },
    async createSession(ipHash) { const s = { id: randomUUID(), ip_hash: ipHash, message_count: 0, status: 'active', last_message_at: null, created_at: new Date().toISOString() }; sessions.set(s.id, s); return s; },
    async beginTurn(id) { const s = sessions.get(id); s.message_count += 1; s.last_message_at = new Date().toISOString(); return s.message_count; },
    async refundTurn(id) { const s = sessions.get(id); if (s && s.message_count > 0) s.message_count -= 1; },
    async addStrike(id, limit) { const s = sessions.get(id); s.offtopic_count = (s.offtopic_count || 0) + 1; if (s.offtopic_count >= limit) s.status = 'blocked'; return s.offtopic_count; },
    async bumpCounter(key, windowSeconds) { const now = Date.now(); const c = counters.get(key); if (!c || now - c.start > windowSeconds * 1000) { counters.set(key, { count: 1, start: now }); return 1; } c.count += 1; return c.count; },
    async addUsage(u) { if (usage.day !== today()) { usage.day = today(); usage.tokens = 0; } usage.tokens += (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.output_tokens || 0); },
    async todayTokens() { return usage.day === today() ? usage.tokens : 0; },
    async saveMessage(sessionId, row) { if (!messages.has(sessionId)) messages.set(sessionId, []); messages.get(sessionId).push({ id: nextId++, role: row.role, kind: row.kind, content: row.content, display_text: row.displayText ?? null, meta: row.meta ?? null, created_at: new Date().toISOString() }); },
    async loadRows(sessionId) { return messages.get(sessionId) || []; },
    async recentCustomerMessages(sinceIso, limit = 300) { const out = []; for (const rows of messages.values()) for (const r of rows) if (r.display_text && r.created_at >= sinceIso) out.push({ display_text: r.display_text, role: r.role, created_at: r.created_at }); return out.slice(-limit); },
    async usageSince() { return [{ day: today(), requests: 0, input_tokens: usage.tokens, cache_read_tokens: 0, cache_write_tokens: 0, output_tokens: 0 }]; },
    async createLead(lead) { const l = { id: randomUUID(), created_at: new Date().toISOString(), status: 'nouvelle', ...lead }; leads.set(l.id, l); return l; },
    async getLead(id) { return leads.get(id) || null; },
    async getLeadByNumero(numero) { return [...leads.values()].find((l) => l.numero === numero) || null; },
    async updateLead(id, patch) { return Object.assign(leads.get(id), patch); },
    async countLeads(field, value, sinceIso) { return [...leads.values()].filter((l) => l[field] === value && l.created_at >= sinceIso).length; },
    async listLeads({ fromIso, toIso, statuses, types, limit = 200 } = {}) { return [...leads.values()].filter((l) => (!fromIso || l.created_at >= fromIso) && (!toIso || l.created_at < toIso) && (!statuses?.length || statuses.includes(l.status)) && (!types?.length || types.includes(l.type))).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit); },
    async getChefChat(chatId) { return chefChats.get(chatId) || null; },
    async authorizeChefChat(chatId, name) { chefChats.set(chatId, { chat_id: chatId, name: name ?? null, authorized_at: new Date().toISOString() }); },
    async listChefChats() { return [...chefChats.values()]; },
    async saveChefMessage(chatId, row) { if (!chefMsgs.has(chatId)) chefMsgs.set(chatId, []); chefMsgs.get(chatId).push({ id: nextId++, role: row.role, kind: row.kind, content: row.content, display_text: row.displayText ?? null }); },
    async loadChefMessages(chatId, limit = 60) { return (chefMsgs.get(chatId) || []).slice(-limit); },
    async clearChefMessages(chatId) { chefMsgs.delete(chatId); },
    async getSettings() { return settings; },
    async saveSettings(data) { settings = data; },
    async uploadPublicFile() { throw new Error("Le stockage d'images nécessite Supabase (SUPABASE_URL)."); },
  };
}

let instance;
export function store() {
  if (instance) return instance;
  if (env.supabaseUrl) instance = supabaseStore();
  else if (ON_VERCEL) assertEnv(['supabaseUrl', 'supabaseServiceKey']);
  else { console.warn('[store] SUPABASE_URL absent : stockage en mémoire (dev uniquement).'); instance = memoryStore(); }
  return instance;
}
