#!/usr/bin/env bash
# Fragmandan site videolarını üretir: ana döngü ve galeri klipleri (yavaş çekim).
# Çalıştırma: bash tools/build_media.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
V="$ROOT/assets-src/trailer/trailer-partial.mp4"
OUT="$ROOT/public/media"
TMP="$ROOT/assets-src/trailer/tmp"
mkdir -p "$OUT" "$TMP"

GRADE="eq=contrast=1.04:saturation=0.94"

# Ana döngü: fragmandaki sahne sınırlarından kesilmiş 12 saniye
cuts=("8.00 1.00" "9.05 1.08" "16.60 1.30" "20.20 2.00" "29.20 1.45" "31.00 1.10" "34.00 1.20" "37.40 1.00" "40.05 0.88" "14.25 0.80")
inputs=(); filt=""; i=0
for c in "${cuts[@]}"; do
  inputs+=(-ss "${c% *}" -t "${c#* }" -i "$V"); filt+="[$i:v]"; i=$((i+1))
done
ffmpeg -v error -y "${inputs[@]}" -filter_complex "${filt}concat=n=$i:v=1:a=0,fps=30,scale=1280:720:flags=lanczos,$GRADE,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset veryslow -crf 28 -profile:v high -movflags +faststart -an "$OUT/reel.mp4"
ffmpeg -v error -y -ss 1.55 -i "$OUT/reel.mp4" -frames:v 1 "$TMP/reel.png"

# Galeri klipleri: kaynak 60 fps olduğu için yarı hızda akıcı kalır
clip() { # ad, başlangıç, süre, hız çarpanı
  ffmpeg -v error -y -ss "$2" -t "$3" -i "$V" -vf "setpts=$4*PTS,fps=30,scale=1280:720:flags=lanczos,$GRADE,format=yuv420p" \
    -c:v libx264 -preset veryslow -crf 29 -profile:v high -movflags +faststart -an "$OUT/$1.mp4"
  ffmpeg -v error -y -ss 0.05 -i "$OUT/$1.mp4" -frames:v 1 "$TMP/$1.png"
}
clip tempo 34.00 1.85 2
clip tank 32.17 1.78 2
clip heli 9.05 1.08 2.4
clip strike 20.20 2.00 2

# İki sahne: maç bandı ve kuşbakışı
ffmpeg -v error -y -ss 38.87 -t 0.70 -i "$V" -ss 40.05 -t 0.88 -i "$V" -filter_complex \
  "[0:v][1:v]concat=n=2:v=1:a=0,setpts=1.8*PTS,fps=30,scale=1280:720:flags=lanczos,$GRADE,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset veryslow -crf 29 -profile:v high -movflags +faststart -an "$OUT/mac.mp4"
ffmpeg -v error -y -ss 1.5 -i "$OUT/mac.mp4" -frames:v 1 "$TMP/mac.png"

python -I "$ROOT/tools/posters.py" "$TMP" "$OUT"
ls -la "$OUT"
