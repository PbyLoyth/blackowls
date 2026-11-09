import varsayilan from './_lib/varsayilan.js';
import { birlestir, deger } from './_lib/ayarlar.js';
import { guvenliBaglanti } from './_lib/baglanti.js';
import { API_CSP, cspOlustur, guvenlikBasliklari, nonceUret } from './_lib/guvenlik.js';

const YONETIM = new Set(['/yonetim', '/yonetim/', '/yonetim.html']);

// Sayfalar KV ayarlarıyla yeniden yazıldığı için tarayıcı eski kopyayı 304 ile geri getirmemeli
function kosulsuzIstek(request) {
  const yol = new URL(request.url).pathname;
  const sayfa = !/\.[a-z0-9]+$/i.test(yol) || yol.endsWith('.html');
  if (!sayfa || (!request.headers.has('If-None-Match') && !request.headers.has('If-Modified-Since'))) return null;
  const basliklar = new Headers(request.headers);
  basliklar.delete('If-None-Match');
  basliklar.delete('If-Modified-Since');
  return new Request(request, { headers: basliklar });
}

function yeniden(rewriter, ayarlar, nonce) {
  return rewriter
    .on('script', { element(el) { el.setAttribute('nonce', nonce); } })
    .on('[data-ayar]', { element(el) { const v = deger(ayarlar, el.getAttribute('data-ayar')); if (v !== undefined) el.setInnerContent(String(v), { html: false }); } })
    .on('[data-ayar-ozellik]', { element(el) {
      for (const parca of (el.getAttribute('data-ayar-ozellik') || '').split(';')) {
        const i = parca.indexOf(':'); if (i < 1) continue;
        const ad = parca.slice(0, i).trim(); const v = deger(ayarlar, parca.slice(i + 1).trim());
        if (!/^(href|title|aria-label|data-[a-z0-9_-]+)$/u.test(ad) || v === undefined) continue;
        if (ad === 'href' && (!v || !guvenliBaglanti(String(v)))) continue;
        el.setAttribute(ad, String(v));
      }
    } })
    .on('[data-ayar-goster]', { element(el) { if (deger(ayarlar, el.getAttribute('data-ayar-goster'))) el.removeAttribute('hidden'); else el.remove(); } })
    .on('[data-ayar-gizle]', { element(el) { if (deger(ayarlar, el.getAttribute('data-ayar-gizle'))) el.remove(); else el.removeAttribute('hidden'); } })
    .on('[data-ayar-durum]', { element(el) { el.setAttribute('data-durum', deger(ayarlar, el.getAttribute('data-ayar-durum')) ? 'acik' : 'kapali'); } });
}

export async function onRequest(context) {
  const { request, env } = context;
  const kosulsuz = kosulsuzIstek(request);
  const response = kosulsuz ? await context.next(kosulsuz) : await context.next();
  const url = new URL(request.url);
  const basliklar = guvenlikBasliklari(new Headers(response.headers));
  const yanit = (govde) => new Response(govde, { status: response.status, statusText: response.statusText, headers: basliklar });
  const html = response.headers.get('Content-Type')?.toLowerCase().includes('text/html');
  const yonetim = YONETIM.has(url.pathname);

  if (url.pathname.startsWith('/api/')) {
    basliklar.set('Content-Security-Policy', API_CSP);
    return yanit(response.body);
  }
  if (!html || request.method !== 'GET') return yanit(response.body);

  // İçerik ayarlara göre değiştiği için durağan dosyanın doğrulayıcıları geçersiz
  basliklar.delete('ETag');
  basliklar.delete('Last-Modified');
  basliklar.delete('Content-Length');
  basliklar.set('Cache-Control', yonetim ? 'no-store' : 'public, max-age=0, must-revalidate');
  if (yonetim) basliklar.set('X-Robots-Tag', 'noindex, nofollow');

  const nonce = nonceUret();
  basliklar.set('Content-Security-Policy', cspOlustur(nonce, { yonetim }));

  // KV yoksa ya da okunamazsa varsayılanlar uygulanır; kapalı başvuruların form adresi böylece hiç çıkmaz
  let kayit = null;
  try {
    if (env.AYARLAR) kayit = await env.AYARLAR.get('ayarlar', { type: 'json', cacheTtl: 60 });
  } catch {}
  const ayarlar = birlestir(varsayilan, kayit || varsayilan);
  return yeniden(new HTMLRewriter(), ayarlar, nonce).transform(yanit(response.body));
}
