// Cloudflare Pages Function: /callback redirect handler to /sinema

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');

  if (code) {
    return Response.redirect(`${url.origin}/sinema?code=${code}`, 302);
  }

  return Response.redirect(`${url.origin}/sinema`, 302);
}
