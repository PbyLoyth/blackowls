// Ana sayfa davranışları: girişler, kelime kelime yanan metin, galeri, canlı veriler.
import { startHero } from './hero.js';

const API = 'https://api.blackowls.net';
const INVITE = 'https://discord.com/api/v10/invites/ZvkuGHj?with_counts=true';
const fmt = new Intl.NumberFormat('tr-TR');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// WebGL hazırlığı ilk boyamadan sonraya bırakılır, sayfa açılışını geciktirmez
requestAnimationFrame(() => {
  setTimeout(() => {
    startHero()
      .catch(() => {})
      .finally(() => {
        if (!document.querySelector('[data-gl]')?.dataset.ready) {
          document.documentElement.classList.remove('gl');
          document.documentElement.classList.add('no-gl');
        }
      });
  }, 0);
});

// Bloklar görünüme girince belirir
const seen = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        seen.unobserve(en.target);
      }
    }
  },
  { threshold: 0.14, rootMargin: '0px 0px -5% 0px' },
);
document.querySelectorAll('[data-fade]').forEach((el) => seen.observe(el));

// Kaydırdıkça kelimeler yanar
const para = document.querySelector('[data-words]');
if (para && !reduced) {
  const words = [...para.querySelectorAll('.word')];
  let lit = -1;
  let queued = false;
  const update = () => {
    queued = false;
    const r = para.getBoundingClientRect();
    const vh = innerHeight;
    const prog = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.3)));
    const n = Math.round(prog * words.length);
    if (n !== lit) {
      words.forEach((w, i) => w.classList.toggle('on', i < n));
      lit = n;
    }
  };
  addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

// Öne çıkanlar galerisi: görünürken oynar, bitince sonrakine geçer
const gallery = document.querySelector('[data-gallery]');
if (gallery) {
  const track = gallery.querySelector('[data-track]');
  const items = [...gallery.querySelectorAll('[data-item]')];
  const videos = items.map((el) => el.querySelector('video'));
  const dots = [...gallery.querySelectorAll('[data-dot]')];
  const toggle = gallery.querySelector('[data-toggle]');
  let index = 0;
  let inView = false;
  let paused = reduced;

  const setDots = () => {
    dots.forEach((d, i) => {
      d.toggleAttribute('data-on', i === index);
      d.setAttribute('aria-current', i === index ? 'true' : 'false');
      d.firstElementChild.style.setProperty('--fill', i < index ? '1' : '0');
    });
  };

  const fetchClip = (v) => {
    if (v.preload !== 'auto') {
      v.preload = 'auto';
      v.load();
    }
  };

  const sync = () => {
    videos.forEach((v, i) => {
      if (i === index && inView && !paused) {
        fetchClip(v);
        v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
    // Sonraki kare hazır beklesin, geçişte siyah ekran görünmesin
    if (inView && !paused) fetchClip(videos[(index + 1) % videos.length]);
  };

  const go = (i, smooth = true) => {
    index = (i + items.length) % items.length;
    const el = items[index];
    const left = el.offsetLeft - (track.clientWidth - el.clientWidth) / 2;
    track.scrollTo({ left, behavior: smooth && !reduced ? 'smooth' : 'auto' });
    videos[index].currentTime = 0;
    setDots();
    sync();
  };

  videos.forEach((v, i) => {
    v.addEventListener('timeupdate', () => {
      if (i === index && v.duration) {
        dots[i].firstElementChild.style.setProperty('--fill', String(v.currentTime / v.duration));
      }
    });
    v.addEventListener('ended', () => {
      if (i === index) go(index + 1);
    });
  });

  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

  track.addEventListener('keydown', (ev) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
    if (step) {
      ev.preventDefault();
      go(index + step);
    }
  });

  toggle.toggleAttribute('data-paused', paused);
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.toggleAttribute('data-paused', paused);
    toggle.setAttribute('aria-label', paused ? 'Galeriyi oynat' : 'Galeriyi duraklat');
    sync();
  });

  // Elle kaydırılınca o anki kart etkin olur
  const center = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        const i = items.indexOf(en.target);
        if (en.isIntersecting && i !== index) {
          index = i;
          videos[index].currentTime = 0;
          setDots();
          sync();
        }
      }
    },
    { root: track, threshold: 0.7 },
  );
  items.forEach((el) => center.observe(el));

  new IntersectionObserver(
    ([en]) => {
      inView = en.isIntersecting;
      sync();
    },
    { threshold: 0.4 },
  ).observe(track);

  setDots();
}

// Kadro: üzerine gelince Figma imleci gibi isim etiketi izler
const names = document.querySelector('[data-roster]');
const cursor = document.querySelector('[data-cursor]');
if (names && cursor && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const label = cursor.querySelector('[data-cursor-name]');
  const pos = { x: 0, y: 0, tx: 0, ty: 0, raf: 0 };
  const tick = () => {
    pos.x += (pos.tx - pos.x) * 0.22;
    pos.y += (pos.ty - pos.y) * 0.22;
    cursor.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`;
    pos.raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.2 ? requestAnimationFrame(tick) : 0;
  };
  names.addEventListener('pointermove', (ev) => {
    const li = ev.target.closest('li');
    if (!li) {
      cursor.removeAttribute('data-on');
      return;
    }
    pos.tx = ev.clientX + 10;
    pos.ty = ev.clientY + 10;
    if (!cursor.hasAttribute('data-on')) {
      pos.x = pos.tx;
      pos.y = pos.ty;
      cursor.setAttribute('data-on', '');
    }
    label.textContent = `owL | ${li.querySelector('span').textContent}`;
    if (!pos.raf) pos.raf = requestAnimationFrame(tick);
  });
  names.addEventListener('pointerleave', () => cursor.removeAttribute('data-on'));
}

// Menüde o an okunan bölüm işaretlenir
const navLinks = new Map(
  [...document.querySelectorAll('.links > a')]
    .map((a) => [a.getAttribute('href').split(/[#/]/).pop(), a])
    .filter(([id]) => document.getElementById(id)),
);
const spy = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (en.isIntersecting) navLinks.forEach((a, id) => a.setAttribute('aria-current', String(id === en.target.id)));
      else navLinks.get(en.target.id)?.removeAttribute('aria-current');
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
navLinks.forEach((_, id) => spy.observe(document.getElementById(id)));

// Canlı Discord sayıları; başarısızsa build anındaki değer kalır
async function refreshDiscord() {
  try {
    const res = await fetch(INVITE);
    if (!res.ok) return;
    const data = await res.json();
    const values = { members: data.approximate_member_count, online: data.approximate_presence_count };
    document.querySelectorAll('[data-live]').forEach((el) => {
      const v = values[el.dataset.live];
      if (v) el.textContent = fmt.format(v);
    });
  } catch {
    /* sessizce geç */
  }
}

// Kadro Discord rollerinden gelir; değişmişse listeyi yeniler
async function refreshRoster() {
  if (!names) return;
  try {
    const res = await fetch(`${API}/discord/getusers`);
    if (!res.ok) return;
    const list = await res.json();
    if (!Array.isArray(list) || !list.length) return;
    const clean = (s) => s.replace(/^\s*BLACK\s*\|\s*/i, '').replace(/[^\p{L}\p{N} ._-]/gu, '').trim();
    const shown = [...names.querySelectorAll('li span')].map((el) => el.textContent).join('|');
    const fresh = list.map((m) => clean(m.displayname)).join('|');
    if (shown === fresh) return;
    const known = new Map([...names.querySelectorAll('li')].map((li) => [li.querySelector('span').textContent, li]));
    const tpl = names.querySelector('li');
    const items = list.map((m) => {
      const name = clean(m.displayname);
      if (known.has(name)) return known.get(name);
      const li = tpl.cloneNode(true);
      li.querySelector('span').textContent = name;
      li.querySelector('img').src = `${API}${m.avatarURL}`;
      return li;
    });
    names.replaceChildren(...items);
    document.querySelectorAll('[data-roster-count]').forEach((el) => {
      el.textContent = String(list.length);
    });
  } catch {
    /* sessizce geç */
  }
}

const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400));
idle(() => {
  refreshDiscord();
  refreshRoster();
});
