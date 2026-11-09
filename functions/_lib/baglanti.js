export function guvenliBaglanti(deger) {
  if (typeof deger !== 'string' || /[\u0000-\u001f\u007f\s]/u.test(deger)) return false;
  if (deger === '') return true;
  if (deger.startsWith('/') && !deger.startsWith('//') && !deger.startsWith('/\\')) return true;
  try {
    const url = new URL(deger);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}
