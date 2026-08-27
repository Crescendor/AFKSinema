// Discord OAuth2 & Admin Authorization Helper + Embedded App SDK
import { DiscordSDK } from '@discord/embedded-app-sdk';

export const ADMIN_DISCORD_IDS = [
  '269639754675519489'
];

export const isAdminUser = (user) => {
  if (!user || !user.id) return false;
  return ADMIN_DISCORD_IDS.includes(user.id.toString());
};

export const DEFAULT_DISCORD_CLIENT_ID = '1410987724051320884';

export const getDiscordOAuthUrl = (clientId = DEFAULT_DISCORD_CLIENT_ID) => {
  const redirectUri = window.location.origin + '/sinema';
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
};

export const initiateDiscordLogin = () => {
  window.location.href = getDiscordOAuthUrl();
};

export const logoutDiscord = () => {
  localStorage.removeItem('afk_current_user');
};

export const checkDiscordAuthCallback = async () => {
  return null;
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

export const exchangeCodeForUser = async (code) => {
  try {
    const redirectUri = window.location.origin + '/sinema';

    const res = await fetch('/api/discord-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Discord API Edge Login Error:', errData);
      throw new Error(errData.error || 'Login failed');
    }

    const data = await res.json();
    if (data && data.success && data.user) {
      return data.user;
    }

    return null;
  } catch (err) {
    console.error('OAuth Code Exchange Error:', err);
    return null;
  }
};

export const fetchDiscordUserProfile = async (token) => {
  try {
    const res = await fetch('/api/discord-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token })
    });

    if (!res.ok) throw new Error('Discord profili alınamadı');

    const data = await res.json();
    if (data && data.success && data.user) {
      return data.user;
    }

    return null;
  } catch (err) {
    console.error('Discord API Hatası:', err);
    return null;
  }
};
