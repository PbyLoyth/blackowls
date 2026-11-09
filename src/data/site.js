import ayarlar from './ayarlar.json';

// Yönetim panelinden değişebilen metinler ayarlar.json'da durur; canlıda Cloudflare KV bunların üstüne yazar
export { ayarlar };

export const site = {
  name: 'Black owLs',
  url: 'https://blackowls.net',
  title: 'Black owLs | Squad Türkiye e-spor takımı ve topluluğu',
  description:
    'Black owLs, 2018’den beri sadece Türk oyunculardan oluşan kadrosuyla Squad sahnesinde yarışan e-spor takımı ve topluluğu.',
  email: 'blackowlsresmi@gmail.com',
  discord: 'https://discord.blackowls.net/',
  trailer: 'XfJU8fCtORo',
  server: {
    name: ayarlar.kafes.ad,
    short: 'Kafes',
    ip: ayarlar.kafes.ip,
    status: ayarlar.kafes.durum,
    open: ayarlar.kafes.acik,
  },
};

// Başvurular kapalıyken düğmeler form yerine bu bildirimi açar
export const applications = {
  open: ayarlar.basvuru.acik,
  notice: ayarlar.basvuru.bildirim,
};

export const socials = [
  { label: 'Discord', href: site.discord },
  { label: 'Instagram', href: 'https://www.instagram.com/blackowlsofc/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@blackowlsofc' },
  { label: 'YouTube', href: 'https://www.youtube.com/@blackowls' },
];

export const tools = [
  { label: 'İstatistik', note: 'Maç ve oyuncu istatistikleri', href: 'https://stats.squadtr.com/owl/match/' },
  { label: 'Taktik', note: 'Harita üstünde strat planı', href: 'https://strat.squadtr.com' },
  { label: 'Harita', note: 'Squad harita katmanları', href: 'https://squadmaps.com/' },
  { label: 'Havan', note: 'Havan hesaplayıcı', href: 'https://squadcalc.app/' },
];

export const nav = [
  { label: 'Neden', href: '/#neden' },
  { label: 'Başarılar', href: '/#basarilar' },
  { label: 'Kadro', href: '/#kadro' },
  { label: 'Kafes', href: '/#kafes' },
  { label: 'Kurallar', href: '/kurallar' },
];

export const formatCount = (n) => new Intl.NumberFormat('tr-TR').format(n);
