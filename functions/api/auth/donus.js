import { cerezleriOku, cerezYaz } from '../../_lib/cerez.js';
import { imzala } from '../../_lib/oturum.js';

// Yönlendirmeler göreli: istek başlıkları ne olursa olsun yalnız bu sitenin /yonetim sayfasına dönülür
const yonlendir = (url, hata) => new Response(null, { status: 302, headers: { Location: `/yonetim${hata ? `?hata=${hata}` : ''}`, 'Cache-Control': 'no-store' } });
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url); const p = url.searchParams;
  if (p.has('error')) return yonlendir(url, 'iptal');
  const gerekli = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'OTURUM_ANAHTARI', 'YONETICI_IDLERI'].every((k) => env[k]);
  if (!gerekli || env.OTURUM_ANAHTARI.length < 32) return yonlendir(url, 'yapilandirma');
  const cerez = cerezleriOku(request.headers.get('Cookie') || '');
  const state = p.get('state') || ''; const beklenen = cerez['__Host-bo_durum'] || '';
  const a = new TextEncoder().encode(state); const b = new TextEncoder().encode(beklenen); let fark = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) fark |= (a[i] || 0) ^ (b[i] || 0);
  if (!state || fark !== 0) return yonlendir(url, 'durum');
  try {
    const ortak = { signal: AbortSignal.timeout(8000) };
    const token = await fetch('https://discord.com/api/oauth2/token', { ...ortak, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code: p.get('code') || '', redirect_uri: `${url.origin}/api/auth/donus` }) });
    if (!token.ok) return yonlendir(url, 'discord');
    const tokenData = await token.json();
    const userResponse = await fetch('https://discord.com/api/users/@me', { ...ortak, headers: { Authorization: `Bearer ${tokenData.access_token}` } });
    if (!userResponse.ok) return yonlendir(url, 'discord');
    const user = await userResponse.json(); const idler = env.YONETICI_IDLERI.split(',').map((x) => x.trim());
    if (!idler.includes(user.id)) return yonlendir(url, 'izin');
    const oturum = await imzala({ id: user.id, ad: user.global_name || user.username, son: Math.floor(Date.now() / 1000) + 28800 }, env.OTURUM_ANAHTARI);
    const headers = new Headers({ Location: '/yonetim', 'Cache-Control': 'no-store' });
    headers.append('Set-Cookie', cerezYaz('__Host-bo_oturum', oturum, { maxAge: 28800 }));
    headers.append('Set-Cookie', cerezYaz('__Host-bo_durum', '', { maxAge: 0 }));
    return new Response(null, { status: 302, headers });
  } catch { return yonlendir(url, 'discord'); }
}
