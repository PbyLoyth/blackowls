import test from 'node:test';
import assert from 'node:assert/strict';
import { cerezleriOku, cerezYaz } from '../../functions/_lib/cerez.js';
test('cookie ayrıştırma ve yazma', () => {
  assert.deepEqual(cerezleriOku('a=bir%20iki; b=2'), { a: 'bir iki', b: '2' });
  assert.match(cerezYaz('__Host-bo', 'x'), /Path=\/; .*Secure; HttpOnly; SameSite=Lax/);
});
