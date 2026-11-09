import { cerezleriOku } from './cerez.js';

const kodla = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const coz = (metin) => Uint8Array.from(atob(metin.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - metin.length % 4) % 4)), (c) => c.charCodeAt(0));
function esitse(a, b) {
  const x = new TextEncoder().encode(a); const y = new TextEncoder().encode(b);
  let fark = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) fark |= (x[i] || 0) ^ (y[i] || 0);
  return fark === 0;
}
async function anahtarAl(anahtar) {
  if (typeof anahtar !== 'string' || anahtar.length < 32) throw new Error('Oturum anahtarı en az 32 karakter olmalı.');
  return crypto.subtle.importKey('raw', new TextEncoder().encode(anahtar), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
export async function imzala(yuk, anahtar) {
  const veri = kodla(new TextEncoder().encode(JSON.stringify(yuk)));
  const imza = kodla(await crypto.subtle.sign('HMAC', await anahtarAl(anahtar), new TextEncoder().encode(veri)));
  return `${veri}.${imza}`;
}
export async function dogrula(deger, anahtar) {
  try {
    const [veri, imza, ...fazla] = deger.split('.');
    if (!veri || !imza || fazla.length) return null;
    const beklenen = kodla(await crypto.subtle.sign('HMAC', await anahtarAl(anahtar), new TextEncoder().encode(veri)));
    if (!esitse(imza, beklenen)) return null;
    return JSON.parse(new TextDecoder().decode(coz(veri)));
  } catch (hata) {
    if (hata.message?.includes('en az 32')) throw hata;
    return null;
  }
}
export async function oturumuOku(request, env) {
  if (!env.OTURUM_ANAHTARI || env.OTURUM_ANAHTARI.length < 32) throw new Error('Oturum anahtarı en az 32 karakter olmalı.');
  const imzali = cerezleriOku(request.headers.get('Cookie') || '')['__Host-bo_oturum'];
  if (!imzali) return null;
  const yuk = await dogrula(imzali, env.OTURUM_ANAHTARI);
  if (!yuk || typeof yuk.id !== 'string' || typeof yuk.ad !== 'string' || typeof yuk.son !== 'number' || yuk.son <= Math.floor(Date.now() / 1000)) return null;
  const idler = (env.YONETICI_IDLERI || '').split(',').map((id) => id.trim()).filter(Boolean);
  return idler.some((id) => esitse(id, yuk.id)) ? yuk : null;
}
