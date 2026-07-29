// Cloudflare Pages Edge State Synchronizer: /api/room
// Uses Cloudflare KV for shared state across ALL edge instances
// This solves the "users can't see each other" problem caused by per-instance in-memory state

const KV_KEY = 'room_state';
const HEARTBEAT_TIMEOUT_MS = 8000; // 8 seconds

const DEFAULT_STATE = {
  broadcasterName: '',
  seatedUsers: {},
  messages: [],
  activeMola: null,
  moviePosters: null,
  buffetItems: null,
  reactions: [],
  heartbeats: {}
};

async function getState(env) {
  try {
    if (env && env.ROOM_KV) {
      const raw = await env.ROOM_KV.get(KV_KEY, { type: 'json' });
      return raw || { ...DEFAULT_STATE };
    }
  } catch (e) {}
  return { ...DEFAULT_STATE };
}

async function saveState(env, state) {
  try {
    if (env && env.ROOM_KV) {
      await env.ROOM_KV.put(KV_KEY, JSON.stringify(state));
    }
  } catch (e) {}
}

function cleanupInactiveUsers(state) {
  const now = Date.now();
  if (!state.heartbeats) state.heartbeats = {};
  if (!state.seatedUsers) state.seatedUsers = {};

  Object.entries(state.seatedUsers).forEach(([seatCode, user]) => {
    if (user && user.id) {
      const lastActive = state.heartbeats[user.id];
      if (!lastActive || (now - lastActive > HEARTBEAT_TIMEOUT_MS)) {
        delete state.seatedUsers[seatCode];
        delete state.heartbeats[user.id];
      }
    }
  });

  return state;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export async function onRequestGet(context) {
  let state = await getState(context.env);
  state = cleanupInactiveUsers(state);
  await saveState(context.env, state);

  return new Response(JSON.stringify(state), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...corsHeaders()
    }
  });
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { action, data } = payload;
    const now = Date.now();

    let state = await getState(context.env);
    if (!state.heartbeats) state.heartbeats = {};
    if (!state.seatedUsers) state.seatedUsers = {};
    if (!state.messages) state.messages = [];
    if (!state.reactions) state.reactions = [];

    if (action === 'HEARTBEAT') {
      if (data && data.userId) {
        state.heartbeats[data.userId] = now;
        // Also keep the seat occupied
        if (data.seatCode && data.user) {
          // Remove any stale seat for this user
          Object.keys(state.seatedUsers).forEach(code => {
            if (state.seatedUsers[code] && state.seatedUsers[code].id === data.userId && code !== data.seatCode) {
              delete state.seatedUsers[code];
            }
          });
          state.seatedUsers[data.seatCode] = data.user;
        }
      }
      state = cleanupInactiveUsers(state);

    } else if (action === 'LEAVE_ROOM') {
      if (data && data.userId) {
        Object.keys(state.seatedUsers).forEach(code => {
          if (state.seatedUsers[code] && state.seatedUsers[code].id === data.userId) {
            delete state.seatedUsers[code];
          }
        });
        delete state.heartbeats[data.userId];
      }

    } else if (action === 'SEAT_OCCUPY') {
      const { seatCode, user } = data;
      // Remove old seat for this user
      Object.keys(state.seatedUsers).forEach(code => {
        if (state.seatedUsers[code] && state.seatedUsers[code].id === user.id) {
          delete state.seatedUsers[code];
        }
      });
      state.seatedUsers[seatCode] = user;
      if (user && user.id) state.heartbeats[user.id] = now;

    } else if (action === 'SEND_CHAT') {
      state.messages.push(data);
      if (state.messages.length > 100) state.messages.shift();

    } else if (action === 'DELETE_CHAT') {
      state.messages = state.messages.filter(m => m.id !== data.msgId);

    } else if (action === 'SEND_REACTION') {
      state.reactions.push(data);
      if (state.reactions.length > 30) state.reactions.shift();

    } else if (action === 'UPDATE_MOLA') {
      state.activeMola = data.activeMola;

    } else if (action === 'UPDATE_POSTERS') {
      state.moviePosters = data.moviePosters;

    } else if (action === 'UPDATE_BUFFET') {
      state.buffetItems = data.buffetItems;

    } else if (action === 'SYNC_STATE') {
      if (data.seatedUsers !== undefined) state.seatedUsers = data.seatedUsers;
      if (data.messages !== undefined) state.messages = data.messages;
      if (data.activeMola !== undefined) state.activeMola = data.activeMola;
      if (data.moviePosters !== undefined) state.moviePosters = data.moviePosters;
      if (data.buffetItems !== undefined) state.buffetItems = data.buffetItems;
      if (data.broadcasterName !== undefined) state.broadcasterName = data.broadcasterName;
    }

    await saveState(context.env, state);

    return new Response(JSON.stringify({ success: true, state }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}
