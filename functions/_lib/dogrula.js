import { guvenliBaglanti } from './baglanti.js';

export function ayarlariDogrula(girdi, varsayilan) {
  // Prototipsiz nesne: "__proto__" gibi anahtarlar hata listesinde kaybolmaz, doğrulama atlatılamaz
  const alanlar = Object.create(null);
  const metinKurallari = {
    'basvuru.bildirim': [1, 400], 'basvuru.takimFormu': [9, 300], 'basvuru.toplulukFormu': [9, 300], 'basliklar.anaGri': [1, 90], 'basliklar.anaBeyaz': [1, 90],
    'basliklar.oneCikanlar': [1, 90], 'basliklar.katil': [1, 90], 'basliklar.kafes': [1, 90],
    'basliklar.araclar': [1, 90], 'basliklar.basvuruSayfasi': [1, 90], 'basliklar.kurallarSayfasi': [1, 90],
    'basliklar.altYazi': [1, 160], 'kafes.durum': [1, 160], 'kafes.ad': [1, 120],
    'kafes.ip': [3, 60], 'duyuru.metin': [0, 140], 'duyuru.baglanti': [0, 300]
  };
  if (!girdi || typeof girdi !== 'object' || Array.isArray(girdi)) return { tamam: false, alanlar: { '': 'Geçerli bir nesne gerekli.' } };
  function tara(deger, temel, yol) {
    for (const anahtar of Object.keys(deger)) {
      const alt = yol ? `${yol}.${anahtar}` : anahtar;
      if (!Object.hasOwn(temel, anahtar)) alanlar[alt] = 'Bilinmeyen alan.';
      else if (deger[anahtar] && typeof deger[anahtar] === 'object' && !Array.isArray(deger[anahtar]) && temel[anahtar] && typeof temel[anahtar] === 'object') tara(deger[anahtar], temel[anahtar], alt);
    }
    for (const anahtar of Object.keys(temel)) {
      const alt = yol ? `${yol}.${anahtar}` : anahtar;
      if (!Object.hasOwn(deger, anahtar)) alanlar[alt] = 'Bu alan gerekli.';
      else if (temel[anahtar] && typeof temel[anahtar] === 'object' && !Array.isArray(temel[anahtar])) {
        if (!deger[anahtar] || typeof deger[anahtar] !== 'object' || Array.isArray(deger[anahtar])) alanlar[alt] = 'Nesne olmalı.';
        else tara(deger[anahtar], temel[anahtar], alt);
      } else if (typeof deger[anahtar] !== typeof temel[anahtar]) alanlar[alt] = typeof temel[anahtar] === 'boolean' ? 'Doğru veya yanlış olmalı.' : 'Metin olmalı.';
    }
  }
  tara(girdi, varsayilan, '');
  const sonuc = structuredClone(girdi);
  for (const [yol, [min, max]] of Object.entries(metinKurallari)) {
    const parcalar = yol.split('.');
    let nesne = sonuc;
    for (const p of parcalar.slice(0, -1)) nesne = nesne?.[p];
    const anahtar = parcalar.at(-1);
    if (typeof nesne?.[anahtar] !== 'string') continue;
    nesne[anahtar] = nesne[anahtar].trim();
    const metin = nesne[anahtar];
    if (/[\u0000-\u001f\u007f]/u.test(metin)) alanlar[yol] = 'Kontrol karakteri içeremez.';
    else if (metin.length < min || metin.length > max) alanlar[yol] = `Uzunluk ${min}–${max} karakter olmalı.`;
  }
  if (typeof sonuc.kafes?.ip === 'string' && !/^[A-Za-z0-9.-]+:\d{1,5}$/u.test(sonuc.kafes.ip.trim())) alanlar['kafes.ip'] = 'ad:port biçiminde olmalı.';
  else if (typeof sonuc.kafes?.ip === 'string') {
    const port = Number(sonuc.kafes.ip.trim().split(':').at(-1));
    if (port < 1 || port > 65535) alanlar['kafes.ip'] = 'Port 1–65535 arasında olmalı.';
  }
  if (typeof sonuc.duyuru?.baglanti === 'string' && !guvenliBaglanti(sonuc.duyuru.baglanti.trim())) alanlar['duyuru.baglanti'] = 'Güvenli bir bağlantı girin.';
  // Form adresleri yalnız tam https adresi olabilir, site içi yol kabul edilmez
  for (const ad of ['takimFormu', 'toplulukFormu']) {
    const v = sonuc.basvuru?.[ad];
    if (typeof v === 'string' && !alanlar[`basvuru.${ad}`] && !(v.startsWith('https://') && guvenliBaglanti(v))) alanlar[`basvuru.${ad}`] = 'https:// ile başlayan geçerli bir adres girin.';
  }
  if (sonuc.duyuru?.acik === true && sonuc.duyuru.metin === '') alanlar['duyuru.metin'] = 'Duyuru açıkken metin boş olamaz.';
  return Object.keys(alanlar).length ? { tamam: false, alanlar } : { tamam: true, ayarlar: sonuc };
}
