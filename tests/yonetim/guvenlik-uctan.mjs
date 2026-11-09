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

const imzaliOturum = (yuk) => imzala(yuk, env.OTURUM_ANAHTARI);
const oturumYuk = { id: yoneticiId, ad: 'Güvenlik Testi', son: Math.floor(Date.now() / 1000) + 600 };
const oturum = await imzaliOturum(oturumYuk);
const oturumBaslik = `${cerezAdi}=${oturum}`;
const jsonBasliklari = { Cookie: oturumBaslik, Origin: base, 'Content-Type': 'application/json' };
const iste = (yol, secenekler = {}) => fetch(`${base}${yol}`, { redirect: 'manual', ...secenekler });
const ayarlariYaz = (ayarlar, headers = jsonBasliklari, body = JSON.stringify(ayarlar)) => iste('/api/yonetim/ayarlar', {
  method: 'PUT', headers, body
});
const istekGovdesi = async (yol) => {
  const response = await iste(yol);
  return { response, body: await response.text() };
};
const cspKontrol = (headers, mesaj = 'CSP') => {
  const csp = headers.get('content-security-policy') || '';
  for (const kural of ["default-src 'self'", "script-src 'self' 'nonce-", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) {
    assert.ok(csp.includes(kural), `${mesaj} ${kural} kuralını içermeli.`);
  }
  assert.equal(headers.get('x-content-type-options'), 'nosniff', `${mesaj} yanıtında nosniff olmalı.`);
};

test('güvenlik uçtan uca saldırı senaryoları', async (t) => {
  t.before(async () => {
    const response = await ayarlariYaz(varsayilan);
    assert.equal(response.status, 200, 'Senaryolar öncesinde varsayılan ayarlar geçerli yönetici oturumuyla yazılmalı.');
  });
  t.after(async () => {
    const response = await ayarlariYaz(varsayilan);
    assert.equal(response.status, 200, 'Temizlikte varsayılan ayarlar geri yazılmalı.');
  });

  await t.test('gizli ve kaynak dosyaları web kökünden açığa çıkarmaz', async () => {
    const yollar = ['/.dev.vars', '/.dev.vars.example', '/.git/config', '/.gitignore', '/package.json', '/package-lock.json', '/functions/_middleware.js', '/functions/_lib/oturum.js', '/src/data/ayarlar.json', '/src/data/roster.json', '/docs/YONETIM.md', '/README.md', '/tests/yonetim/uctan-uca.mjs', '/scripts/sync.mjs', '/.wrangler/state'];
    const yasak = ['OTURUM_ANAHTARI', 'DISCORD_CLIENT_SECRET', 'import ', '"devDependencies"'];
    for (const yol of yollar) {
      const { response, body } = await istekGovdesi(yol);
      assert.notEqual(response.status, 200, `${yol} kaynak dosyası olarak 200 dönmemeli.`);
      for (const metin of yasak) assert.ok(!body.includes(metin), `${yol} yanıt gövdesinde yasaklı ${JSON.stringify(metin)} bulunmamalı.`);
    }
  });

  await t.test('ana sayfa temel güvenlik başlıklarını ve doğrulayıcıların yokluğunu korur', async () => {
    const response = await iste('/');
    cspKontrol(response.headers, 'Ana sayfa CSP');
    for (const [baslik, deger] of [['x-frame-options', 'DENY'], ['referrer-policy', null], ['strict-transport-security', null], ['cross-origin-opener-policy', 'same-origin']]) {
      const bulunan = response.headers.get(baslik);
      assert.ok(bulunan, `${baslik} yanıt başlığı bulunmalı.`);
      if (deger) assert.equal(bulunan, deger, `${baslik} değeri ${deger} olmalı.`);
    }
    assert.ok(response.headers.get('permissions-policy')?.includes('camera=()'), 'permissions-policy camera=() içermeli.');
    assert.equal(response.headers.get('etag'), null, 'HTML etag başlığı taşımamalı.');
    assert.equal(response.headers.get('last-modified'), null, 'HTML last-modified başlığı taşımamalı.');
  });

  await t.test('her satır içi ve harici script nonce taşır ve nonce istekler arasında değişir', async () => {
    const sayfalar = await Promise.all([iste('/'), iste('/')]);
    const html = await Promise.all(sayfalar.map((response) => response.text()));
    const nonceBul = (response, govde) => {
      const csp = response.headers.get('content-security-policy') || '';
      const nonce = csp.match(/'nonce-([^']+)'/u)?.[1];
      assert.ok(nonce, 'CSP içinde nonce değeri bulunmalı.');
      for (const script of govde.matchAll(/<script\b([^>]*)>/giu)) {
        assert.match(script[1], /\bnonce="([^"]+)"/u, `Script etiketi nonce taşımalı: ${script[0]}`);
        assert.equal(script[1].match(/\bnonce="([^"]+)"/u)?.[1], nonce, 'Script nonce değeri CSP nonce ile aynı olmalı.');
      }
      return nonce;
    };
    assert.notEqual(nonceBul(sayfalar[0], html[0]), nonceBul(sayfalar[1], html[1]), 'Ayrı sayfa isteklerinin CSP nonce değerleri farklı olmalı.');
  });

  await t.test('koşullu başlıklar ana sayfada 304 yerine tam 200 yanıtı verir', async () => {
    for (const basliklar of [{ 'If-None-Match': '*' }, { 'If-Modified-Since': 'Thu, 01 Jan 2099 00:00:00 GMT' }]) {
      const response = await iste('/', { headers: basliklar });
      const body = await response.text();
      assert.equal(response.status, 200, `${Object.keys(basliklar)[0]} isteği 200 dönmeli, 304 dönmemeli.`);
      assert.ok(body.length > 0, 'Koşullu istek tam HTML gövdesi taşımalı.');
    }
  });

  await t.test('varsayılan kapalı başvurular form adresini ana ve başvuru sayfasında saklar', async () => {
    for (const yol of ['/', '/basvuru']) {
      const { response, body } = await istekGovdesi(yol);
      assert.equal(response.status, 200, `${yol} varsayılanlar ile 200 dönmeli.`);
      assert.ok(!body.includes('docs.google.com/forms'), `${yol} kapalı başvuruda form adresini göstermemeli.`);
      assert.match(body, /data-apply\b/u, `${yol} varsayılan görünümünde data-apply düğmesi bulunmalı.`);
    }
  });

  await t.test('ana sayfa ve kadro görsel yolları Discord kimliklerini sızdırmaz', async () => {
    const { body } = await istekGovdesi('/');
    const kimlik = /(?<![0-9])[0-9]{17,19}(?![0-9])/u;
    assert.doesNotMatch(body, kimlik, 'Ana sayfa HTML içinde 17–19 haneli Discord kimliği bulunmamalı.');
    const gorseller = await iste('/img/roster/');
    const gorselGovde = await gorseller.text();
    assert.doesNotMatch(gorselGovde, kimlik, '/img/roster/ görsel listesi ya da yanıtı kimlik numarası içermemeli.');
    const adlar = [...body.matchAll(/(?:src|href)=["']([^"']*\/img\/roster\/[^"']+)["']/giu)].map((eslesme) => eslesme[1]);
    for (const ad of adlar) assert.doesNotMatch(ad, kimlik, `Roster görsel adı Discord kimliği içermemeli: ${ad}`);
  });

  await t.test('başvuru, kurallar ve yönetim sayfaları güvenli başlıklar taşır', async () => {
    for (const yol of ['/basvuru', '/kurallar', '/yonetim']) {
      const response = await iste(yol);
      cspKontrol(response.headers, `${yol} CSP`);
      if (yol === '/yonetim') {
        const csp = response.headers.get('content-security-policy') || '';
        assert.ok(csp.includes("connect-src 'self'"), 'Yönetim CSP yalnız aynı kökene bağlantıya izin vermeli.');
        assert.ok(!csp.includes('discord.com') && !csp.includes('api.blackowls.net'), 'Yönetim CSP dış API alan adlarına izin vermemeli.');
        assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'), 'Yönetim x-robots-tag noindex içermeli.');
        assert.equal(response.headers.get('cache-control'), 'no-store', 'Yönetim cache-control no-store olmalı.');
      }
    }
  });

  await t.test('oturumsuz yönetim API isteği güvenli 401 döndürür', async () => {
    const response = await iste('/api/yonetim/ayarlar');
    assert.equal(response.status, 401, 'Oturumsuz yönetim API isteği 401 olmalı.');
    assert.equal(response.headers.get('content-security-policy'), "default-src 'none'; frame-ancestors 'none'", 'API CSP kısıtlı politika olmalı.');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', 'API nosniff başlığı taşımalı.');
    assert.equal(response.headers.get('cache-control'), 'no-store', 'API yanıtı önbelleğe alınmamalı.');
  });

  await t.test('geçersiz yönetici oturum biçimleri 401 döner ve bozuk yüzde kodu 500 üretmez', async () => {
    const baskaId = await imzaliOturum({ ...oturumYuk, id: '99999999999999999' });
    const gecmis = await imzaliOturum({ ...oturumYuk, son: Math.floor(Date.now() / 1000) - 1 });
    const bozulmusYuk = `${oturum.split('.')[0]}x.${oturum.split('.')[1]}`;
    const denemeler = [
      ['listede olmayan kimlik', `${cerezAdi}=${baskaId}`],
      ['süresi geçmiş imzalı çerez', `${cerezAdi}=${gecmis}`],
      ['imzası uyuşmayan değiştirilmiş yük', `${cerezAdi}=${bozulmusYuk}`],
      ['boş çerez değeri', `${cerezAdi}=`],
      ['bozuk yüzde kodlu çerez', `${cerezAdi}=%E0%A4%A`],
    ];
    for (const [aciklama, Cookie] of denemeler) {
      const response = await iste('/api/yonetim/ayarlar', { headers: { Cookie } });
      assert.equal(response.status, 401, `${aciklama} oturumu 401 dönmeli; sunucu hatası olmamalı.`);
    }
  });

  await t.test('PUT isteklerinde köken, tür, boyut ve ayar doğrulaması saldırıları reddedilir', async () => {
    const payload = JSON.stringify(varsayilan);
    const durumlar = [
      ['yabancı Origin', { Cookie: oturumBaslik, Origin: 'https://kotu.example', 'Content-Type': 'application/json' }, payload, 403],
      ['Origin eksik', { Cookie: oturumBaslik, 'Content-Type': 'application/json' }, payload, 403],
      ['form içerik türü', { ...jsonBasliklari, 'Content-Type': 'application/x-www-form-urlencoded' }, payload, 415],
      ['17 KB JSON', jsonBasliklari, `{"x":"${'a'.repeat(17000)}"}`, 413],
    ];
    for (const [ad, headers, body, durum] of durumlar) {
      const response = await ayarlariYaz(undefined, headers, body);
      assert.equal(response.status, durum, `${ad} PUT isteği ${durum} dönmeli.`);
    }
    const proto = JSON.parse(payload);
    proto.__proto__ = { kirli: true };
    const protoBody = `${payload.slice(0, -1)},"__proto__":{"kirli":true}}`;
    const protoResponse = await ayarlariYaz(undefined, jsonBasliklari, protoBody);
    assert.equal(protoResponse.status, 422, '__proto__ anahtarı taşıyan JSON 422 dönmeli.');
    for (const [ad, degistir] of [
      ['javascript bağlantısı', (ayarlar) => { ayarlar.duyuru.baglanti = 'javascript:alert(1)'; }],
      ['HTTP başvuru formu', (ayarlar) => { ayarlar.basvuru.takimFormu = 'http://kotu.example'; }],
    ]) {
      const gecersiz = structuredClone(varsayilan);
      degistir(gecersiz);
      const response = await ayarlariYaz(gecersiz);
      assert.equal(response.status, 422, `${ad} içeren PUT 422 dönmeli.`);
    }
  });

  await t.test('OAuth giriş çerezi güvenli özellikleri ve dönüş yönlendirmelerini korur', async () => {
    const giris = await iste('/api/auth/giris');
    assert.equal(giris.status, 302, 'OAuth giriş adresi 302 dönmeli.');
    const cookie = giris.headers.get('set-cookie') || '';
    for (const parca of ['__Host-bo_durum=', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(parca), `State çerezi ${parca} taşımalı.`);
    const location = new URL(giris.headers.get('location'));
    assert.ok(location.href.startsWith('https://discord.com/oauth2/authorize'), 'Giriş Discord OAuth sayfasına yönlenmeli.');
    assert.equal(location.searchParams.get('redirect_uri'), `${base}/api/auth/donus`, 'redirect_uri BASE kökenindeki dönüş adresi olmalı.');

    for (const [url, son] of [['/api/auth/donus?state=x&code=y', '/yonetim?hata=durum'], ['/api/auth/donus?error=access_denied', '/yonetim?hata=iptal']]) {
      const response = await iste(url);
      assert.equal(response.status, 302, `${url} OAuth dönüşü 302 olmalı.`);
      const hedef = response.headers.get('location') || '';
      assert.ok(hedef.endsWith(son), `${url} dönüşü ${son} ile bitmeli.`);
      assert.ok(!/^https?:\/\//iu.test(hedef), 'OAuth hata dönüşü başka siteye gitmemeli.');
    }
  });

  await t.test('çıkış yalnız POST ile ve aynı köken üzerinden yapılabilir', async () => {
    const get = await iste('/api/auth/cikis');
    assert.ok(get.status === 405 || get.status === 404, 'GET ile çıkış 405 ya da 404 olmalı.');
    const post = await iste('/api/auth/cikis', { method: 'POST', headers: { Cookie: oturumBaslik } });
    assert.equal(post.status, 403, 'Origin başlıksız çıkış POST isteği 403 dönmeli.');
  });
});
