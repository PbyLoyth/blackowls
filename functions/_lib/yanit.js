export function json(veri, durum = 200) {
  return new Response(JSON.stringify(veri), { status: durum, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
export function hata(mesaj, durum = 400, ek = {}) {
  return json({ hata: mesaj, ...ek }, durum);
}
export function ayniKoken(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
