// Discord OAuth2 & Admin Authorization Helper

export const ADMIN_DISCORD_IDS = [
  '102225960337670144',
  '269639754675519489'
];

export const isAdminUser = (user) => {
  if (!user || !user.id) return false;
  return ADMIN_DISCORD_IDS.includes(user.id.toString());
};

// User's Official Discord Application Credentials
export const DEFAULT_DISCORD_CLIENT_ID = '1410987724051320884';

export const getDiscordOAuthUrl = (clientId = DEFAULT_DISCORD_CLIENT_ID) => {
  let redirectUri = window.location.origin + window.location.pathname;
  if (!redirectUri.endsWith('/')) {
    redirectUri += '/';
  }
  // Standard Discord Authorization Code Grant (response_type=code)
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
};

// Exchange OAuth Code for Token via Cloudflare Edge API (/api/discord-token)
export const exchangeCodeForUser = async (code) => {
  try {
    let redirectUri = window.location.origin + window.location.pathname;
    if (!redirectUri.endsWith('/')) redirectUri += '/';

    const tokenRes = await fetch('/api/discord-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri })
    });

    if (!tokenRes.ok) throw new Error('Token değişimi başarısız');

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Access token alınamadı');

    return await fetchDiscordUserProfile(tokenData.access_token);
  } catch (err) {
    console.error('OAuth Code Exchange Error:', err);
    return null;
  }
};

// Fetch real Discord profile using OAuth Bearer Token
export const fetchDiscordUserProfile = async (token) => {
  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Discord profili alınamadı');

    const data = await res.json();
    const avatarUrl = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(data.discriminator || '0') % 5}.png`;

    const isAdmin = ADMIN_DISCORD_IDS.includes(data.id.toString());

    return {
      id: data.id,
      username: data.global_name || data.username,
      discriminator: data.discriminator || '0',
      avatar: avatarUrl,
      role: isAdmin ? 'VIP Admin Streamer' : 'Sinema İzleyicisi',
      badge: isAdmin ? '👑 Admin' : '🎬 İzleyici',
      isAdmin
    };
  } catch (err) {
    console.error('Discord API Hatası:', err);
    return null;
  }
};
