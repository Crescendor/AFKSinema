// Cloudflare Pages Edge State Synchronizer: /api/room
// Uses Cloudflare D1 (SQLite) with Multi-Room Support (5-character room codes).

const INACTIVE_MS = 12000;

// ─── Schema Init (Idempotent & Backward-compatible) ─────────────────────────
let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  try {
    await db.prepare('CREATE TABLE IF NOT EXISTS seated_users (user_id TEXT, room_code TEXT NOT NULL DEFAULT "main", seat_code TEXT NOT NULL, user_data TEXT NOT NULL, last_seen INTEGER NOT NULL, PRIMARY KEY (user_id, room_code))').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS room_config (key TEXT, room_code TEXT NOT NULL DEFAULT "main", value TEXT NOT NULL, PRIMARY KEY (key, room_code))').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, room_code TEXT NOT NULL DEFAULT "main", data TEXT NOT NULL, created_at INTEGER NOT NULL)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS reactions (id TEXT PRIMARY KEY, room_code TEXT NOT NULL DEFAULT "main", data TEXT NOT NULL, created_at INTEGER NOT NULL)').run();
    schemaReady = true;
  } catch (e) {
    try { await db.prepare('ALTER TABLE seated_users ADD COLUMN room_code TEXT NOT NULL DEFAULT "main"').run(); } catch {}
    try { await db.prepare('ALTER TABLE room_config ADD COLUMN room_code TEXT NOT NULL DEFAULT "main"').run(); } catch {}
    try { await db.prepare('ALTER TABLE messages ADD COLUMN room_code TEXT NOT NULL DEFAULT "main"').run(); } catch {}
    try { await db.prepare('ALTER TABLE reactions ADD COLUMN room_code TEXT NOT NULL DEFAULT "main"').run(); } catch {}
    schemaReady = true;
  }
}

// ─── CORS helpers ─────────────────────────────────────────────────────────────
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors() }
  });
}

// ─── GET /api/room ─────────────────────────────────────────────────────────────
export async function onRequestGet(context) {
  const db = context.env.ROOM_DB;
  if (!db) {
    return json({ error: 'D1 binding ROOM_DB is not configured in Cloudflare Pages settings.' }, 503);
  }

  await ensureSchema(db);

  const url      = new URL(context.request.url);
  const uid      = url.searchParams.get('uid');
  const roomCode = (url.searchParams.get('code') || 'main').toLowerCase().trim();
  const now      = Date.now();
  const cutoff   = now - INACTIVE_MS;

  // Refresh last_seen for seated user in this specific room
  if (uid) {
    await db.prepare('UPDATE seated_users SET last_seen = ? WHERE user_id = ? AND room_code = ?')
      .bind(now, uid, roomCode).run();
  }

  // Fetch all room state in one batch filtered by roomCode
  const [usersRes, configRes, msgsRes, reactRes] = await db.batch([
    db.prepare('SELECT seat_code, user_data FROM seated_users WHERE last_seen > ? AND room_code = ?').bind(cutoff, roomCode),
    db.prepare('SELECT key, value FROM room_config WHERE room_code = ?').bind(roomCode),
    db.prepare('SELECT data FROM messages WHERE room_code = ? ORDER BY created_at ASC').bind(roomCode),
    db.prepare('SELECT data FROM reactions WHERE created_at > ? AND room_code = ?').bind(now - 3000, roomCode)
  ]);

  // Build { seatCode: userObject } map
  const seatedUsers = {};
  for (const row of (usersRes.results || [])) {
    try {
      const u = JSON.parse(row.user_data);
      if (u && u.id) seatedUsers[row.seat_code] = u;
    } catch {}
  }

  // Build flat config object
  const config = {};
  for (const row of (configRes.results || [])) {
    try { config[row.key] = JSON.parse(row.value); } catch { config[row.key] = row.value; }
  }

  const messages  = (msgsRes.results  || []).map(r => { try { return JSON.parse(r.data); } catch { return null; } }).filter(Boolean);
  const reactions = (reactRes.results || []).map(r => { try { return JSON.parse(r.data); } catch { return null; } }).filter(Boolean);

  return json({
    roomCode,
    seatedUsers,
    messages,
    reactions,
    activeMola:        config.activeMola        ?? null,
    moviePosters:      config.moviePosters      ?? null,
    buffetItems:       config.buffetItems       ?? null,
    broadcasterName:   config.broadcasterName   ?? '',
    broadcasterPeerId: config.broadcasterPeerId ?? '',
    streamUrl:         config.streamUrl         ?? '',
    userBadges:        config.userBadges        ?? null,
    hiddenBadges:      config.hiddenBadges      ?? null,
    userCredits:       config.userCredits       ?? null
  });
}

// ─── POST /api/room ───────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const db = context.env.ROOM_DB;
  if (!db) return json({ error: 'D1 binding ROOM_DB is not configured.' }, 503);

  await ensureSchema(db);

  let payload;
  try { payload = await context.request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const { action, data } = payload;
  const roomCode = (payload.roomCode || data?.roomCode || 'main').toLowerCase().trim();
  const now = Date.now();

  try {
    if (action === 'SEAT_OCCUPY') {
      const { seatCode, user } = data;
      if (!seatCode || !user || !user.id) return json({ error: 'Missing seatCode or user' }, 400);

      await db.batch([
        db.prepare('DELETE FROM seated_users WHERE user_id = ? AND room_code = ?').bind(user.id, roomCode),
        db.prepare('INSERT OR REPLACE INTO seated_users (user_id, room_code, seat_code, user_data, last_seen) VALUES (?, ?, ?, ?, ?)')
          .bind(user.id, roomCode, seatCode, JSON.stringify(user), now)
      ]);

    } else if (action === 'LEAVE_ROOM') {
      if (data && data.userId) {
        await db.prepare('DELETE FROM seated_users WHERE user_id = ? AND room_code = ?').bind(data.userId, roomCode).run();
      }

    } else if (action === 'SEND_CHAT') {
      if (!data || !data.id) return json({ error: 'Missing message id' }, 400);
      await db.prepare('INSERT OR REPLACE INTO messages (id, room_code, data, created_at) VALUES (?, ?, ?, ?)')
        .bind(data.id, roomCode, JSON.stringify(data), now).run();
      await db.prepare('DELETE FROM messages WHERE room_code = ? AND id NOT IN (SELECT id FROM messages WHERE room_code = ? ORDER BY created_at DESC LIMIT 100)').bind(roomCode, roomCode).run();

    } else if (action === 'DELETE_CHAT') {
      await db.prepare('DELETE FROM messages WHERE id = ? AND room_code = ?').bind(data.msgId, roomCode).run();

    } else if (action === 'SEND_REACTION') {
      if (!data || !data.id) return json({ error: 'Missing reaction id' }, 400);
      await db.prepare('INSERT OR REPLACE INTO reactions (id, room_code, data, created_at) VALUES (?, ?, ?, ?)')
        .bind(data.id, roomCode, JSON.stringify(data), now).run();
      await db.prepare('DELETE FROM reactions WHERE room_code = ? AND id NOT IN (SELECT id FROM reactions WHERE room_code = ? ORDER BY created_at DESC LIMIT 30)').bind(roomCode, roomCode).run();

    } else if (action === 'UPDATE_MOLA') {
      await db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)')
        .bind('activeMola', roomCode, JSON.stringify(data.activeMola)).run();

    } else if (action === 'UPDATE_POSTERS') {
      await db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)')
        .bind('moviePosters', roomCode, JSON.stringify(data.moviePosters)).run();

    } else if (action === 'UPDATE_BUFFET') {
      await db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)')
        .bind('buffetItems', roomCode, JSON.stringify(data.buffetItems)).run();

    } else if (action === 'SYNC_STATE') {
      const stmts = [];
      if (data.broadcasterName !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('broadcasterName', roomCode, JSON.stringify(data.broadcasterName)));
      if (data.broadcasterPeerId !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('broadcasterPeerId', roomCode, JSON.stringify(data.broadcasterPeerId)));
      if (data.streamUrl !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('streamUrl', roomCode, JSON.stringify(data.streamUrl)));
      if (data.userBadges !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('userBadges', roomCode, JSON.stringify(data.userBadges)));
      if (data.hiddenBadges !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('hiddenBadges', roomCode, JSON.stringify(data.hiddenBadges)));
      if (data.userCredits !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('userCredits', roomCode, JSON.stringify(data.userCredits)));
      if (data.activeMola !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('activeMola', roomCode, JSON.stringify(data.activeMola)));
      if (data.moviePosters !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('moviePosters', roomCode, JSON.stringify(data.moviePosters)));
      if (data.buffetItems !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, room_code, value) VALUES (?, ?, ?)').bind('buffetItems', roomCode, JSON.stringify(data.buffetItems)));
      if (stmts.length > 0) await db.batch(stmts);
    }

    return json({ success: true });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}

// ─── OPTIONS — CORS preflight ─────────────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, { headers: cors() });
}
