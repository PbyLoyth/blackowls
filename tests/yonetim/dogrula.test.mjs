import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ayarlariDogrula } from '../../functions/_lib/dogrula.js';
const temel = JSON.parse(await readFile(new URL('../../src/data/ayarlar.json', import.meta.url), 'utf8'));
const kopya = () => structuredClone(temel);
test('varsayılan ayarlar geçerli', () => assert.equal(ayarlariDogrula(kopya(), temel).tamam, true));
test('bilinmeyen, eksik ve yanlış tür alanları reddedilir', () => {
  let x = kopya(); x.extra = 1; assert.equal(ayarlariDogrula(x, temel).tamam, false);
  x = kopya(); delete x.basvuru; assert.equal(ayarlariDogrula(x, temel).tamam, false);
  x = kopya(); x.basvuru.acik = 'evet'; assert.equal(ayarlariDogrula(x, temel).tamam, false);
});
test('şema metin kurallarını uygular', () => {
  for (const [yol, değer] of [['basvuru.bildirim', ''], ['basliklar.anaGri', 'x'.repeat(91)], ['basliklar.altYazi', ''], ['kafes.durum', ''], ['kafes.ad', ''], ['duyuru.metin', 'x'.repeat(141)]]) {
    const x = kopya(); const p = yol.split('.'); x[p[0]][p[1]] = değer; assert.equal(ayarlariDogrula(x, temel).tamam, false, yol);
  }
});
test('kontrol karakteri, açık boş duyuru ve kafes ip/port reddedilir', () => {
  let x = kopya(); x.basvuru.bildirim = 'satır\nsonu'; assert.equal(ayarlariDogrula(x, temel).tamam, false);
  x = kopya(); x.duyuru.acik = true; assert.equal(ayarlariDogrula(x, temel).tamam, false);
  for (const ip of ['x', 'host:0', 'host:65536', '<b>:80']) { x = kopya(); x.kafes.ip = ip; assert.equal(ayarlariDogrula(x, temel).tamam, false); }
});
test('__proto__ ve constructor anahtarları reddedilir', () => {
  for (const ad of ['__proto__', 'constructor']) {
    const x = JSON.parse(`${JSON.stringify(kopya()).slice(0, -1)},"${ad}":{"a":1}}`);
    const sonuc = ayarlariDogrula(x, temel);
    assert.equal(sonuc.tamam, false, ad);
    assert.ok(Object.hasOwn(sonuc.alanlar, ad), ad);
  }
});
test('form adresleri yalnız https olabilir', () => {
  for (const adres of ['http://docs.google.com/forms/x', '/basvuru', 'javascript:alert(1)', 'https://']) {
    const x = kopya(); x.basvuru.takimFormu = adres; assert.equal(ayarlariDogrula(x, temel).tamam, false, adres);
  }
  const x = kopya(); x.basvuru.toplulukFormu = 'https://forms.gle/abc'; assert.equal(ayarlariDogrula(x, temel).tamam, true);
});
