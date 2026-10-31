import { site } from '../data/site.js';

const pages = ['', '/basvuru', '/kurallar', '/gizlilik-politikasi', '/kullanim-kosullari', '/kvkk-kosullari'];

export function GET() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = pages
    .map((p) => `  <url><loc>${site.url}${p}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
