import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { imzala } from '../../functions/_lib/oturum.js';

const base = process.env.BASE || 'http://127.0.0.1:8788';
const cerezAdi = '__Host-bo_oturum';
const varsayilan = JSON.parse(await readFile(new URL('../../src/data/ayarlar.json', import.meta.url), 'utf8'));
const vars = await readFile(new URL('../../.dev.vars', import.meta.url), 'utf8');
const env = Object.fromEntries(vars.split(/\r?\n/u).filter((line) => line.includes('=') && !line.trimStart().startsWith('#')).map((line) => {
  const [anahtar, ...parcalar] = line.split('=');
  return [anahtar.trim(), parcalar.join('=').trim()];
}));
const yoneticiId = env.YONETICI_IDLERI?.split(',').map((id) => id.trim()).find(Boolean);
assert.ok(env.OTURUM_ANAHTARI, '.dev.vars içinde OTURUM_ANAHTARI bulunmalı.');
assert.ok(yoneticiId, '.dev.vars içinde en az bir YONETICI_IDLERI kimliği bulunmalı.');
assert.ok(env.DISCORD_CLIENT_ID, '.dev.vars içinde DISCORD_CLIENT_ID bulunmalı.');

const oturum = await imzala({ id: yoneticiId, ad: 'Uçtan Uca Test', son: Math.floor(Date.now() / 1000) + 600 }, env.OTURUM_ANAHTARI);
const oturumBaslik = `${cerezAdi}=${oturum}`;
const jsonBasliklari = { Cookie: oturumBaslik, Origin: base, 'Content-Type': 'application/json' };
const ayarlariYaz = (ayarlar, basliklar = jsonBasliklari) => fetch(`${base}/api/yonetim/ayarlar`, {
  method: 'PUT',
  headers: basliklar,
  body: JSON.stringify(ayarlar),
  redirect: 'manual'
});

test('Pages Functions uçtan uca', async (t) => {
  t.after(async () => {
    const response = await ayarlariYaz(varsayilan);
    assert.equal(response.status, 200, 'Temizlikte varsayılan ayarlar geri yazılmalı.');
  });

  await t.test('oturum olmadan ayarlar isteği reddedilir ve giriş state çerezi üretilir', async () => {
    const response = await fetch(`${base}/api/yonetim/ayarlar`, { redirect: 'manual' });
    assert.equal(response.status, 401, 'Oturumsuz ayarlar isteği 401 dönmeli.');
    const state = await fetch(`${base}/api/auth/giris`, { redirect: 'manual' });
    assert.equal(state.status, 302, 'Giriş isteği Discord yönlendirmesi dönmeli.');
    const loc = new URL(state.headers.get('location'));
    assert.equal(loc.searchParams.get('client_id'), env.DISCORD_CLIENT_ID, 'Discord yönlendirmesinde client_id doğru olmalı.');
    assert.equal(loc.searchParams.get('redirect_uri'), `${base}/api/auth/donus`, 'Discord yönlendirmesinde redirect_uri doğru olmalı.');
    assert.equal(loc.searchParams.get('scope'), 'identify', 'Discord yönlendirmesinde scope identify olmalı.');
    assert.ok(loc.searchParams.get('state'), 'Discord yönlendirmesinde state bulunmalı.');
    assert.match(state.headers.get('set-cookie') || '', /__Host-bo_durum=/u, 'Giriş yanıtı state çerezi vermeli.');
  });

  await t.test('yanlış OAuth state ile geri dönüş hata sayfasına yönlenir', async () => {
    const response = await fetch(`${base}/api/auth/donus?code=x&state=yanlis`, {
      headers: { Cookie: '__Host-bo_durum=dogru' },
      redirect: 'manual'
    });
    assert.equal(response.status, 302, 'Yanlış state yanıtı 302 olmalı.');
    assert.ok(response.headers.get('location')?.endsWith('/yonetim?hata=durum'), 'Yanlış state yönlendirmesi /yonetim?hata=durum ile bitmeli.');
  });

  await t.test('sahte imzalı oturum reddedilir', async () => {
    const response = await fetch(`${base}/api/yonetim/ayarlar`, {
      headers: { Cookie: `${cerezAdi}=aaa.bbb` },
      redirect: 'manual'
    });
    assert.equal(response.status, 401, 'Sahte imzalı oturum 401 dönmeli.');
  });

  await t.test('geçerli oturum ayarları ve kullanıcıyı döndürür', async () => {
    const response = await fetch(`${base}/api/yonetim/ayarlar`, { headers: { Cookie: oturumBaslik }, redirect: 'manual' });
    assert.equal(response.status, 200, 'Geçerli oturumla ayarlar isteği 200 dönmeli.');
    const govde = await response.json();
    assert.ok(govde.ayarlar, 'Yanıtta ayarlar alanı bulunmalı.');
    assert.ok(govde.varsayilan, 'Yanıtta varsayilan alanı bulunmalı.');
    assert.equal(govde.kullanici?.id, yoneticiId, 'Yanıttaki kullanıcı kimliği oturumdaki yönetici olmalı.');
  });

  await t.test('Origin olmadan PUT reddedilir', async () => {
    const response = await ayarlariYaz(varsayilan, { Cookie: oturumBaslik, 'Content-Type': 'application/json' });
    assert.equal(response.status, 403, 'Origin başlıksız PUT 403 dönmeli.');
  });

  await t.test('JSON olmayan PUT reddedilir', async () => {
    const response = await fetch(`${base}/api/yonetim/ayarlar`, {
      method: 'PUT',
      headers: { Cookie: oturumBaslik, Origin: base, 'Content-Type': 'text/plain' },
      body: JSON.stringify(varsayilan),
      redirect: 'manual'
    });
    assert.equal(response.status, 415, 'text/plain içerik türüyle PUT 415 dönmeli.');
  });

  await t.test('şema dışı ve uzun değerler doğrulama hatası verir', async () => {
    const gecersiz = structuredClone(varsayilan);
    gecersiz.basliklar.anaGri = 'a'.repeat(91);
    gecersiz.kotu = 1;
    const response = await ayarlariYaz(gecersiz);
    assert.equal(response.status, 422, 'Geçersiz ayar gövdesi 422 dönmeli.');
    const govde = await response.json();
    assert.ok(Object.hasOwn(govde.alanlar || {}, 'basliklar.anaGri'), 'Doğrulama alanlarında basliklar.anaGri bulunmalı.');
    assert.ok(Object.hasOwn(govde.alanlar || {}, 'kotu'), 'Doğrulama alanlarında bilinmeyen kotu alanı bulunmalı.');
  });

  await t.test('geçerli ayarlar kaydedilir', async () => {
    const guncel = structuredClone(varsayilan);
    guncel.basliklar.anaGri = 'Deneme <script>alert(1)</script>';
    guncel.duyuru.acik = true;
    guncel.duyuru.metin = 'Deneme duyurusu';
    guncel.duyuru.baglanti = '/kurallar';
    guncel.basvuru.acik = true;
    guncel.kafes.acik = true;
    const response = await ayarlariYaz(guncel);
    assert.equal(response.status, 200, 'Geçerli ayar PUT isteği 200 dönmeli.');
    const govde = await response.json();
    assert.equal(govde.ayarlar?.basliklar?.anaGri, guncel.basliklar.anaGri, 'Yanıttaki başlık kaydedilen metinle aynı olmalı.');
  });

  await t.test('ana sayfa kaydedilen ayarları güvenli biçimde gösterir', async () => {
    const sonZaman = Date.now() + 10000;
    let html = '';
    while (Date.now() <= sonZaman) {
      const response = await fetch(`${base}/`, { redirect: 'manual' });
      assert.equal(response.status, 200, 'Ana sayfa isteği 200 dönmeli.');
      html = await response.text();
      if (html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && html.includes('Deneme duyurusu')) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'Başlık script metnini HTML entity olarak göstermeli.');
    assert.ok(!html.includes('<script>alert(1)</script>'), 'Başlık ham script etiketi içermemeli.');
    const duyuruMetni = html.match(/<[^>]*data-ayar="duyuru\.metin"[^>]*>([\s\S]*?)<\/[^>]+>/u);
    assert.ok(duyuruMetni, 'data-ayar="duyuru.metin" öğesi bulunmalı.');
    assert.ok(duyuruMetni[1].includes('Deneme duyurusu'), 'Duyuru öğesinde kaydedilen metin bulunmalı.');
    const duyuru = html.match(/<[^>]*data-duyuru(?:\s[^>]*)?>/u);
    assert.ok(duyuru, 'data-duyuru öğesi bulunmalı.');
    assert.ok(!/\shidden(?:\s|=|>)/u.test(duyuru[0]), 'Açık duyurunun açılış etiketinde hidden bulunmamalı.');
    assert.ok(!/<[^>]*data-apply(?:\s|=|>)/u.test(html), 'Başvuru açıkken data-apply taşıyan düğme bulunmamalı.');
    const basvuruBaglantilari = [...html.matchAll(/<a\b[^>]*data-ayar-goster="basvuru\.acik"[^>]*>/gu)];
    assert.ok(basvuruBaglantilari.length > 0, 'Başvuru görünürlüğü ayarına bağlı bağlantı bulunmalı.');
    assert.ok(basvuruBaglantilari.every(([etiket]) => !/\shidden(?:\s|=|>)/u.test(etiket)), 'Başvuru açıkken ilgili bağlantılarda hidden bulunmamalı.');
    const kafes = html.match(/<[^>]*data-ayar-durum="kafes\.acik"[^>]*>/u);
    assert.ok(kafes, 'data-ayar-durum="kafes.acik" öğesi bulunmalı.');
    assert.match(kafes[0], /\bdata-durum="acik"/u, 'Kafes öğesi data-durum="acik" taşımalı.');
  });

  await t.test('yönetim sayfası güvenlik başlıklarını gönderir', async () => {
    const response = await fetch(`${base}/yonetim`, { redirect: 'manual' });
    assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'), 'x-robots-tag noindex içermeli.');
    assert.equal(response.headers.get('cache-control'), 'no-store', 'cache-control no-store olmalı.');
    assert.equal(response.headers.get('x-frame-options'), 'DENY', 'x-frame-options DENY olmalı.');
  });
});
