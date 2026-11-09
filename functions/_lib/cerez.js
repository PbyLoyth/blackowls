export function cerezleriOku(baslik = '') {
  return Object.fromEntries(baslik.split(';').map((parca) => parca.trim()).filter(Boolean).map((parca) => {
    const i = parca.indexOf('=');
    if (i < 0) return [parca, ''];
    // Bozuk kodlanmış çerez isteği düşürmesin
    try {
      return [parca.slice(0, i), decodeURIComponent(parca.slice(i + 1))];
    } catch {
      return [parca.slice(0, i), ''];
    }
  }));
}

export function cerezYaz(ad, deger, secenek = {}) {
  const host = ad.startsWith('__Host-');
  const parcalar = [`${ad}=${encodeURIComponent(deger)}`, `Path=${host ? '/' : (secenek.path || '/')}`];
  if (secenek.maxAge !== undefined) parcalar.push(`Max-Age=${secenek.maxAge}`);
  if (host || secenek.secure) parcalar.push('Secure');
  if (secenek.httpOnly !== false) parcalar.push('HttpOnly');
  parcalar.push(`SameSite=${secenek.sameSite || 'Lax'}`);
  return parcalar.join('; ');
}
