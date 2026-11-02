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
    name: '[TR] ▦ KAFES ▦ TRY HARD | BLACKOWLS.NET | HOSTED BY SQTR',
    short: 'Kafes',
    ip: '5.9.104.40:7793',
    status: 'Kafes şu an için kapalı. İhtiyaç durumunda tekrar açılacaktır.',
  },
};

// Başvurular kapalıyken düğmeler form yerine bu bildirimi açar. Açmak için open: true yap.
export const applications = {
  open: false,
  notice:
    'Şu an için owL (Black owLs) bünyesine genel oyuncu başvuruları kapalıdır. Kadromuza katılımlar yalnızca mevcut kadronun inisiyatifi doğrultusunda davet usulü ile gerçekleştirilmektedir.',
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
