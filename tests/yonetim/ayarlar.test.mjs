import test from 'node:test';
import assert from 'node:assert/strict';
import { birlestir, deger, degisenAlanlar } from '../../functions/_lib/ayarlar.js';
test('birleştirme varsayılan anahtar ve türü korur', () => {
  const vars = { a: { b: 'x', c: true } }; const got = birlestir(vars, { a: { b: 'y', c: 3, q: 4 }, q: 2 });
  assert.deepEqual(got, { a: { b: 'y', c: true } }); assert.equal(deger(got, 'a.b'), 'y');
});
test('değişen yolları bulur', () => assert.deepEqual(degisenAlanlar({ a: { b: 1, c: 2 } }, { a: { b: 3, c: 2 } }), ['a.b']));
