// "Çocuk Odası" -> "cocuk-odasi" (MQTT topic'lerinde güvenle kullanılır)
const TR = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u' };

export function slugify(text) {
  return String(text)
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (ch) => TR[ch])
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
