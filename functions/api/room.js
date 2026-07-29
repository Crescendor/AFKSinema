// Cloudflare Pages Edge State Synchronizer: /api/room

let roomState = {
  broadcasterName: '',
  seatedUsers: {},
  messages: [],
  activeMola: null,
  moviePosters: null,
  buffetItems: null,
  userSnacks: {},
  vipUsers: {},
  reactions: [],
  heartbeats: {} // userId -> lastActiveTimestamp
};

// Remove users who closed the tab or haven't sent a heartbeat for 8 seconds
function cleanupInactiveUsers() {
  const now = Date.now();
  const activeThreshold = 8000; // 8 seconds timeout

  Object.entries(roomState.seatedUsers).forEach(([seatCode, user]) => {
    if (user && user.id) {
      const lastActive = roomState.heartbeats[user.id];
      if (!lastActive || (now - lastActive > activeThreshold)) {
        delete roomState.seatedUsers[seatCode];
        delete roomState.heartbeats[user.id];
      }
    }
  });
}

export async function onRequestGet(context) {
  cleanupInactiveUsers();

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
    let payload;
    const contentType = context.request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await context.request.json();
    } else {
      const text = await context.request.text();
      payload = JSON.parse(text);
    }

    const { action, data } = payload;
    const now = Date.now();

    if (action === 'HEARTBEAT') {
      if (data && data.userId) {
        roomState.heartbeats[data.userId] = now;
        if (data.seatCode && data.user) {
          roomState.seatedUsers[data.seatCode] = data.user;
        }
      }
      cleanupInactiveUsers();
    } else if (action === 'LEAVE_ROOM') {
      if (data && data.userId) {
        Object.keys(roomState.seatedUsers).forEach(code => {
          if (roomState.seatedUsers[code].id === data.userId) {
            delete roomState.seatedUsers[code];
          }
        });
        delete roomState.heartbeats[data.userId];
      }
    } else if (action === 'SYNC_STATE') {
      if (data.seatedUsers !== undefined) roomState.seatedUsers = data.seatedUsers;
      if (data.messages !== undefined) roomState.messages = data.messages;
      if (data.activeMola !== undefined) roomState.activeMola = data.activeMola;
      if (data.moviePosters !== undefined) roomState.moviePosters = data.moviePosters;
      if (data.buffetItems !== undefined) roomState.buffetItems = data.buffetItems;
      if (data.userSnacks !== undefined) roomState.userSnacks = data.userSnacks;
      if (data.vipUsers !== undefined) roomState.vipUsers = data.vipUsers;
      if (data.broadcasterName !== undefined) roomState.broadcasterName = data.broadcasterName;
    } else if (action === 'SEAT_OCCUPY') {
      const { seatCode, user } = data;
      Object.keys(roomState.seatedUsers).forEach(code => {
        if (roomState.seatedUsers[code].id === user.id) {
          delete roomState.seatedUsers[code];
        }
      });
      roomState.seatedUsers[seatCode] = user;
      if (user && user.id) {
        roomState.heartbeats[user.id] = now;
      }
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
    } else if (action === 'SEND_REACTION') {
      if (!Array.isArray(roomState.reactions)) roomState.reactions = [];
      roomState.reactions.push(data);
      if (roomState.reactions.length > 30) {
        roomState.reactions.shift();
      }
    } else if (action === 'UPDATE_MOLA') {
      roomState.activeMola = data.activeMola;
    } else if (action === 'UPDATE_POSTERS') {
      roomState.moviePosters = data.moviePosters;
    } else if (action === 'UPDATE_BUFFET') {
      roomState.buffetItems = data.buffetItems;
    }

    cleanupInactiveUsers();

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
