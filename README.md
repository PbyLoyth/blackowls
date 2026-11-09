# Black owLs web sitesi

blackowls.net'in Astro ile yazılmış statik sürümü. Sunucu tarafı kod gerektirmez, `dist/` klasörü her yerde çalışır.

Tasarım dosyası: [Figma](https://www.figma.com/design/ryNTyJckEEO8R7bXe530J4)
Analiz ve açık kararlar: [docs/ANALIZ.md](docs/ANALIZ.md)

## Çalıştırma

```bash
npm install
npm run dev
```

Site `http://localhost:4321` adresinde açılır.

## Yayına hazırlama

```bash
npm run build
```

Bu komut önce kadroyu, Discord sayılarını ve kuralları canlı kaynaklardan çeker, sonra `dist/` klasörünü üretir. Kaynaklardan biri erişilemezse eski veriyle devam eder.

## Express üzerinde yayınlama

Eski React derlemesinin yerine `dist/` klasörünü koy. Kaynak haritalarını (`*.map`) sunucudan sil.

```js
import express from 'express';

const app = express();
app.use('/static', express.static('dist/static', { immutable: true, maxAge: '1y' }));
app.use(express.static('dist', { extensions: ['html'], maxAge: '1h' }));
app.use((req, res) => res.status(404).sendFile('404.html', { root: 'dist' }));
app.listen(3000);
```

Önerilen başlıklar:

```text
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://api.blackowls.net; connect-src 'self' https://discord.com https://api.blackowls.net; media-src 'self'; frame-src https://www.youtube-nocookie.com; base-uri 'self'; form-action 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Cloudflare Pages ve yönetim paneli

Site Cloudflare Pages'te yayınlanırsa `/yonetim` sayfası çalışır: başvuruları açıp kapatma, başlıklar, Kafes durumu ve duyuru şeridi yeniden derleme gerekmeden değişir. Giriş Discord ile yapılır, yalnız izin verilen hesaplar girebilir. Kurulum, güvenlik kuralları ve yerelde deneme: [docs/YONETIM.md](docs/YONETIM.md).

```bash
npm run cf
```

Bu komut `dist/` klasörünü Functions ve yerel KV ile `http://localhost:8788` adresinde açar. Express ya da tek dosya sürümünde panel çalışmaz, site varsayılan metinlerle açılır.

Cloudflare'de site nonce'lu CSP ve güvenlik başlıklarıyla sunulur. Rocket Loader kapalı olmalıdır. Güvenlik önlemleri ve saldırı testleri de aynı belgede.

## Tek dosya olarak paylaşma

```bash
npm run paylas
```

Bu komut siteyi derler ve `paylasim/Black-owLs.html` dosyasını üretir. Görseller, videolar, yazı tipleri ve altı sayfa dosyanın içindedir. Çift tıklayınca sunucusuz açılır, internet yokken de çalışır. Dosyada bağlantılar `#/basvuru` biçimindedir. YouTube dosyadan açılan sayfalara gömülü oynatıcı vermediği için fragman yeni sekmede açılır.

## İçerik güncelleme

| Ne | Nerede |
| --- | --- |
| Turnuva sonucu | `src/data/tournaments.js` (sayaçlar otomatik) |
| Başvuru bilgileri | `src/data/paths.js` |
| Başvurular, başlıklar, Kafes durumu, duyuru şeridi | Canlıda `/yonetim`; varsayılanlar `src/data/ayarlar.json` |
| Menü, araçlar, sosyal hesaplar, sunucu | `src/data/site.js` |
| Sunucu kuralları | Google Dokümanı'nı düzenle, `npm run build` çalıştır |
| Kadro | Discord rolünden otomatik gelir |

## Görsel ve video üretimi

Ham görseller `assets-src/original/` altındadır. Fragman kaynağı boyutu nedeniyle depoya alınmadı, `tools/build_media.sh` dosyasının başındaki komutla YouTube'dan 1440p olarak indirilir. Üretilmiş videolar `public/media/` (1080p ve telefon için 720p) ile `assets-src/paylasim/` (tek dosya için WebM) içinde durduğu için site onsuz da derlenir.

```bash
npm run assets
```

```bash
bash tools/build_media.sh
```

İlki logoları ve amblemleri, ikincisi fragmandan video kliplerini üretir.
