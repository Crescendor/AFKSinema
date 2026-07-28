// Cloudflare Pages Function: /api/room
// Handles real-time cinema room state & discord seat synchronization on Cloudflare Edge

// In-memory global state on Worker instance
let globalRoomState = {
  broadcaster: null,
  seatedUsers: {
    'A4': {
      id: 'user_1',
      username: 'Burak',
      discriminator: '1337',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      role: 'VIP Cinema Host',
      badge: '👑 Admin'
    },
    'B5': {
      id: 'user_3',
      username: 'MovieBuff_Eda',
      discriminator: '2026',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      role: 'Sinemasever',
      badge: '🍿 Mısır Canavarı'
    }
  },
  messages: [
    { id: 'msg_1', type: 'system', text: 'Cloudflare Workers & Pages üzerinde AFKSinema Odası Canlı!' }
  ]
};

export async function onRequestGet(context) {
  return new Response(JSON.stringify(globalRoomState), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  });
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { action, data } = payload;

    if (action === 'SEAT_OCCUPY') {
      const { seatCode, user } = data;
      // remove user from previous seat
      Object.keys(globalRoomState.seatedUsers).forEach(code => {
        if (globalRoomState.seatedUsers[code].id === user.id) {
          delete globalRoomState.seatedUsers[code];
        }
      });
      globalRoomState.seatedUsers[seatCode] = user;
    } else if (action === 'SEND_CHAT') {
      globalRoomState.messages.push(data);
      if (globalRoomState.messages.length > 50) {
        globalRoomState.messages.shift();
      }
    } else if (action === 'UPDATE_BROADCAST') {
      globalRoomState.broadcaster = data;
    }

    return new Response(JSON.stringify({ success: true, state: globalRoomState }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
