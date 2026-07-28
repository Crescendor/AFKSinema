// Cloudflare Pages Edge State Synchronizer: /api/room

let globalRoomState = {
  broadcasterName: '',
  seatedUsers: {},
  messages: [],
  activeMola: null,
  moviePosters: [],
  userSnacks: {},
  vipUsers: {},
  buffetItems: []
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

    if (action === 'SYNC_ALL') {
      if (data.seatedUsers) globalRoomState.seatedUsers = data.seatedUsers;
      if (data.messages) globalRoomState.messages = data.messages;
      if (data.activeMola !== undefined) globalRoomState.activeMola = data.activeMola;
      if (data.moviePosters) globalRoomState.moviePosters = data.moviePosters;
      if (data.userSnacks) globalRoomState.userSnacks = data.userSnacks;
      if (data.vipUsers) globalRoomState.vipUsers = data.vipUsers;
      if (data.broadcasterName !== undefined) globalRoomState.broadcasterName = data.broadcasterName;
    } else if (action === 'SEAT_OCCUPY') {
      const { seatCode, user } = data;
      Object.keys(globalRoomState.seatedUsers).forEach(code => {
        if (globalRoomState.seatedUsers[code].id === user.id) {
          delete globalRoomState.seatedUsers[code];
        }
      });
      globalRoomState.seatedUsers[seatCode] = user;
    } else if (action === 'SEND_CHAT') {
      globalRoomState.messages.push(data);
      if (globalRoomState.messages.length > 80) {
        globalRoomState.messages.shift();
      }
    } else if (action === 'DELETE_CHAT') {
      globalRoomState.messages = globalRoomState.messages.filter(m => m.id !== data.msgId);
    } else if (action === 'UPDATE_BROADCAST') {
      globalRoomState.broadcasterName = data.broadcasterName;
    } else if (action === 'UPDATE_MOLA') {
      globalRoomState.activeMola = data.activeMola;
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
