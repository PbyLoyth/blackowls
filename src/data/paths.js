// Başvuru yolları. Metinler sitenin ve Google Formların kendi ifadelerinden alındı.
// Yazım kuralı: tam cümle noktayla biter, liste ve tablo parçasında nokta olmaz.
import ayarlar from './ayarlar.json';

export const paths = [
  {
    id: 'takim',
    name: 'Takım',
    icon: 'black',
    kicker: 'Rekabetçi arena',
    who: 'Rekabetçi ortama hazır, disiplinli oyuncular',
    tempo: 'Haftada 2 maç, turnuvada 4 ile 5 maç',
    seek: 'Gamesense, gameplay ve aim: en az ikisi',
    reply: 'Recruit ekibi ulaşır',
    summary: 'Rekabet ortamı farklıdır. Maçlarımız yoğun, gergin ama unutulmaz geçer.',
    form: ayarlar.basvuru.takimFormu,
    cta: 'Takım başvurusu',
    questions: 14,
    ladder: [
      { color: 'white', short: 'White', name: 'White owL', note: 'Tanışma süreci, tag yok' },
      { color: 'grey', short: 'Grey', name: 'Grey owL', note: 'Black adayı, owLg tagi' },
      { color: 'black', short: 'Black', name: 'Black owL', note: 'Takım üyesi, owL tagi' },
    ],
    expect: [
      'Gamesense, gameplay ve aim: en az ikisinde kendini güçlü görmen',
      'Yüksek iletişim becerisi',
      'Haftada 2 maç, turnuva döneminde haftada 4 ile 5 maç',
      'Yılda en fazla 2 turnuva, her biri 4 ile 6 hafta',
    ],
    prepare: [
      'Discord kullanıcı adın',
      'Steam profil linkin (başvuru süresince gizli olmamalı)',
      'Squad saatin ve haftalık oyun süren',
      'Varsa eski takımların ve referansın',
    ],
    steps: [
      'Formu eksiksiz doldur.',
      'Recruit ekibimiz en kısa zamanda seninle iletişime geçer.',
      'Olumlu sonuçlanırsa Black owLs Competitive Çiftlik Discord’una davet edilirsin.',
      'Kabul edilmezsen ve bunun nedeni kronik, negatif bir durum değilse topluluk üyesi olarak tanımlanırsın.',
    ],
    note: 'Aklında soru işareti varsa her anlamda hazır olana dek topluluk üyesi olmanı öneriyoruz.',
  },
  {
    id: 'topluluk',
    name: 'Topluluk',
    icon: 'red',
    kicker: 'Kaliteli ve eğlenceli oyun',
    who: 'Kaliteli oyun deneyimi isteyen herkes',
    tempo: 'Haftalık aktifliğini formda belirtirsin',
    seek: 'Düzgün karakter, saygı ve hoşgörü',
    reply: 'Tanışma ekibi ulaşır',
    summary: 'Düzgün karakterde, zararsız bir kişi olman yeterli. Herkes başvurabilir.',
    form: ayarlar.basvuru.toplulukFormu,
    cta: 'Topluluk başvurusu',
    questions: 15,
    ladder: [
      { color: 'blue', short: 'Blue', name: 'Blue owL', note: 'Deneme süreci, tag yok' },
      { color: 'yellow', short: 'Yellow', name: 'Yellow owL', note: 'Yakın arkadaşlarımız, tag yok' },
      { color: 'red', short: 'Red', name: 'Red owL', note: 'Gedikliler, abiler ve ablalar, owL tagi' },
    ],
    expect: [
      'Saygı: Fikrini saygı çerçevesinde savun.',
      'Hoşgörü: Her oyuncu aynı hızla öğrenmez.',
      'Nezaket: Negatif dilden uzak dur.',
      'Aktif katılım: Sadece oynama, topluluğa katkı ver.',
      'Ciddiyet: Yerinde şaka yapıp yerinde susabilenleri severiz.',
    ],
    gives: [
      'Sunucularımızda whitelist',
      'Etkinliklere ve içeriklere katılım',
      'Hazırlık maçlarında spot edinme şansı',
      'Tecrübeli bir ekiple bilinçli oyun',
    ],
    prepare: [
      'Discord kullanıcı adın',
      'Steam profil linkin (başvuru süresince gizli olmamalı)',
      'Yaşın',
      'Squad saatin ve Squad Leader tecrüben',
    ],
    steps: [
      'Sunucu kurallarını oku, formu doldur.',
      'Tanışma ekibimiz en kısa zamanda seninle iletişime geçer.',
      'Blue owL olarak deneme sürecine başlarsın.',
    ],
    note: 'Takım formu ve süreci ayrıdır. Hatalı form doldurmak hoş karşılanmaz.',
  },
];
