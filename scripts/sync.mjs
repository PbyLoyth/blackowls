// Canlı kaynakları src/data altına anlık görüntü olarak yazar: kadro, Discord sayıları, sunucu kuralları.
// Kaynak erişilemezse eski dosyaya dokunmaz, böylece çevrimdışı build de çalışır.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src', 'data');

const RULES_URL =
  'https://docs.google.com/document/d/e/2PACX-1vTjHH_yAUyJEJMaHeyV1b_HGQgW3ocWeTbM685GFQRPw9lVqaNvldKYisPtdFfTXxeQKzrgHdTCSlr5/pub';
const ROSTER_URL = 'https://api.blackowls.net/discord/getusers';
const INVITE_URL = 'https://discord.com/api/v10/invites/ZvkuGHj?with_counts=true';

const save = (name, value) => writeFileSync(join(DATA, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

async function step(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.warn(`  ! ${name} güncellenemedi, eski veri kullanılacak: ${err.message}`);
  }
}

export function cleanName(displayname) {
  return displayname
    .replace(/^\s*BLACK\s*\|\s*/i, '')
    .replace(/[^\p{L}\p{N} ._-]/gu, '')
    .trim();
}

async function json(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'blackowls.net build' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

export function parseRules(html) {
  let body = html.slice(html.indexOf('<body'));
  body = body.replace(/<(script|style)[\s\S]*?<\/\1>/g, '');
  body = body.replace(/<\/(p|h[1-6]|li|tr|div)>/g, '\n').replace(/<br[^>]*>/g, '\n').replace(/<[^>]+>/g, '');
  const lines = decode(body)
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const first = lines.findIndex((l) => /SUNUCU KURALLARI$/.test(l));
  if (first < 0) throw new Error('Kural başlığı bulunamadı');

  const out = { preface: [], sections: [] };
  let section = null;
  let rule = null;

  const openSection = (id, title) => {
    section = { id, title, intro: [], rules: [] };
    out.sections.push(section);
    rule = null;
  };

  for (const line of lines.slice(first + 1)) {
    const heading = line.match(/^(\d)\.\s+(.+)$/);
    const ruleHead = line.match(/^Kural\s+(\d+(?:\.\d+)?)\s*:\s*(.*)$/);
    if (heading && line === line.toLocaleUpperCase('tr')) {
      openSection(heading[1], heading[2]);
    } else if (/^YAYINCI KURALI$/.test(line)) {
      openSection('yayinci', line);
    } else if (ruleHead) {
      if (!section) openSection('temel', 'TEMEL KURAL');
      rule = { id: ruleHead[1], title: '', text: [] };
      const rest = ruleHead[2].trim();
      if (rest && rest.length < 24) rule.title = rest;
      else if (rest) rule.text.push(rest);
      section.rules.push(rule);
    } else if (!section) {
      out.preface.push(line.replace(/^♦\s*/, ''));
    } else if (rule) {
      rule.text.push(line);
    } else {
      section.intro.push(line);
    }
  }

  // Yayıncı bölümü madde numarası taşımaz
  for (const s of out.sections) {
    if (!s.rules.length && s.intro.length) {
      s.rules.push({ id: s.id, title: '', text: s.intro });
      s.intro = [];
    }
  }
  if (out.sections.length < 5) throw new Error('Beklenen bölümler eksik');
  return out;
}

async function main() {
  console.log('Veri eşitleniyor');

  await step('kadro', async () => {
    const list = await json(ROSTER_URL);
    if (!Array.isArray(list) || !list.length) throw new Error('Boş liste');
    const dir = join(ROOT, 'public', 'img', 'roster');
    mkdirSync(dir, { recursive: true });
    const roster = [];
    for (const m of list) {
      const remote = `https://api.blackowls.net${m.avatarURL}`;
      let image = remote;
      try {
        // Discord avatarları birkaç MB olabiliyor: 176 piksel WebP'ye küçült
        const res = await fetch(remote);
        const buffer = Buffer.from(await res.arrayBuffer());
        const file = `${m.discord_id}.webp`;
        await sharp(buffer, { animated: false }).resize(176, 176, { fit: 'cover' }).webp({ quality: 80 }).toFile(join(dir, file));
        image = `/img/roster/${file}`;
      } catch (err) {
        console.warn(`    avatar küçültülemedi (${m.displayname}): ${err.message}`);
      }
      roster.push({ id: m.discord_id, name: cleanName(m.displayname), image });
    }
    save('roster.json', roster);
  });

  await step('discord', async () => {
    const data = await json(INVITE_URL);
    save('discord.json', {
      members: data.approximate_member_count,
      online: data.approximate_presence_count,
      fetchedAt: new Date().toISOString().slice(0, 10),
    });
  });

  await step('kurallar', async () => {
    const res = await fetch(RULES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    save('rules.json', parseRules(await res.text()));
  });

  const rules = JSON.parse(readFileSync(join(DATA, 'rules.json'), 'utf8'));
  console.log(`  kural bölümü: ${rules.sections.length}`);
}

main();
