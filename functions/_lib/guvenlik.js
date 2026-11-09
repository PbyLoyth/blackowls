// Sitenin bütün yanıtlarına giden güvenlik başlıkları ve sayfa başına tek kullanımlık betik nonce'u

export function nonceUret() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

// Sayfa yalnız kendi betiklerini ve nonce taşıyan satır içi betikleri çalıştırır.
// Dış adresler: Discord sayıları ve kadro API'si, YouTube fragmanı. Yönetim sayfası hiçbirine izin vermez.
export function cspOlustur(nonce, { yonetim = false } = {}) {
  const kurallar = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': yonetim ? ["'self'", 'data:'] : ["'self'", 'data:', 'blob:', 'https://api.blackowls.net'],
    'font-src': ["'self'"],
    'media-src': ["'self'", 'blob:'],
    'connect-src': yonetim ? ["'self'"] : ["'self'", 'https://discord.com', 'https://api.blackowls.net'],
    'frame-src': yonetim ? ["'none'"] : ['https://www.youtube-nocookie.com', 'https://www.youtube.com'],
    'worker-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  return [...Object.entries(kurallar).map(([ad, degerler]) => `${ad} ${degerler.join(' ')}`), 'upgrade-insecure-requests'].join('; ');
}

export const API_CSP = "default-src 'none'; frame-ancestors 'none'";

export function guvenlikBasliklari(basliklar) {
  basliklar.set('X-Content-Type-Options', 'nosniff');
  basliklar.set('X-Frame-Options', 'DENY');
  basliklar.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  basliklar.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()');
  basliklar.set('Cross-Origin-Opener-Policy', 'same-origin');
  basliklar.set('Strict-Transport-Security', 'max-age=31536000');
  return basliklar;
}
