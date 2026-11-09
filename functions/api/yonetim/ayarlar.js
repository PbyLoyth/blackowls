import varsayilan from '../../_lib/varsayilan.js';
import { birlestir, degisenAlanlar } from '../../_lib/ayarlar.js';
import { ayarlariDogrula } from '../../_lib/dogrula.js';
import { oturumuOku } from '../../_lib/oturum.js';
import { ayniKoken, hata, json } from '../../_lib/yanit.js';

async function yetkili(request, env) {
  try { return await oturumuOku(request, env); } catch { return null; }
}
export async function onRequestGet({ request, env }) {
  const kullanici = await yetkili(request, env);
  if (!kullanici) return hata('Oturum açmanız gerekiyor.', 401);
  if (!env.AYARLAR) return hata('Ayar deposu kullanılamıyor.', 503);
  try {
    const kayitli = await env.AYARLAR.get('ayarlar', { type: 'json' });
    const [son, gecmis] = await Promise.all([env.AYARLAR.get('ayarlar:son', { type: 'json' }), env.AYARLAR.get('ayarlar:gecmis', { type: 'json' })]);
    return json({ ayarlar: birlestir(varsayilan, kayitli || varsayilan), varsayilan, kullanici: { id: kullanici.id, ad: kullanici.ad }, son, gecmis: gecmis || [] });
  } catch { return hata('Ayarlar okunamadı.', 503); }
}
export async function onRequestPut({ request, env }) {
  const kullanici = await yetkili(request, env);
  if (!kullanici) return hata('Oturum açmanız gerekiyor.', 401);
  if (!ayniKoken(request)) return hata('İstek aynı kökenden gelmeli.', 403);
  if (!request.headers.get('Content-Type')?.toLowerCase().split(';')[0].trim().startsWith('application/json')) return hata('JSON içerik türü gerekli.', 415);
  if (!env.AYARLAR) return hata('Ayar deposu kullanılamıyor.', 503);
  if (Number(request.headers.get('Content-Length') || 0) > 16384) return hata('İstek gövdesi çok büyük.', 413);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > 16384) return hata('İstek gövdesi çok büyük.', 413);
  let girdi;
  try { girdi = JSON.parse(new TextDecoder().decode(bytes)); } catch { return hata('JSON okunamadı.', 400); }
  const dogrulama = ayarlariDogrula(girdi, varsayilan);
  if (!dogrulama.tamam) return hata('Ayarlar geçersiz.', 422, { alanlar: dogrulama.alanlar });
  try {
    const eskiKayit = await env.AYARLAR.get('ayarlar', { type: 'json' });
    const eski = birlestir(varsayilan, eskiKayit || varsayilan);
    const alanlar = degisenAlanlar(eski, dogrulama.ayarlar);
    const zaman = new Date().toISOString(); const kayit = { id: kullanici.id, ad: kullanici.ad, zaman };
    const eskiGecmis = await env.AYARLAR.get('ayarlar:gecmis', { type: 'json' }) || [];
    const gecmis = [{ ...kayit, alanlar }, ...eskiGecmis].slice(0, 20);
    await Promise.all([
      env.AYARLAR.put('ayarlar', JSON.stringify(dogrulama.ayarlar)),
      env.AYARLAR.put('ayarlar:son', JSON.stringify(kayit)),
      env.AYARLAR.put('ayarlar:gecmis', JSON.stringify(gecmis))
    ]);
    return json({ ayarlar: dogrulama.ayarlar, son: kayit, gecmis });
  } catch { return hata('Ayarlar kaydedilemedi.', 503); }
}
