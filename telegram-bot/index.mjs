import { Bot, InlineKeyboard, InputFile } from 'grammy';
import bcrypt from 'bcryptjs';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DB_FILE = path.join(DATA_DIR, 'database.json');
const SESSION_DIR = path.join(DATA_DIR, 'whatsapp-sessions');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN belum diisi. Salin .env.example ke .env dan isi token bot.');
await fs.mkdir(SESSION_DIR, { recursive: true });

const ROLE_LEVEL = { user: 0, seller: 1, prem: 2, admin: 3, partner: 4, owner: 5 };
const ROLE_ALIASES = { seler: 'seller', seller: 'seller', user: 'user', prem: 'prem', admin: 'admin', partner: 'partner', owner: 'owner' };
const OWNER_IDS = new Set((process.env.OWNER_TELEGRAM_IDS || '').split(',').map(x => x.trim()).filter(Boolean));
const logger = pino({ level: 'silent' });
let db = { accounts: [], senders: [] };
try { db = { ...db, ...JSON.parse(await fs.readFile(DB_FILE, 'utf8')) }; }
catch { await saveDb(); }
async function saveDb() { await fs.mkdir(DATA_DIR, { recursive: true }); await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), { mode: 0o600 }); }
const bot = new Bot(TOKEN);
const waSockets = new Map();
const pairingInProgress = new Set();
const safe = (s) => String(s ?? '').replace(/[<>]/g, '');
const normalizePhone = (s) => String(s || '').replace(/\D/g, '');
const getAccount = (username) => db.accounts.find(a => a.username.toLowerCase() === String(username || '').toLowerCase());
const getActor = (ctx) => {
  const id = String(ctx.from?.id || '');
  if (OWNER_IDS.has(id)) return { telegramId: id, role: 'owner', username: 'env-owner' };
  return db.accounts.find(a => String(a.telegramId || '') === id && (!a.expiresAt || new Date(a.expiresAt).getTime() > Date.now()));
};
const hasRole = (actor, role) => !!actor && (ROLE_LEVEL[actor.role] ?? -1) >= (ROLE_LEVEL[role] ?? 99);
const canManage = (actor, targetRole) => hasRole(actor, targetRole) && (ROLE_LEVEL[actor.role] ?? -1) > (ROLE_LEVEL[targetRole] ?? 99);
function durationMs(value) {
  const m = String(value || '').trim().match(/^(\d+)(d|h|m)$/i);
  if (!m) return null;
  const unit = { d: 86400000, h: 3600000, m: 60000 }[m[2].toLowerCase()];
  const n = Number(m[1]);
  return n > 0 && n <= 3650 ? n * unit : null;
}
function fmtDate(date) { return date ? new Date(date).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Unlimited'; }
function parsePairArgs(ctx) {
  const raw = ctx.match.trim();
  const parts = raw.split(',').map(x => x.trim());
  return { phone: normalizePhone(parts[0]), username: parts[1] || '' };
}
async function replyPrivate(ctx, text, options = {}) {
  if (ctx.chat?.type !== 'private') return ctx.reply('Demi keamanan, gunakan bot ini melalui chat pribadi.');
  return ctx.reply(text, { protect_content: true, ...options });
}
async function requireRole(ctx, role) {
  const actor = getActor(ctx);
  if (!hasRole(actor, role)) { await replyPrivate(ctx, '⛔ Akses ditolak. Role yang dibutuhkan: ' + role + '.'); return null; }
  return actor;
}
async function showMenu(ctx) {
  const actor = getActor(ctx);
  const active = db.accounts.filter(a => !a.expiresAt || new Date(a.expiresAt).getTime() > Date.now()).length;
  const connected = db.senders.filter(s => s.status === 'connected').length;
  const kb = new InlineKeyboard()
    .text('👤 Akun', 'menu_accounts').text('📡 Sender', 'menu_senders').row()
    .text('🔐 Pair Private', 'menu_pairpriv').text('🌐 Pair Public', 'menu_pairpub').row()
    .text('🪪 Profil saya', 'menu_profile').text('📖 Bantuan', 'menu_help');
  return ctx.reply(
    `╭━━━ 🖤 VALEN DATABASE ━━━╮\n│  Pusat kontrol akun & sender\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `👤 Akun aktif: ${active}\n📡 Sender online: ${connected}/${db.senders.length}\n🛡️ Role: ${(actor?.role || 'belum login').toUpperCase()}\n\nPilih menu untuk melanjutkan.`,
    { reply_markup: kb, protect_content: true }
  );
}
bot.command('start', async (ctx) => {
  const kb = new InlineKeyboard().text('🗄️ Database Menu', 'database_menu');
  const media = (process.env.START_MEDIA_URL || '').trim();
  const caption = '🖤 VALEN DATABASE\nBot pengelolaan akun dan pairing sender WhatsApp.\n\nTekan tombol untuk membuka menu database.';
  if (/\.mp4(?:\?|$)/i.test(media)) {
    try { return await ctx.replyWithVideo(media, { caption, reply_markup: kb, protect_content: true }); } catch {}
  } else if (media) {
    try { return await ctx.replyWithPhoto(media, { caption, reply_markup: kb, protect_content: true }); } catch {}
  }
  return ctx.reply(caption, { reply_markup: kb, protect_content: true });
});
bot.callbackQuery('database_menu', async (ctx) => { await ctx.answerCallbackQuery(); await showMenu(ctx); });
bot.callbackQuery('menu_accounts', async (ctx) => {
  await ctx.answerCallbackQuery(); const actor = getActor(ctx);
  await ctx.reply(`👤 AKUN DATABASE\nTotal akun: ${db.accounts.length}\nAkun aktif: ${db.accounts.filter(a => !a.expiresAt || new Date(a.expiresAt) > new Date()).length}\nRole Anda: ${actor?.role || 'belum login'}\n\nGunakan /login username,password untuk menghubungkan akun Telegram dengan akun database.`, { protect_content: true });
});
bot.callbackQuery('menu_senders', async (ctx) => {
  await ctx.answerCallbackQuery();
  const lines = db.senders.length ? db.senders.map(s => `• ${s.phone} — ${s.type.toUpperCase()} — ${s.status}${s.username ? ` — @${s.username}` : ''}`).join('\n') : 'Belum ada sender yang dipairing.';
  await ctx.reply(`📡 STATUS SENDER\n${lines}\n\nGunakan /ceksender untuk memperbarui status.`, { protect_content: true });
});
bot.callbackQuery('menu_profile', async (ctx) => {
  await ctx.answerCallbackQuery();
  const actor = getActor(ctx);
  if (!actor) return ctx.reply('Akun Telegram belum terhubung. Gunakan /login username,password.');
  const account = actor.username === 'env-owner' ? null : getAccount(actor.username);
  return ctx.reply(`🪪 PROFIL VALEN DATABASE\nUsername: ${actor.username}\nRole: ${actor.role.toUpperCase()}\nTelegram ID: ${actor.telegramId}\nExpired: ${fmtDate(account?.expiresAt)}`, { protect_content: true });
});
bot.callbackQuery('menu_pairpriv', async (ctx) => {
  await ctx.answerCallbackQuery();
  return ctx.reply('🔐 PAIR PRIVATE\nFormat: /pairpriv 62xxxxxxxxxx,username\n\nNomor harus milik Anda atau pemiliknya memberi izin. Kode pairing hanya boleh dimasukkan pada WhatsApp pemilik nomor.', { protect_content: true });
});
bot.callbackQuery('menu_pairpub', async (ctx) => {
  await ctx.answerCallbackQuery();
  return ctx.reply('🌐 PAIR PUBLIC\nFormat: /pairpub 62xxxxxxxxxx\n\nSender public hanya menandai koneksi bersama; fitur blast/pesan massal tidak tersedia.', { protect_content: true });
});
bot.callbackQuery('menu_help', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('📖 PERINTAH\n/login username,password\n/adduser username,password\n/addseler username,password\n/addprem username,password\n/addpartner username,password\n/addadmin username,password\n/addowner username,password\n/addrole role,username,expired (contoh 7d atau 30d)\n/deleteakun username\n/pairpriv 62xxxxxxxxxx,username\n/pairpub 62xxxxxxxxxx\n/ceksender\n\nPrivate sender ditautkan ke satu username; public sender hanya dicatat sebagai koneksi bersama. Bot ini tidak menyediakan pengiriman massal/otomatis ke nomor lain.', { protect_content: true });
});
bot.command('login', async (ctx) => {
  if (ctx.chat.type !== 'private') return replyPrivate(ctx, 'Login hanya melalui chat pribadi.');
  const parts = ctx.match.split(',').map(x => x.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return ctx.reply('Format: /login username,password');
  const account = getAccount(parts[0]);
  if (!account || !(await bcrypt.compare(parts[1], account.passwordHash))) return ctx.reply('Username atau password salah.');
  if (account.expiresAt && new Date(account.expiresAt).getTime() <= Date.now()) return ctx.reply('Akun sudah expired. Hubungi administrator.');
  if (account.telegramId && String(account.telegramId) !== String(ctx.from.id)) return ctx.reply('Akun sudah terhubung ke Telegram lain. Hubungi owner.');
  account.telegramId = String(ctx.from.id); account.telegramUsername = ctx.from.username || null;
  await saveDb(); await ctx.reply(`✅ Login berhasil. Role: ${account.role.toUpperCase()}\nExpired: ${fmtDate(account.expiresAt)}\nJangan bagikan password Anda.`);
});

async function addAccount(ctx, role) {
  const actor = await requireRole(ctx, role === 'user' ? 'seller' : role);
  if (!actor) return;
  if (role === 'owner' && !hasRole(actor, 'owner')) return replyPrivate(ctx, 'Hanya owner yang dapat membuat owner.');
  if (role === 'partner' && !hasRole(actor, 'owner')) return replyPrivate(ctx, 'Hanya owner yang dapat membuat partner.');
  if (role === 'admin' && !hasRole(actor, 'partner')) return replyPrivate(ctx, 'Hanya owner/partner yang dapat membuat admin.');
  if (role === 'prem' && !hasRole(actor, 'admin')) return replyPrivate(ctx, 'Hanya owner/partner/admin yang dapat membuat prem.');
  if (role === 'seller' && !hasRole(actor, 'prem')) return replyPrivate(ctx, 'Hanya owner/partner/admin/prem yang dapat membuat seller.');
  const parts = ctx.match.split(',').map(x => x.trim());
  const [username, password] = parts;
  if (!username || !password || parts.length !== 2) return replyPrivate(ctx, `Format: /add${role === 'seller' ? 'seler' : role} username,password`);
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return replyPrivate(ctx, 'Username harus 3–32 karakter (huruf, angka, titik, _ atau -).');
  if (password.length < 8 || password.length > 128) return replyPrivate(ctx, 'Password harus 8–128 karakter.');
  if (getAccount(username)) return replyPrivate(ctx, 'Username sudah terdaftar.');
  const hash = await bcrypt.hash(password, 12);
  db.accounts.push({ username, role, passwordHash: hash, createdAt: new Date().toISOString(), createdBy: actor.username, expiresAt: null, telegramId: null });
  await saveDb(); return replyPrivate(ctx, `✅ Akun ${username} dibuat.\nRole: ${role.toUpperCase()}\nExpired: Unlimited\nPengguna dapat menghubungkan Telegram dengan /login username,password.`);
}
for (const [command, role] of Object.entries({ adduser: 'user', addseler: 'seller', addprem: 'prem', addpartner: 'partner', addadmin: 'admin', addowner: 'owner' })) {
  bot.command(command, (ctx) => addAccount(ctx, role));
}
bot.command('addrole', async (ctx) => {
  const actor = getActor(ctx); if (!actor || !hasRole(actor, 'admin')) return replyPrivate(ctx, '⛔ Hanya owner/partner/admin.');
  const [roleRaw, username, expiryRaw] = ctx.match.split(',').map(x => x.trim());
  const role = ROLE_ALIASES[(roleRaw || '').toLowerCase()];
  if (!role || !username || !expiryRaw) return replyPrivate(ctx, 'Format: /addrole seler,username,7d (durasi: 1d, 7d, 30d, 12h; gunakan 30d untuk kira-kira sebulan).');
  const target = getAccount(username); if (!target) return replyPrivate(ctx, 'Akun tidak ditemukan.');
  if (!canManage(actor, target.role) || !canManage(actor, role)) return replyPrivate(ctx, 'Anda tidak memiliki izin mengubah role tersebut.');
  const ms = /^(unlimited|permanent)$/i.test(expiryRaw) ? null : durationMs(expiryRaw);
  if (ms === null && !/^(unlimited|permanent)$/i.test(expiryRaw)) return replyPrivate(ctx, 'Durasi tidak valid. Gunakan 1d, 7d, 30d, atau 12h.');
  target.role = role; target.expiresAt = ms ? new Date(Date.now() + ms).toISOString() : null;
  await saveDb(); return replyPrivate(ctx, `✅ Role akun ${target.username} diperbarui: ${role.toUpperCase()}\nExpired: ${fmtDate(target.expiresAt)}`);
});
bot.command('deleteakun', async (ctx) => {
  const actor = await requireRole(ctx, 'admin'); if (!actor) return;
  const username = ctx.match.trim(); if (!username) return replyPrivate(ctx, 'Format: /deleteakun username');
  const target = getAccount(username); if (!target) return replyPrivate(ctx, 'Akun tidak ditemukan.');
  if (!canManage(actor, target.role)) return replyPrivate(ctx, 'Tidak bisa menghapus akun dengan role sama/lebih tinggi.');
  db.accounts = db.accounts.filter(a => a !== target); db.senders = db.senders.filter(s => s.username !== target.username);
  await saveDb(); return replyPrivate(ctx, `🗑️ Akun ${username} dihapus.`);
});

async function pairWhatsApp(ctx, type) {
  const actor = await requireRole(ctx, 'seller'); if (!actor) return;
  const { phone, username } = parsePairArgs(ctx);
  if (!/^\d{10,15}$/.test(phone)) return replyPrivate(ctx, `Format: /pair${type === 'private' ? 'priv' : 'pub'} 62xxxxxxxxxx${type === 'private' ? ',username' : ''}`);
  if (type === 'private') {
    if (!username) return replyPrivate(ctx, 'Sender private wajib ditautkan: /pairpriv 62xxxxxxxxxx,username');
    const account = getAccount(username); if (!account) return replyPrivate(ctx, 'Username tidak ditemukan di database.');
    if (!hasRole(actor, 'admin') && account.username.toLowerCase() !== actor.username?.toLowerCase()) return replyPrivate(ctx, 'Role seller/prem hanya dapat menautkan akun sendiri.');
  }
  if (pairingInProgress.has(phone)) return replyPrivate(ctx, 'Pairing untuk nomor ini sedang berjalan. Tunggu sebentar.');
  const existing = db.senders.find(s => s.phone === phone);
  if (existing && existing.status === 'connected') return replyPrivate(ctx, 'Nomor ini sudah terhubung.');
  pairingInProgress.add(phone);
  const sender = existing || { phone, type, username: type === 'private' ? username : null, status: 'pairing', updatedAt: new Date().toISOString() };
  Object.assign(sender, { type, username: type === 'private' ? username : null, status: 'pairing', requestedBy: actor.username || actor.telegramId, chatId: String(ctx.chat.id), updatedAt: new Date().toISOString() });
  if (!existing) db.senders.push(sender); await saveDb();
  try {
    const authDir = path.join(SESSION_DIR, phone);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state, logger, printQRInTerminal: false, browser: ['Valen Database', 'Chrome', '1.0.0'], connectTimeoutMs: 60000, defaultQueryTimeoutMs: 60000 });
    waSockets.set(phone, sock);
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
        sender.status = 'connected'; sender.connectedAt = new Date().toISOString(); sender.updatedAt = new Date().toISOString(); await saveDb();
        await bot.api.sendMessage(Number(sender.chatId), `✅ Sender ${phone} berhasil terhubung (${type.toUpperCase()}).`);
      }
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        sender.status = code === DisconnectReason.loggedOut ? 'logged_out' : 'disconnected'; sender.updatedAt = new Date().toISOString(); await saveDb();
        waSockets.delete(phone);
        try { await bot.api.sendMessage(Number(sender.chatId), `⚠️ Sender ${phone} terputus. Status: ${sender.status}. Gunakan /ceksender untuk melihat status; jika logout, pairing ulang diperlukan.`); } catch {}
      }
    });
    if (!state.creds.registered) {
      // Baileys needs the socket to begin connecting before it can issue a phone pairing code.
      await new Promise(resolve => setTimeout(resolve, 3000));
      let code;
      let lastPairError;
      for (let attempt = 0; attempt < 3 && !code; attempt++) {
        try { code = await sock.requestPairingCode(phone); }
        catch (err) { lastPairError = err; if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1800)); }
      }
      if (!code) throw lastPairError || new Error('Kode pairing belum tersedia.');
      await replyPrivate(ctx, `╭━━ 🔐 KODE PAIRING ━━╮\nNomor: ${phone}\nKode: ${code}\n╰━━━━━━━━━━━━━━━━╯\n\nDi WhatsApp pemilik nomor: Perangkat tertaut → Tautkan perangkat → Tautkan dengan nomor telepon, lalu masukkan kode di atas. Kode ini rahasia; jangan bagikan kepada siapa pun. Bot akan memberi notifikasi saat berhasil terhubung.`, { protect_content: true });
    } else {
      await replyPrivate(ctx, `⏳ Menghubungkan kembali sender ${phone}. Bot akan memberi notifikasi saat status berubah.`);
    }
  } catch (error) {
    sender.status = 'error'; sender.updatedAt = new Date().toISOString(); await saveDb();
    await replyPrivate(ctx, `❌ Pairing gagal untuk ${phone}. Pastikan nomor milik Anda/ada izin pemilik dan coba lagi. Detail: ${safe(error?.message || 'unknown error').slice(0, 180)}`);
  } finally { pairingInProgress.delete(phone); }
}
bot.command('pairpriv', (ctx) => pairWhatsApp(ctx, 'private'));
bot.command('pairpub', (ctx) => pairWhatsApp(ctx, 'public'));
bot.command('ceksender', async (ctx) => {
  const actor = await requireRole(ctx, 'seller'); if (!actor) return;
  if (!db.senders.length) return replyPrivate(ctx, 'Belum ada sender terdaftar.');
  const lines = db.senders.map(s => `• ${s.phone} | ${s.type.toUpperCase()} | ${s.status}${s.username ? ` | @${s.username}` : ''} | update ${fmtDate(s.updatedAt)}`);
  return replyPrivate(ctx, `📡 STATUS SENDER\n${lines.join('\n')}`);
});

bot.catch((err) => console.error('Telegram bot error:', err.error?.message || err.message));
await bot.api.setMyCommands([
  { command: 'start', description: 'Buka Valen Database' }, { command: 'login', description: 'Hubungkan akun database ke Telegram' },
  { command: 'adduser', description: 'Buat akun user' }, { command: 'addseler', description: 'Buat akun seller' },
  { command: 'addprem', description: 'Buat akun premium' }, { command: 'addpartner', description: 'Buat akun partner' },
  { command: 'addadmin', description: 'Buat akun admin' }, { command: 'addowner', description: 'Buat akun owner' },
  { command: 'addrole', description: 'Ubah role dan masa aktif' }, { command: 'deleteakun', description: 'Hapus akun' },
  { command: 'pairpriv', description: 'Pairing sender private' }, { command: 'pairpub', description: 'Pairing sender public' },
  { command: 'ceksender', description: 'Cek status sender' }
]);
console.log('Valen Database bot started.');
bot.start();

// Restore saved Baileys sessions after a process restart so status monitoring continues.
for (const sender of db.senders.filter(s => s.status !== 'logged_out' && s.status !== 'error')) {
  (async () => {
    try {
      const authDir = path.join(SESSION_DIR, sender.phone);
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      if (!state.creds.registered) return;
      const { version } = await fetchLatestBaileysVersion();
      const sock = makeWASocket({ version, auth: state, logger, printQRInTerminal: false, browser: ['Valen Database', 'Chrome', '1.0.0'], connectTimeoutMs: 60000, defaultQueryTimeoutMs: 60000, keepAliveIntervalMs: 25000 });
      waSockets.set(sender.phone, sock);
      sock.ev.on('creds.update', saveCreds);
      sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') { sender.status = 'connected'; sender.updatedAt = new Date().toISOString(); await saveDb(); }
        if (connection === 'close') {
          const code = lastDisconnect?.error?.output?.statusCode;
          sender.status = code === DisconnectReason.loggedOut ? 'logged_out' : 'disconnected';
          sender.updatedAt = new Date().toISOString(); await saveDb(); waSockets.delete(sender.phone);
          if (sender.chatId) try { await bot.api.sendMessage(Number(sender.chatId), `⚠️ Sender ${sender.phone} terputus. Status: ${sender.status}.`); } catch {}
        }
      });
    } catch (err) { console.error(`Gagal memulihkan sender ${sender.phone}:`, err?.message || err); }
  })();
}

async function shutdown() {
  bot.stop();
  for (const sock of waSockets.values()) { try { sock.end(undefined); } catch {} }
  process.exit(0);
}
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
