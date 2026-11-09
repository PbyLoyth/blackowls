# Yönetim paneli

Sitenin bazı metinleri ve durumları yeniden derleme gerekmeden `/yonetim` sayfasından değişir. Site Cloudflare Pages'te statik olarak durur; değişiklikleri Pages Functions uygular.

## Nasıl çalışır

- Ayarlar Cloudflare KV'de, `AYARLAR` bağlamasında, `ayarlar` anahtarında JSON olarak durur. KV'de kayıt yoksa derlemedeki varsayılanlar (`src/data/ayarlar.json`) geçerlidir.
- `functions/_middleware.js` her HTML yanıtını KV ayarlarıyla HTMLRewriter üzerinden yeniden yazar. Değişiklik KV önbelleği yüzünden en geç bir dakikada her yerde görünür.
- Giriş Discord ile yapılır (`identify` kapsamı). Yalnız `YONETICI_IDLERI` listesindeki Discord kullanıcıları girebilir. Şifre yoktur.
- Oturum imzalı bir çerezdir: `__Host-bo_oturum`, HMAC-SHA256, HttpOnly, Secure, SameSite=Lax, Path=/, 8 saat.
- Tek dosya paylaşım sürümünde ve `npm run preview` altında Functions çalışmaz; site varsayılanlarla açılır, `/yonetim` bunu söyler.

## Ortam değişkenleri

Hepsi Cloudflare'de "Secret" olarak girilir, depoya ve istemciye girmez. Yerelde `.dev.vars` dosyasına yazılır, bu dosya git dışıdır (örnek: `.dev.vars.example`).

| Ad | Ne |
| --- | --- |
| `DISCORD_CLIENT_ID` | Discord uygulamasının kimliği |
| `DISCORD_CLIENT_SECRET` | Discord uygulamasının gizli anahtarı |
| `OTURUM_ANAHTARI` | En az 32 karakter rastgele değer |
| `YONETICI_IDLERI` | Virgülle ayrılmış Discord kullanıcı kimlikleri |

KV bağlaması: `AYARLAR`.

## Ayar şeması

Sunucu yalnız tam nesneyi kabul eder. Bilinmeyen anahtar, eksik anahtar ya da yanlış tür reddedilir.

| Yol | Tür | Kural |
| --- | --- | --- |
| `basvuru.acik` | boolean | |
| `basvuru.bildirim` | metin | 1–400 |
| `basvuru.takimFormu`, `basvuru.toplulukFormu` | metin | 9–300, yalnız `https://` adresi |
| `basliklar.anaGri`, `anaBeyaz`, `oneCikanlar`, `katil`, `kafes`, `araclar`, `basvuruSayfasi`, `kurallarSayfasi` | metin | 1–90 |
| `basliklar.altYazi` | metin | 1–160 |
| `kafes.acik` | boolean | |
| `kafes.durum` | metin | 1–160 |
| `kafes.ad` | metin | 1–120 |
| `kafes.ip` | metin | 3–60, `ad:port` biçimi, port 1–65535 |
| `duyuru.acik` | boolean | |
| `duyuru.metin` | metin | 0–140, `duyuru.acik` doğruysa en az 1 |
| `duyuru.baglanti` | metin | 0–300; boş, `/` ile başlayan site içi yol (`//` değil) ya da `https://` adresi |

Metinler kırpılır; kontrol karakteri ve satır sonu içeremez. İstek gövdesi en çok 16 KB.

## Sayfa işaretleri

Ara katman yalnız bu özniteliklere bakar. Değeri her zaman düz metin olarak yazar, HTML olarak değil.

| İşaret | Etki |
| --- | --- |
| `data-ayar="yol"` | Öğenin içeriği yoldaki metin olur |
| `data-ayar-ozellik="ad:yol"` | `ad` özniteliği yoldaki değer olur. Birden çoğu `;` ile ayrılır. İzinli adlar: `href`, `title`, `aria-label`, `data-*`. `href` yalnız güvenli bağlantı alır |
| `data-ayar-goster="yol"` | Değer doğruysa `hidden` kalkar, yanlışsa öğe silinir |
| `data-ayar-gizle="yol"` | Tersi |
| `data-ayar-durum="yol"` | `data-durum` özniteliği `acik` ya da `kapali` olur |

Derlemede varsayılana göre gizli olan öğeler `hidden` ile gelir, böylece Functions yokken de doğru görünür. Başvurular kapalıyken form bağlantısının adresi derlemeye hiç yazılmaz; açılınca ara katman adresi ayarlardan ekler.

## Uç noktalar

| Yöntem | Yol | Ne yapar |
| --- | --- | --- |
| GET | `/api/auth/giris` | Rastgele `state` üretir, `__Host-bo_durum` çerezine yazar (10 dakika), Discord'a yönlendirir |
| GET | `/api/auth/donus` | `state` ve çerezi karşılaştırır, kodu jetonla değiştirir, `/users/@me` ile kimliği alır. İzinliyse oturum çerezini yazıp `/yonetim`'e, değilse `/yonetim?hata=izin`'e yönlendirir |
| POST | `/api/auth/cikis` | Aynı köken şart. Oturum çerezini siler, 204 döner |
| GET | `/api/yonetim/ayarlar` | Oturum şart. `{ ayarlar, varsayilan, kullanici: { id, ad }, son, gecmis }` döner |
| PUT | `/api/yonetim/ayarlar` | Oturum, aynı köken ve JSON şart. Doğrular, KV'ye yazar, geçmişe ekler (son 20 kayıt) |

`redirect_uri` her zaman `<köken>/api/auth/donus`'tur. Hata kodları (`?hata=`): `izin`, `durum`, `discord`, `iptal`, `yapilandirma`.

Yanıtlar `Cache-Control: no-store` taşır. Hata gövdesi `{ "hata": "..." }` biçiminde ve Türkçedir. Doğrulama hatası 422 ile `{ "hata", "alanlar": { "yol": "mesaj" } }` döner.

KV anahtarları: `ayarlar`, `ayarlar:son` (`{ id, ad, zaman }`), `ayarlar:gecmis` (`[{ id, ad, zaman, alanlar }]`).

## Güvenlik kuralları

- Gizli değerler yalnız ortam değişkenlerindedir.
- Oturum her istekte imza, süre ve `YONETICI_IDLERI` ile yeniden denetlenir. Listeden çıkarılan kişi anında düşer.
- İmza ve `state` karşılaştırmaları sabit sürelidir.
- POST ve PUT isteklerinde `Origin` başlığı isteğin kökeniyle aynı olmalıdır, yoksa 403 döner.
- `/yonetim` yanıtı `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store`, `X-Frame-Options: DENY` ve `Referrer-Policy: same-origin` taşır, site haritasında yoktur.
- Görsel, video, yazı tipi gibi dosyalar `public/_routes.json` ile Functions'a hiç uğramaz; ücretsiz istek kotası yalnız sayfalar ve API için harcanır.
- Discord isteklerinde zaman aşımı vardır, ayrıntılı hata istemciye gitmez.
- KV okunamazsa ara katman derlemedeki varsayılanları uygular, site bozulmaz.
- Giriş dönüşleri göreli adrese (`/yonetim`) yönlenir, başka siteye yönlendirme yapılamaz.
- Doğrulama hata listesi prototipsiz nesnedir; `__proto__`, `constructor` gibi anahtarlar reddedilir.

### Sitedeki güvenlik önlemleri

- Her sayfa isteğinde rastgele bir nonce üretilir, sayfadaki her `<script>` bu nonce'u alır. CSP yalnız sitenin kendi dosyalarına ve nonce'lu betiklere izin verir. Dış adresler: `discord.com` ve `api.blackowls.net` (sayılar ve kadro), `api.blackowls.net` görselleri, YouTube fragmanı. `/yonetim` sayfası hiçbir dış adrese izin vermez.
- Bütün yanıtlarda: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` ve `frame-ancestors 'none'` (site başka sitede çerçevelenemez), `Referrer-Policy`, `Permissions-Policy` (kamera, mikrofon, konum kapalı), `Cross-Origin-Opener-Policy`, `Strict-Transport-Security`. API yanıtlarında `default-src 'none'`.
- Sayfalar ayarlarla yeniden yazıldığı için `ETag` ve `Last-Modified` kaldırılır, koşullu istek başlıkları silinir; tarayıcı eski ayarlı kopyayı 304 ile geri getiremez.
- KV'de kayıt yokken de varsayılanlar uygulanır; başvurular kapalıyken form adresleri sayfada hiç görünmez.
- Kadro görsellerinin adları rastgeledir (`scripts/sync.mjs`), sitede Discord kimliği yoktur. Kadrodan çıkanların görselleri silinir.
- `robots.txt` `/api/` ve `/yonetim` yollarını dizinlemeye kapatır.

### Cloudflare'de kapalı kalması gerekenler

- **Rocket Loader kapalı olmalı.** Betikleri yeniden yazar, nonce'lu CSP ile çalışmaz ve sitenin JavaScript'ini durdurur.
- E-posta gizleme (Scrape Shield) açık kalabilir; betiği aynı kökenden geldiği için CSP izin verir.
- Web Analytics açılırsa `functions/_lib/guvenlik.js` içinde `script-src`'ye `https://static.cloudflareinsights.com`, `connect-src`'ye `https://cloudflareinsights.com` eklenmeli; yoksa ölçüm betiği engellenir.
- SSL/TLS > Edge Certificates altında Always Use HTTPS açık olmalı.

## Yerelde deneme

```bash
npm run build
```

```bash
npm run cf
```

`.dev.vars` dosyası `.dev.vars.example` örneğinden hazırlanır. Site `http://localhost:8788` adresinde Functions ve yerel KV ile açılır. Discord girişini yerelde denemek için Discord uygulamasına `http://localhost:8788/api/auth/donus` adresi de eklenir.

```bash
npm run test:yonetim
```

`npm run cf` çalışırken uçtan uca ve saldırı testleri:

```bash
node --test tests/yonetim/uctan-uca.mjs
```

```bash
node --test tests/yonetim/guvenlik-uctan.mjs
```

Saldırı testi gizli dosyaların sitede olmadığını, güvenlik başlıklarını, nonce'ları, 304 ile eski kopya dönmediğini, form adreslerinin ve Discord kimliklerinin sızmadığını, sahte ve süresi geçmiş oturumları, kökeni farklı, büyük ve kötü niyetli istekleri ve giriş yönlendirmelerini dener.

## Cloudflare kurulumu

1. Discord Developer Portal'da yeni uygulama aç. OAuth2 bölümünde Redirects'e `https://blackowls.net/api/auth/donus` ekle. Client ID ve Client Secret'ı al.
2. Discord'da Ayarlar > Gelişmiş > Geliştirici Modu'nu aç, yönetici olacak her hesabın profiline sağ tıklayıp kullanıcı kimliğini kopyala.
3. Cloudflare'de Workers & Pages > Create > Pages > Connect to Git ile `PbyLoyth/blackowls` deposunu bağla. Build command `npm run build`, output directory `dist`.
4. Workers & Pages > KV'de `blackowls-ayarlar` adıyla bir alan aç. Pages projesinde Settings > Bindings > KV namespace ile `AYARLAR` adıyla bağla.
5. Settings > Variables and Secrets'a yukarıdaki dört değeri Secret olarak gir.
6. Custom domains'e `blackowls.net` ekle.
