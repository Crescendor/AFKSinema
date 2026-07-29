// Discord OAuth2 & Admin Authorization Helper + Embedded App SDK
import { DiscordSDK } from '@discord/embedded-app-sdk';

export const ADMIN_DISCORD_IDS = [
  '102225960337670144',
  '269639754675519489'
];

export const isAdminUser = (user) => {
  if (!user || !user.id) return false;
  return ADMIN_DISCORD_IDS.includes(user.id.toString());
};

export const DEFAULT_DISCORD_CLIENT_ID = '1410987724051320884';

export const getDiscordOAuthUrl = (clientId = DEFAULT_DISCORD_CLIENT_ID) => {
  // Use registered /callback redirectUri for Discord OAuth App
  const redirectUri = window.location.origin + '/callback';
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
};

export let discordActivitySdk = null;

export const isDiscordActivityEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.has('frame_id') || (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0);
};

export const initDiscordActivitySdk = async () => {
  if (!isDiscordActivityEnvironment()) return null;

  try {
    discordActivitySdk = new DiscordSDK(DEFAULT_DISCORD_CLIENT_ID);
    await discordActivitySdk.ready();

    // Authorize within Discord Embedded App SDK
    const { code } = await discordActivitySdk.commands.authorize({
      client_id: DEFAULT_DISCORD_CLIENT_ID,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds']
    });

    const userProfile = await exchangeCodeForUser(code);
    if (userProfile) {
      userProfile.isDiscordActivity = true;
      userProfile.channelId = discordActivitySdk.channelId;
    }
    return userProfile;
  } catch (err) {
    console.warn('Discord Activity Embedded SDK auto-login error:', err);
    return null;
  }
};

// Exchange OAuth Code for Token via Cloudflare Edge API (/api/discord-token)
export const exchangeCodeForUser = async (code) => {
  try {
    const redirectUri = window.location.origin + '/callback';

    const tokenRes = await fetch('/api/discord-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri })
    });

    if (!tokenRes.ok) {
      // Fallback try with root / redirect uri if registered
      const fallbackUri = window.location.origin + '/';
      const fallbackRes = await fetch('/api/discord-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: fallbackUri })
      });
      if (!fallbackRes.ok) throw new Error('Token değişimi başarısız');
      const fallbackData = await fallbackRes.json();
      return await fetchDiscordUserProfile(fallbackData.access_token);
    }

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
