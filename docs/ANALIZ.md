# blackowls.net analizi ve yeniden tasarım notları

Tarih: 1 Kasım 2026. Ölçümler 412×915 mobil, Fast 4G, 4x CPU kısıtıyla alındı. Eski site canlı adresten değil, canlıdan indirilen dosyaların yerel kopyasından ölçüldü (tarayıcı paneli alan adını engelledi, PageSpeed anonim kotası doluydu).

## Önce ve sonra

| Ölçüt | Eski site | Yeni site |
| --- | --- | --- |
| İlk yükleme | 8,09 MB, 29 istek | 298 KB, 12 istek |
| Gerçek içeriğin gelişi | Zorunlu 2,5 sn "Loading" ekranından sonra | İlk boyamada |
| LCP | 2,16 sn (yükleme ekranı) | 1,39 sn |
| CLS | 0,00 | 0,00 |
| Ana sayfa JS | 208 KB React paketi | 11,8 KB |
| Kadro avatarları | 3,6 MB+ | 84 KB |
| Lighthouse Erişilebilirlik | 71 | 100 |
| Lighthouse En iyi uygulamalar | 81 | 100 |
| Lighthouse SEO | 100 | 100 |
| Lighthouse Agentic Browsing | 50 | 100 |

Yeni sitedeki Lighthouse puanları ana sayfa, başvuru, kurallar ve üç yasal sayfada aynı. 404 sayfasının SEO puanı `noindex` nedeniyle 69, bu bilerek böyle.

Video (ana döngü 3,2 MB, galeri klipleri 160-780 KB) yalnızca kullanıcı kaydırınca iner, ilk yükleme hesabına girmez. Eski sitede ilk görüntüdeki aynı PNG üç farklı adresten üç kez iniyordu (`background.png`, `owl-logo.png`, `static/media/background...png`, her biri 2,7 MB).

## Eski sitede bulunanlar

### Güvenlik

| Bulgu | Kanıt | Yapılacak |
| --- | --- | --- |
| Kaynak haritaları herkese açık | `/static/js/main.0ecc38b0.js.map` 200 dönüyor, 22 bileşenin tamamı okunabiliyor | Yeni derlemede harita yok. Eski haritaları sunucudan sil |
| Kaynakta yorum satırına alınmış BeEF kancası | `App.jsx`: `http://localhost:3000/hook.js`. BeEF bir tarayıcı saldırı aracıdır. Kod çalışmıyor ama kaynak haritası nedeniyle herkes görebiliyor | Depodan kaldır, kimin ne için eklediğini yönetimde sor |
| API gereğinden fazla veri veriyor | `/discord/getusers` yanıtında `username` ve `discord_id` var | Site yalnızca görünen adı ve avatarı kullanıyor. `username` alanını API'den çıkar |
| Avatarlar `http://` ile isteniyor | `api.blackowls.net` 80 portu kapalı, tarayıcı yükseltmesine güveniliyor | Yeni site yerel küçültülmüş avatar kullanıyor |

### Performans

- 2,7-3,1 MB'lık logolar ve 2688×1536 turnuva logoları 60 pikselde gösteriliyordu.
- `setTimeout(2500)` ile sahte yükleme ekranı vardı.
- Bir avatar 3,3 MB'lık GIF.
- `manifest.json` ve `favicon.ico` 200 ile HTML dönüyordu.

### SEO

- HTML boş bir `#root`. İçerik sadece JavaScript sonrası oluşuyor; sosyal medya botları hiçbir şey görmüyor.
- `sitemap.xml` var olmayan `/rules` ve `/team-application` adreslerini listeliyor, tarih 2025-03.
- Olmayan her adres 200 ile ana sayfayı dönüyor (soft 404).
- `og:image` ve favicon 2,7 MB'lık PNG.
- `h1` "Black owLs NE?" ve meta anahtar kelime doldurma var.

### Kullanım

- Menüde 8 öğe vardı, site içi bağlantılar yeni sekmede açılıyordu.
- Alt bilgideki üç başvuru bağlantısı aynı sayfaya gidip formu seçmiyordu.
- Formlar 700 piksel yüksekliğinde iframe içindeydi (mobilde çift kaydırma).
- Kurallar iframe içindeydi: aranamıyor, kurala bağlantı verilemiyor.
- `/stats` "yapım aşamasında" derken menü başka adrese gidiyordu.
- `avatar-placeholder.png` yok, yedek görsel kırıktı.
- `Loading team members...` gibi İngilizce metinler ve `Gamıng Communıty` gibi yazım hileleri vardı.

### Erişilebilirlik

- `user-scalable=no` yakınlaştırmayı engelliyordu.
- Menü düğmesinin adı yoktu, başlık sırası bozuktu, dokunma hedefleri 12 piksel yüksekliğindeydi.

## Yeni sitede ne değişti

- Tasarım dili: Apple ürün sayfası. Siyah zemin, iki tonlu başlık, hap düğmeler, öne çıkanlar galerisi, "Sana hangisi uygun?" karşılaştırması.
- Figma dokunuşu: kadro üzerinde çok oyunculu imleç etiketi ve aynı sistemin Figma dosyası.
- Açılış: amblem karanlıktan gözleriyle çıkar, gözler imleci izler, kaydırınca göz bebeği genişleyip maç görüntüsüne açılır.
- Tek vurgu rengi `#FF9F0A`: Apple'ın sistem turuncusu, baykuşun gözüyle aynı aile. Yazı tipi Mona Sans.
- Kurallar Google Dokümanı'ndan build sırasında çekilip sayfaya dönüştürülür: arama ve kurala doğrudan bağlantı var, admin numaraya tıklayınca link kopyalanır. Kaynak belge değişmedi.
- Başvuru tek sayfada, Apple Store yapılandırıcısı gibi. Takım veya Topluluk seçilince amblem, beklentiler, hazırlık listesi ve süreç değişir. Bilgiler gerçek Google Formlardan alındı.
- Başvurular şu an kapalı: düğmeler açık görünür, tıklanınca davet usulü bildirimi açılır. Form bağlantıları HTML'de yer almaz. Yeniden açmak için `src/data/site.js` içinde `applications.open` değeri `true` yapılır.
- KAFES yetkili başvurusu kaldırıldı. KAFES bölümü duruyor, sitede ve kurallar sayfasında kapalı olduğu yazıyor. Form adresi gerekirse: `https://docs.google.com/forms/d/e/1FAIpQLSeR77Vd5H3IOtE95iGvi-kEK3KZIYrDWuhDx8oMSvA7tWy-Iw/viewform`
- Kadro ve Discord sayıları tarayıcıda canlı güncellenir, build anındaki değer yedektir.
- Eski adresler yönlendirilir: `/takimbasvuru`, `/toplulukbasvuru`, `/rules`, `/team-application`, `/stats`.
- Hareket azaltma tercihi, WebGL yokluğu ve kapalı JavaScript durumlarında site statik haliyle tam çalışır.

## Karar bekleyenler

1. **Beceri şartı:** eski site "en az birinde çok iyi", takım formu "en az ikisi" diyor. Yeni sitede form esas alındı.
2. **Kural belgesi:** KAOS siteden kaldırılmış ama Kural 1.3 ve 3.6 hâlâ KAOS'a yönlendiriyor. Kural 0'da `insiyatif` yazım hatası var (doğrusu `inisiyatif`). Metin Google Dokümanı'ndan geldiği için düzeltme belgede yapılmalı.
3. **Başarılar 2023'te bitiyor.** 2024-2026 sonuçları varsa `src/data/tournaments.js` dosyasına eklenmeli; sayaçlar otomatik güncellenir.
4. **GREY ve WHITE amblemleri sitede yoktu**, mavi logodan türetildi. Resmî sürümleri varsa `assets-src/original/images` içine konup `npm run assets` çalıştırılmalı.
5. **Yasal metinler** çerez ve analitik topluyoruz diyor; yeni site çerez kullanmıyor ve analitik içermiyor. Metinler aynen taşındı (yalnızca "kuruşuları" yazım hatası düzeltildi), güncellenmeleri gerekiyor.
6. **Atatürk atfı:** alıntı yaygın olarak ona mal ediliyor ama birincil kaynak bulunamadı. Eski sitede imza yoktu, yeni sitede de yok.
7. **Discord splash görseli** "Adrian Borda" imzalı üçüncü taraf eseri. Yeni sitede kullanılmadı, Discord'daki kullanımın lisansı kontrol edilmeli.
8. **Canlı sunucu doluluğu gösterilmiyor.** BattleMetrics API'si artık abonelik istiyor, widget 403 dönüyor. KAFES yeniden açılırsa doluluk için `api.blackowls.net` tarafına A2S sorgusu yapan bir uç nokta eklenmesi gerekir.
9. **Bildirim metni** kullanıcının verdiği haliyle `Black Owls` yazıyor, sitenin geri kalanı `Black owLs`. Tek noktadan değişir: `src/data/site.js`.

## Yazım kuralı

- Tam cümleler noktayla biter. Liste, tablo ve düğme parçalarında nokta olmaz.
- Başlık ve düğmelerde yalnızca ilk kelime büyük yazılır; özel adlar kendi yazımını korur.
- İki noktadan sonra tam cümle geliyorsa büyük harfle, kelime ya da öbek geliyorsa küçük harfle devam edilir.

## Araştırma kaynakları

- [AI Slop Fonts and Gradients: The Tells That Give Away AI Design](https://www.925studios.co/blog/ai-slop-design-tells)
- [Why Most AI Websites Look the Same](https://webzum.com/blog/why-ai-websites-look-the-same-2026)
- [Top 10 Esports Website Design Examples](https://seahawkmedia.com/design/esports-website-design-examples/)
- Apple *Designing Fluid Interfaces* (WWDC 2018) ve *Principles of Great Design* notları: yüklü `apple-design` skill'i üzerinden
