// Cloudflare Pages Edge State Synchronizer: /api/room
// Uses Cloudflare D1 (SQLite) for fully shared, consistent state across all edge instances.
//
// Presence model:
//   - Users enter the DB ONLY via SEAT_OCCUPY (POST) with full user_data.
//   - GET with ?uid= only refreshes last_seen for already-seated users (UPDATE, not INSERT).
//   - Users missing from the DB (no seat chosen) simply don't appear in the auditorium.
//   - After 12s of no GET polls, the user is treated as gone and filtered out.

const INACTIVE_MS = 12000;

// ─── Schema Init (idempotent) ─────────────────────────────────────────────────
let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  try {
    await db.prepare('CREATE TABLE IF NOT EXISTS seated_users (user_id TEXT PRIMARY KEY, seat_code TEXT NOT NULL, user_data TEXT NOT NULL, last_seen INTEGER NOT NULL)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS room_config (key TEXT PRIMARY KEY, value TEXT NOT NULL)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at INTEGER NOT NULL)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS reactions (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at INTEGER NOT NULL)').run();
    schemaReady = true;
  } catch (e) {
    // Tables likely already exist — safe to ignore
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
// Also refreshes presence for the polling user if they are already seated.
export async function onRequestGet(context) {
  const db = context.env.ROOM_DB;
  if (!db) {
    return json({ error: 'D1 binding ROOM_DB is not configured in Cloudflare Pages settings.' }, 503);
  }

  await ensureSchema(db);

  const url    = new URL(context.request.url);
  const uid    = url.searchParams.get('uid');
  const now    = Date.now();
  const cutoff = now - INACTIVE_MS;

  // Only UPDATE last_seen — never INSERT here. Full user_data comes from SEAT_OCCUPY.
  if (uid) {
    await db.prepare('UPDATE seated_users SET last_seen = ? WHERE user_id = ?')
      .bind(now, uid).run();
  }

  // Fetch all room state in one batch (single D1 round-trip)
  const [usersRes, configRes, msgsRes, reactRes] = await db.batch([
    db.prepare('SELECT seat_code, user_data FROM seated_users WHERE last_seen > ?').bind(cutoff),
    db.prepare('SELECT key, value FROM room_config'),
    db.prepare('SELECT data FROM messages ORDER BY created_at ASC'),
    db.prepare('SELECT data FROM reactions WHERE created_at > ?').bind(now - 3000)
  ]);

  // Build { seatCode: userObject } map — skip rows with empty/invalid user_data
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
    seatedUsers,
    messages,
    reactions,
    activeMola:      config.activeMola      ?? null,
    moviePosters:    config.moviePosters    ?? null,
    buffetItems:     config.buffetItems     ?? null,
    broadcasterName:   config.broadcasterName   ?? '',
    broadcasterPeerId: config.broadcasterPeerId ?? '',
    streamUrl:         config.streamUrl         ?? '',
    userBadges:        config.userBadges        ?? null
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
  const now = Date.now();

  try {
    if (action === 'SEAT_OCCUPY') {
      // User chose a seat — store full user object with complete data
      const { seatCode, user } = data;
      if (!seatCode || !user || !user.id) return json({ error: 'Missing seatCode or user' }, 400);

      await db.batch([
        // Remove any previous seat this user held
        db.prepare('DELETE FROM seated_users WHERE user_id = ?').bind(user.id),
        // Insert with full user_data (avatar, username, id, etc.)
        db.prepare('INSERT INTO seated_users (user_id, seat_code, user_data, last_seen) VALUES (?, ?, ?, ?)')
          .bind(user.id, seatCode, JSON.stringify(user), now)
      ]);

    } else if (action === 'LEAVE_ROOM') {
      if (data && data.userId) {
        await db.prepare('DELETE FROM seated_users WHERE user_id = ?').bind(data.userId).run();
      }

    } else if (action === 'SEND_CHAT') {
      if (!data || !data.id) return json({ error: 'Missing message id' }, 400);
      await db.prepare('INSERT OR REPLACE INTO messages (id, data, created_at) VALUES (?, ?, ?)')
        .bind(data.id, JSON.stringify(data), now).run();
      // Trim to last 100 messages
      await db.prepare('DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY created_at DESC LIMIT 100)').run();

    } else if (action === 'DELETE_CHAT') {
      await db.prepare('DELETE FROM messages WHERE id = ?').bind(data.msgId).run();

    } else if (action === 'SEND_REACTION') {
      if (!data || !data.id) return json({ error: 'Missing reaction id' }, 400);
      await db.prepare('INSERT OR REPLACE INTO reactions (id, data, created_at) VALUES (?, ?, ?)')
        .bind(data.id, JSON.stringify(data), now).run();
      // Trim to last 30 reactions
      await db.prepare('DELETE FROM reactions WHERE id NOT IN (SELECT id FROM reactions ORDER BY created_at DESC LIMIT 30)').run();

    } else if (action === 'UPDATE_MOLA') {
      await db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)')
        .bind('activeMola', JSON.stringify(data.activeMola)).run();

    } else if (action === 'UPDATE_POSTERS') {
      await db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)')
        .bind('moviePosters', JSON.stringify(data.moviePosters)).run();

    } else if (action === 'UPDATE_BUFFET') {
      await db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)')
        .bind('buffetItems', JSON.stringify(data.buffetItems)).run();

    } else if (action === 'SYNC_STATE') {
      const stmts = [];
      if (data.broadcasterName !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('broadcasterName', JSON.stringify(data.broadcasterName)));
      if (data.broadcasterPeerId !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('broadcasterPeerId', JSON.stringify(data.broadcasterPeerId)));
      if (data.streamUrl !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('streamUrl', JSON.stringify(data.streamUrl)));
      if (data.userBadges !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('userBadges', JSON.stringify(data.userBadges)));
      if (data.activeMola !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('activeMola', JSON.stringify(data.activeMola)));
      if (data.moviePosters !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('moviePosters', JSON.stringify(data.moviePosters)));
      if (data.buffetItems !== undefined)
        stmts.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('buffetItems', JSON.stringify(data.buffetItems)));
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
