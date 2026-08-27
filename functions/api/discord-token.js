// Cloudflare Pages Function: /api/discord-token
// Handles Discord OAuth Code -> Access Token exchange using Client Secret

const CLIENT_ID = '1410987724051320884';
const CLIENT_SECRET = 'V3Fi2shMcr99_SQmLP3E_dQ8JqQl07Z1';

export async function onRequestPost(context) {
  try {
    const { code, redirectUri } = await context.request.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), { status: 400 });
    }

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    });

    const response = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
