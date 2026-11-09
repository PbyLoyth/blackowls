export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const gerekli = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'OTURUM_ANAHTARI', 'YONETICI_IDLERI'].every((k) => env[k]);
  if (!gerekli || env.OTURUM_ANAHTARI.length < 32) return new Response(null, { status: 302, headers: { Location: '/yonetim?hata=yapilandirma', 'Cache-Control': 'no-store' } });
  const stateBytes = crypto.getRandomValues(new Uint8Array(32));
  const state = btoa(String.fromCharCode(...stateBytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const hedef = new URL('https://discord.com/oauth2/authorize');
  hedef.search = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, redirect_uri: `${url.origin}/api/auth/donus`, response_type: 'code', scope: 'identify', state, prompt: 'none' }).toString();
  return new Response(null, { status: 302, headers: { Location: hedef.toString(), 'Cache-Control': 'no-store', 'Set-Cookie': `__Host-bo_durum=${state}; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax` } });
}
