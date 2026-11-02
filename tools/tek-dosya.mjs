// Siteyi arkadaşlara gönderilebilecek tek bir HTML dosyasına paketler.
// Sayfalar olduğu gibi dosyanın içinde saklanır, açılışta adresteki #/sayfa seçilip yazılır.
// Her gezinme dosyayı yeniden yükler, böylece sayfa kodları sitedeki gibi temiz başlar.
// dist/ güncel olmalı: npm run paylas
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'paylasim', 'Black-owLs.html');
const PAGES = ['index', 'basvuru', 'kurallar', 'gizlilik-politikasi', 'kullanim-kosullari', 'kvkk-kosullari'];
const EMBLEM = '/hero/emblem-1423.webp';
const TYPES = {
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.webm': 'video/webm',
};

const assets = new Map();
const themes = {};
let trailer = '';

const read = (path) => readFileSync(join(path.startsWith('/paylasim/') ? join(ROOT, 'assets-src') : DIST, path));
const text = (path) => read(path).toString('utf8');

function token(path) {
  if (!assets.has(path)) assets.set(path, assets.size);
  return `@@${assets.get(path)}@@`;
}

// Sitedeki kod değişirse sessizce bozulmasın, paketleme dursun
function patch(html, pattern, replace) {
  let hits = 0;
  const out = html.replace(pattern, (...args) => {
    hits += 1;
    return replace(...args);
  });
  if (hits !== 1) throw new Error(`Yama ${hits} kez eşleşti: ${pattern}`);
  return out;
}

function link(href, page) {
  const [path, anchor] = href.split('#');
  const target = path === '' ? page : path === '/' ? 'index' : path.slice(1);
  if (!PAGES.includes(target)) throw new Error(`Bilinmeyen bağlantı: ${href} (${page})`);
  return `#/${target}${anchor ? `/${anchor}` : ''}`;
}

function packPage(page) {
  let html = text(`${page}.html`);
  if (html.includes('@@')) throw new Error(`${page}: işaret çakışması`);

  themes[page] = html.match(/<meta name="theme-color" content="([^"]+)"/)[1];

  // Arama motoru ve bağlantı önizlemesi etiketleri dosyada işe yaramaz
  html = html
    .replace(/<link rel="(?:canonical|icon|apple-touch-icon|manifest|preload)"[^>]*>/g, '')
    .replace(/<meta (?:property="og:|name="twitter:|name="robots")[^>]*>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');

  html = patch(html, /@font-face\{[^}]*vietnamese[^}]*\}/g, () => '');

  html = html.replace(/<script type="module" src="([^"]+)"><\/script>/g, (_, src) => {
    return `<script type="module">${text(src).replace(/<\/script/gi, '<\\/script')}</script>`;
  });

  // Dosya 10 MB altında kalsın diye videolar ayrı sıkıştırılmış WebM kopyalardan gelir
  html = html
    .replace(/<source media="[^"]*"[^>]*>/g, '')
    .replace(/<source src="\/media\/([\w-]+)\.mp4" type="video\/mp4"/g, (_, name) => {
      return `<source src="/paylasim/${name}.webm" type="video/webm"`;
    });

  html = html.replace(/href="([^"]*)"/g, (all, href) => {
    return /^(?:[a-z]+:|\/\/)/i.test(href) ? all : `href="${link(href, page)}"`;
  });

  if (page === 'index') {
    trailer = html.match(/youtube-nocookie\.com\/embed\/([\w-]+)/)[1];
    html = patch(html, /<img class="emblem"[^>]*>/g, (tag) => {
      return tag
        .replace(/ srcset="[^"]*"/, '')
        .replace(/ sizes="[^"]*"/, '')
        .replace(/ src="[^"]*"/, ` src="${EMBLEM}"`);
    });
  }

  if (page === 'basvuru') {
    html = patch(html, /location\.hash\.slice\(1\)/g, () => 'location.hash.split(`/`).pop()');
    html = patch(html, /history\.replaceState\(null,``,`#\$\{(\w+)\.value\}`\)/g, (_, input) => {
      return `history.replaceState(null,\`\`,\`#/basvuru/\${${input}.value}\`)`;
    });
  }

  if (page === 'kurallar') html = patch(html, /:target/g, () => '[data-hedef]');

  html = html.replace(/(?<![\w.:/-])\/(?:img|media|hero|static|paylasim)\/[\w.%-]+(?:\/[\w.%-]+)*/g, token);

  const left = html.match(/["'(]\/[\w-]+\/[\w.%-]+\.[a-z0-9]{2,5}/);
  if (left) throw new Error(`${page}: gömülmemiş dosya: ${left[0]}`);

  return JSON.stringify(html).replace(/<(?=\/script|!--)/gi, '\\u003c');
}

// Tarayıcıda çalışır: adresteki sayfayı seçer, gömülü dosyaları adrese çevirir ve sayfayı yazar
function boot({ pages, trailer }) {
  history.scrollRestoration = 'manual';

  const route = () => {
    const [root, page, anchor] = location.hash.split('/');
    return root === '#' && pages.includes(page) ? { page, anchor } : { page: 'index' };
  };

  const go = (anchor, behavior) => {
    document.querySelector('[data-hedef]')?.removeAttribute('data-hedef');
    const el = anchor && document.getElementById(anchor);
    if (!el) {
      scrollTo({ top: 0, behavior });
      return;
    }
    el.setAttribute('data-hedef', '');
    el.scrollIntoView({ behavior });
    if (anchor === 'icerik') {
      el.tabIndex = -1;
      el.focus({ preventScroll: true });
    }
  };

  // Görseller data adresiyle kalır, videolar ileri sarılabilsin diye Blob olur
  const address = (node) => {
    const type = node.dataset.tur;
    if (!type.startsWith('video/')) return `data:${type};base64,${node.textContent}`;
    const binary = atob(node.textContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type }));
  };

  const current = route();
  const nodes = new Map([...document.querySelectorAll('script[data-n]')].map((el) => [el.dataset.n, el]));
  const urls = new Map();
  const source = document.querySelector(`script[data-sayfa="${current.page}"]`).textContent;
  const html = JSON.parse(source).replace(/@@(\d+)@@/g, (_, n) => {
    if (!urls.has(n)) urls.set(n, address(nodes.get(n)));
    return urls.get(n);
  });
  document.querySelectorAll('script[data-n], script[data-sayfa]').forEach((el) => el.remove());
  document.write(html);

  addEventListener('hashchange', () => {
    const next = route();
    if (next.page !== current.page) location.reload();
    else setTimeout(() => go(next.anchor));
  });

  document.addEventListener(
    'click',
    (ev) => {
      // YouTube, dosyadan açılan sayfalara gömülü oynatıcı vermiyor
      if (ev.target.closest('[data-trailer]')) {
        ev.stopPropagation();
        open(`https://www.youtube.com/watch?v=${trailer}`, '_blank', 'noopener');
        return;
      }
      const link = ev.target.closest('a[href^="#/"]');
      if (link && link.getAttribute('href') === location.hash) {
        ev.preventDefault();
        go(route().anchor);
      }
    },
    true,
  );

  addEventListener('DOMContentLoaded', () => document.documentElement.style.removeProperty('background'));
  addEventListener('load', () => {
    if (current.anchor) go(current.anchor, 'instant');
  });
}

const pages = PAGES.map((page) => `<script type="application/json" data-sayfa="${page}">${packPage(page)}</script>`);

const files = [...assets].map(([path, n]) => {
  const type = TYPES[extname(path)];
  if (!type) throw new Error(`Tanımsız dosya türü: ${path}`);
  return `<script type="text/plain" data-n="${n}" data-tur="${type}">${read(path).toString('base64')}</script>`;
});

const light = PAGES.filter((page) => themes[page] === '#ffffff');
const icon = read('favicon.svg').toString('base64');

const out = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<link rel="icon" href="data:image/svg+xml;base64,${icon}">
<script>document.documentElement.style.background=${JSON.stringify(light)}.includes(location.hash.split('/')[1])?'#fff':'#000'</script>
<noscript><p style="font:18px/1.5 system-ui,sans-serif;padding:32px;color:#111">Bu dosya JavaScript olmadan açılmaz. Bilgisayarda Chrome, Edge veya Firefox ile aç.</p></noscript>
${files.join('\n')}
${pages.join('\n')}
<script>(${boot})(${JSON.stringify({ pages: PAGES, trailer })})</script>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out);

const mb = Buffer.byteLength(out) / 1048576;
console.log(`${OUT}: ${mb.toFixed(2)} MB, ${PAGES.length} sayfa, ${assets.size} dosya`);
if (mb > 10) console.warn('Dosya 10 MB sınırını aştı, Discord üzerinden gönderilemeyebilir.');
