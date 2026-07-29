// Cloudflare Pages Edge State Synchronizer: /api/room
// Uses Cloudflare D1 (SQLite) — shared, consistent state across ALL edge instances
//
// D1 Write Optimization:
//   - Heartbeat is piggy-backed onto the GET poll via query params (uid + seat)
//     so no extra write calls are needed from the client for presence tracking.
//   - All other writes are targeted single-row operations.
//
// D1 Free Tier Budget (10 active users, 4h session):
//   Reads:  10 users × 2s poll × ~5 rows = ~360k rows/day  (limit: 5M ✓)
//   Writes: 10 users × 2s poll = ~72k rows/day              (limit: 100k ✓)

const INACTIVE_MS = 12000; // 12s — user considered gone if no poll seen

// ─── Schema Initialization ───────────────────────────────────────────────────
async function ensureSchema(db) {
  // Run once per cold-start; D1 deduplicates "IF NOT EXISTS" cheaply.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS seated_users (
      user_id   TEXT PRIMARY KEY,
      seat_code TEXT NOT NULL,
      user_data TEXT NOT NULL,
      last_seen INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS room_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id         TEXT PRIMARY KEY,
      data       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reactions (
      id         TEXT PRIMARY KEY,
      data       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── GET /api/room — also acts as presence heartbeat ────────────────────────
export async function onRequestGet(context) {
  const db = context.env.ROOM_DB;
  if (!db) return json({ error: 'D1 not bound. Set ROOM_DB binding in Cloudflare dashboard.' }, 503);

  await ensureSchema(db);

  const url = new URL(context.request.url);
  const uid  = url.searchParams.get('uid');
  const seat = url.searchParams.get('seat');
  const now  = Date.now();
  const cutoff = now - INACTIVE_MS;

  // Piggy-back: update last_seen for the calling user (0 extra client write)
  if (uid && seat) {
    // Upsert presence: keep user alive and on correct seat
    await db.prepare(`
      INSERT INTO seated_users (user_id, seat_code, user_data, last_seen)
      VALUES (?, ?, COALESCE((SELECT user_data FROM seated_users WHERE user_id = ?), '{}'), ?)
      ON CONFLICT(user_id) DO UPDATE SET seat_code = excluded.seat_code, last_seen = excluded.last_seen
    `).bind(uid, seat, uid, now).run();
  }

  // Batch fetch everything in one round-trip
  const [usersRes, configRes, msgsRes, reactRes] = await db.batch([
    db.prepare('SELECT user_id, seat_code, user_data FROM seated_users WHERE last_seen > ?').bind(cutoff),
    db.prepare('SELECT key, value FROM room_config'),
    db.prepare('SELECT data FROM messages ORDER BY created_at ASC'),
    db.prepare('SELECT data FROM reactions WHERE created_at > ?').bind(now - 3000)
  ]);

  // Shape seated users into { seatCode: userObj }
  const seatedUsers = {};
  for (const row of (usersRes.results || [])) {
    try {
      seatedUsers[row.seat_code] = JSON.parse(row.user_data);
    } catch {}
  }

  // Shape config into flat object
  const config = {};
  for (const row of (configRes.results || [])) {
    try {
      config[row.key] = JSON.parse(row.value);
    } catch { config[row.key] = row.value; }
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
    broadcasterName: config.broadcasterName ?? ''
  });
}

// ─── POST /api/room — all mutations ──────────────────────────────────────────
export async function onRequestPost(context) {
  const db = context.env.ROOM_DB;
  if (!db) return json({ error: 'D1 not bound.' }, 503);

  await ensureSchema(db);

  let payload;
  try { payload = await context.request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { action, data } = payload;
  const now = Date.now();

  try {
    if (action === 'SEAT_OCCUPY') {
      // Remove all old seats for this user, then insert new one
      const { seatCode, user } = data;
      await db.batch([
        db.prepare('DELETE FROM seated_users WHERE user_id = ?').bind(user.id),
        db.prepare('INSERT INTO seated_users (user_id, seat_code, user_data, last_seen) VALUES (?, ?, ?, ?)')
          .bind(user.id, seatCode, JSON.stringify(user), now)
      ]);

    } else if (action === 'LEAVE_ROOM') {
      await db.prepare('DELETE FROM seated_users WHERE user_id = ?').bind(data.userId).run();

    } else if (action === 'SEND_CHAT') {
      await db.prepare('INSERT OR REPLACE INTO messages (id, data, created_at) VALUES (?, ?, ?)')
        .bind(data.id, JSON.stringify(data), now).run();
      // Keep only last 100 messages
      await db.prepare(`
        DELETE FROM messages WHERE id NOT IN (
          SELECT id FROM messages ORDER BY created_at DESC LIMIT 100
        )
      `).run();

    } else if (action === 'DELETE_CHAT') {
      await db.prepare('DELETE FROM messages WHERE id = ?').bind(data.msgId).run();

    } else if (action === 'SEND_REACTION') {
      await db.prepare('INSERT OR REPLACE INTO reactions (id, data, created_at) VALUES (?, ?, ?)')
        .bind(data.id, JSON.stringify(data), now).run();
      // Keep only last 30 reactions
      await db.prepare(`
        DELETE FROM reactions WHERE id NOT IN (
          SELECT id FROM reactions ORDER BY created_at DESC LIMIT 30
        )
      `).run();

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
      const updates = [];
      if (data.broadcasterName !== undefined)
        updates.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('broadcasterName', JSON.stringify(data.broadcasterName)));
      if (data.activeMola !== undefined)
        updates.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('activeMola', JSON.stringify(data.activeMola)));
      if (data.moviePosters !== undefined)
        updates.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('moviePosters', JSON.stringify(data.moviePosters)));
      if (data.buffetItems !== undefined)
        updates.push(db.prepare('INSERT OR REPLACE INTO room_config (key, value) VALUES (?, ?)').bind('buffetItems', JSON.stringify(data.buffetItems)));
      if (updates.length > 0) await db.batch(updates);
    }

    return json({ success: true });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}

// ─── OPTIONS — CORS preflight ────────────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, { headers: cors() });
}
