#!/usr/bin/env bash
# Fragmandan site videolarını üretir: ana döngü ve galeri klipleri (yavaş çekim).
# Her video üç boyda çıkar: masaüstü 1080p, telefon 720p, tek dosya için küçük WebM.
# Kaynak depoda değildir, önce indir:
#   yt-dlp -f 308 -o assets-src/trailer/kaynak/trailer-1440.webm https://www.youtube.com/watch?v=XfJU8fCtORo
# Çalıştırma: bash tools/build_media.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
V="$ROOT/assets-src/trailer/kaynak/trailer-1440.webm"
OUT="$ROOT/public/media"
SHARE="$ROOT/assets-src/paylasim"
TMP="$ROOT/assets-src/trailer/tmp"
mkdir -p "$OUT" "$SHARE" "$TMP"

GRADE="eq=contrast=1.04:saturation=0.94"
BASE="scale=1920:1080:flags=lanczos,$GRADE,format=yuv420p"

# Ara kopya kayıpsıza yakın tutulur, üç çıktı da aynı kareden üretilir.
# Ara kopya ve WebM varsa yeniden üretilmez, baştan üretmek için ikisini de sil.
master() { # ad, ffmpeg girdileri ve süzgeç argümanları
  local name="$1"; shift
  [ -s "$TMP/$name.mkv" ] && return 0
  ffmpeg -v error -y "$@" -c:v libx264 -preset veryfast -crf 10 -an "$TMP/$name.mkv"
}

h264() { # ad, çıktı, yükseklik, crf, kare hızı
  ffmpeg -v error -y -i "$TMP/$1.mkv" -vf "fps=$5,scale=-2:$3:flags=lanczos,format=yuv420p" \
    -c:v libx264 -preset slower -crf "$4" -profile:v high -movflags +faststart -an "$2"
}

webm() { # ad, bit hızı
  [ -s "$SHARE/$1.webm" ] && return 0
  local vf="scale=-2:720:flags=lanczos,format=yuv420p"
  ffmpeg -v error -y -i "$TMP/$1.mkv" -vf "$vf" -c:v libvpx-vp9 -b:v "$2" -pass 1 -passlogfile "$TMP/vp9-$1" \
    -row-mt 1 -deadline good -cpu-used 4 -an -f null -
  ffmpeg -v error -y -i "$TMP/$1.mkv" -vf "$vf" -c:v libvpx-vp9 -b:v "$2" -pass 2 -passlogfile "$TMP/vp9-$1" \
    -row-mt 1 -deadline good -cpu-used 1 -auto-alt-ref 1 -lag-in-frames 25 -an "$SHARE/$1.webm"
}

poster() { # ad, saniye
  ffmpeg -v error -y -ss "$2" -i "$TMP/$1.mkv" -frames:v 1 -vf "scale=1280:-2:flags=lanczos" "$TMP/$1.png"
}

publish() { # ad, afiş saniyesi, kare hızı, masaüstü crf, telefon crf, WebM bit hızı
  h264 "$1" "$OUT/$1.mp4" 1080 "$4" "$3"
  h264 "$1" "$OUT/$1-720.mp4" 720 "$5" 30
  webm "$1" "$6"
  poster "$1" "$2"
}

# Ana döngü: fragmandaki sahne sınırlarından kesilmiş 12 saniye, kaynak hızında 60 kare
cuts=("8.00 1.00" "9.05 1.08" "16.60 1.30" "20.20 2.00" "29.20 1.45" "31.00 1.10" "34.00 1.20" "37.40 1.00" "40.05 0.88" "14.25 0.80")
inputs=(); filt=""; i=0
for c in "${cuts[@]}"; do
  inputs+=(-ss "${c% *}" -t "${c#* }" -i "$V"); filt+="[$i:v]"; i=$((i+1))
done
master reel "${inputs[@]}" -filter_complex "${filt}concat=n=$i:v=1:a=0,fps=60,$BASE[v]" -map "[v]"

# Galeri klipleri: kaynak 60 fps olduğu için yarı hızda akıcı kalır
clip() { # ad, başlangıç, süre, hız çarpanı
  master "$1" -ss "$2" -t "$3" -i "$V" -vf "setpts=$4*PTS,fps=30,$BASE"
}
clip tempo 34.00 1.85 2
clip tank 32.17 1.78 2
clip heli 9.05 1.08 2.4
clip strike 20.20 2.00 2

# İki sahne: maç bandı ve kuşbakışı
master mac -ss 38.87 -t 0.70 -i "$V" -ss 40.05 -t 0.88 -i "$V" -filter_complex \
  "[0:v][1:v]concat=n=2:v=1:a=0,setpts=1.8*PTS,fps=30,$BASE[v]" -map "[v]"

publish reel 1.55 60 25 26 2150k
publish tempo 0.05 30 23 25 1050k
publish tank 0.05 30 23 25 650k
publish heli 0.05 30 23 25 2250k
publish strike 0.05 30 23 25 1650k
publish mac 1.5 30 23 25 1650k

python -I "$ROOT/tools/posters.py" "$TMP" "$OUT"
ls -la "$OUT" "$SHARE"
