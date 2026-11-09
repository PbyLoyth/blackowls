import test from 'node:test';
import assert from 'node:assert/strict';
import { imzala, dogrula, oturumuOku } from '../../functions/_lib/oturum.js';
const anahtar = 'bu-test-anahtari-en-az-32-karakter-uzun';
test('oturum imzası, süresi ve yönetici listesi', async () => {
  const yuk = { id: '123', ad: 'Umut', son: Math.floor(Date.now() / 1000) + 60 };
  const imza = await imzala(yuk, anahtar); assert.deepEqual(await dogrula(imza, anahtar), yuk);
  assert.equal(await dogrula(`${imza}x`, anahtar), null);
  assert.equal(await dogrula(await imzala({ ...yuk, son: 1 }, anahtar), anahtar).then((v) => v.son), 1);
  const req = (cookie) => new Request('https://site.test/', { headers: { Cookie: `__Host-bo_oturum=${cookie}` } });
  assert.equal(await oturumuOku(req(imza), { OTURUM_ANAHTARI: anahtar, YONETICI_IDLERI: '123' }).then((v) => v.ad), 'Umut');
  assert.equal(await oturumuOku(req(imza), { OTURUM_ANAHTARI: anahtar, YONETICI_IDLERI: '456' }), null);
  const gecmis = await imzala({ ...yuk, son: 1 }, anahtar);
  assert.equal(await oturumuOku(req(gecmis), { OTURUM_ANAHTARI: anahtar, YONETICI_IDLERI: '123' }), null);
  await assert.rejects(imzala(yuk, 'kisa'), /32/);
});
