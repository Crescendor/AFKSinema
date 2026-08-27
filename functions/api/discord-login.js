// Cloudflare Pages Function: /api/discord-login
// Server-side OAuth2 code exchange + profile fetch to bypass CORS and handle errors cleanly

const CLIENT_ID = '1410987724051320884';
const CLIENT_SECRET = 'V3Fi2shMcr99_SQmLP3E_dQ8JqQl07Z1';
const ADMIN_DISCORD_IDS = ['269639754675519489'];

export async function onRequestPost(context) {
  try {
    const { code, redirectUri, accessToken } = await context.request.json();

    let token = accessToken;

    // 1. If authorization code is provided, exchange it for access token
    if (!token && code) {
      const urisToTry = [
        redirectUri,
        'https://afksinema.pages.dev/callback',
        'https://afksinema.pages.dev/',
        'http://localhost:5173/callback',
        'http://localhost:5173/'
      ].filter(Boolean);

      let lastError = null;

      for (const uri of urisToTry) {
        const params = new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: uri
        });

        const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });

        const tokenData = await tokenRes.json();
        if (tokenRes.ok && tokenData.access_token) {
          token = tokenData.access_token;
          break;
        } else {
          lastError = tokenData;
        }
      }

      if (!token) {
        return new Response(JSON.stringify({
          error: 'Token exchange failed',
          details: lastError
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'No code or access_token provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Fetch Discord User Profile (@me)
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!userRes.ok) {
      const errData = await userRes.json();
      return new Response(JSON.stringify({ error: 'Failed to fetch Discord profile', details: errData }), {
        status: userRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userData = await userRes.json();

    const avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${userData.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || '0') % 5}.png`;

    const isAdmin = ADMIN_DISCORD_IDS.includes(userData.id.toString());

    const userProfile = {
      id: userData.id,
      username: userData.global_name || userData.username,
      discriminator: userData.discriminator || '0',
      avatar: avatarUrl,
      role: isAdmin ? 'VIP Admin Streamer' : 'Sinema İzleyicisi',
      badge: isAdmin ? '👑 Admin' : '🎬 İzleyici',
      isAdmin
    };

    return new Response(JSON.stringify({ success: true, user: userProfile }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
