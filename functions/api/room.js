// Cloudflare Pages Edge State Synchronizer: /api/room

let roomState = {
  broadcasterName: '',
  seatedUsers: {},
  messages: [],
  activeMola: null,
  moviePosters: null, // null means uninitialized, [] means cleared
  userSnacks: {},
  vipUsers: {},
  buffetItems: []
};

export async function onRequestGet(context) {
  return new Response(JSON.stringify(roomState), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { action, data } = payload;

    if (action === 'SYNC_STATE') {
      if (data.seatedUsers !== undefined) roomState.seatedUsers = data.seatedUsers;
      if (data.messages !== undefined) roomState.messages = data.messages;
      if (data.activeMola !== undefined) roomState.activeMola = data.activeMola;
      if (data.moviePosters !== undefined) roomState.moviePosters = data.moviePosters;
      if (data.userSnacks !== undefined) roomState.userSnacks = data.userSnacks;
      if (data.vipUsers !== undefined) roomState.vipUsers = data.vipUsers;
      if (data.broadcasterName !== undefined) roomState.broadcasterName = data.broadcasterName;
    } else if (action === 'SEAT_OCCUPY') {
      const { seatCode, user } = data;
      // Remove user from any existing seat
      Object.keys(roomState.seatedUsers).forEach(code => {
        if (roomState.seatedUsers[code].id === user.id) {
          delete roomState.seatedUsers[code];
        }
      });
      roomState.seatedUsers[seatCode] = user;
    } else if (action === 'SEND_CHAT') {
      if (!Array.isArray(roomState.messages)) roomState.messages = [];
      roomState.messages.push(data);
      if (roomState.messages.length > 100) {
        roomState.messages.shift();
      }
    } else if (action === 'DELETE_CHAT') {
      if (Array.isArray(roomState.messages)) {
        roomState.messages = roomState.messages.filter(m => m.id !== data.msgId);
      }
    } else if (action === 'UPDATE_MOLA') {
      roomState.activeMola = data.activeMola;
    } else if (action === 'UPDATE_POSTERS') {
      roomState.moviePosters = data.moviePosters;
    }

    return new Response(JSON.stringify({ success: true, state: roomState }), {
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
