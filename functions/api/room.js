// Cloudflare Pages Function: /api/room
// Clean state with 0 dummy users and empty chat

let globalRoomState = {
  broadcaster: null,
  seatedUsers: {},
  messages: []
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
