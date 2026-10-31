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

## İçerik güncelleme

| Ne | Nerede |
| --- | --- |
| Turnuva sonucu | `src/data/tournaments.js` (sayaçlar otomatik) |
| Başvuru bilgileri | `src/data/paths.js` |
| Başvuruları açma ve kapatma, bildirim metni | `src/data/site.js` içinde `applications` |
| KAFES durum yazısı | `src/data/site.js` içinde `server.status` |
| Menü, araçlar, sosyal hesaplar, sunucu | `src/data/site.js` |
| Sunucu kuralları | Google Dokümanı'nı düzenle, `npm run build` çalıştır |
| Kadro | Discord rolünden otomatik gelir |

## Görsel ve video üretimi

Ham görseller `assets-src/original/` altındadır. Fragman kaynağı `assets-src/trailer/` boyutu nedeniyle depoya alınmadı. Üretilmiş klipler `public/media/` içinde durduğu için site onsuz da derlenir, `tools/build_media.sh` ise yalnızca fragman dosyası varken çalışır.

```bash
npm run assets
```

```bash
bash tools/build_media.sh
```

İlki logoları ve amblemleri, ikincisi fragmandan video kliplerini üretir.
