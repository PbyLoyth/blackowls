function kopyala(deger) {
  if (Array.isArray(deger)) return deger.map(kopyala);
  if (deger && typeof deger === 'object') return Object.fromEntries(Object.entries(deger).map(([k, v]) => [k, kopyala(v)]));
  return deger;
}

function turAyni(a, b) {
  if (Array.isArray(a)) return Array.isArray(b);
  if (a && typeof a === 'object') return b && typeof b === 'object' && !Array.isArray(b);
  return typeof a === typeof b;
}

export function birlestir(varsayilan, kayitli) {
  if (!varsayilan || typeof varsayilan !== 'object' || !kayitli || typeof kayitli !== 'object') return kopyala(varsayilan);
  const sonuc = {};
  for (const [anahtar, temel] of Object.entries(varsayilan)) {
    const gelen = kayitli[anahtar];
    sonuc[anahtar] = turAyni(temel, gelen)
      ? (temel && typeof temel === 'object' ? birlestir(temel, gelen) : gelen)
      : kopyala(temel);
  }
  return sonuc;
}

export function deger(nesne, yol) {
  return yol.split('.').reduce((mevcut, anahtar) => mevcut == null ? undefined : mevcut[anahtar], nesne);
}

export function degisenAlanlar(eski, yeni) {
  const yollar = [];
  function gez(a, b, yol) {
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      for (const anahtar of Object.keys(a)) gez(a[anahtar], b[anahtar], yol ? `${yol}.${anahtar}` : anahtar);
    } else if (JSON.stringify(a) !== JSON.stringify(b)) yollar.push(yol);
  }
  gez(eski, yeni, '');
  return yollar;
}
