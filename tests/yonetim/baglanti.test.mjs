import test from 'node:test';
import assert from 'node:assert/strict';
import { guvenliBaglanti } from '../../functions/_lib/baglanti.js';
test('guvenliBaglanti', () => {
  for (const x of ['javascript:alert(1)', '//kotu.com', '/\\kotu', 'http://x.com', 'https://a b.com']) assert.equal(guvenliBaglanti(x), false, x);
  for (const x of ['/kurallar', 'https://discord.gg/x', '']) assert.equal(guvenliBaglanti(x), true, x);
});
