import { ayniKoken, hata } from '../../_lib/yanit.js';
import { cerezYaz } from '../../_lib/cerez.js';

export async function onRequestPost({ request }) {
  if (!ayniKoken(request)) return hata('İstek aynı kökenden gelmeli.', 403);
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'Set-Cookie': cerezYaz('__Host-bo_oturum', '', { maxAge: 0 }) } });
}
