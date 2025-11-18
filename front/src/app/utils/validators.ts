
export function emailOk(s: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s);
}

export function phoneOk(s: string): boolean {
  // dozvoljen +, 7-15 cifara ukupno
  const x = (s || '').replace(/[^\d+]/g, '');
  return /^\+?\d{7,15}$/.test(x);
}

export function passwordOk(pw: string): boolean {
  // 6–10; prvo slovo; ≥1 veliko; ≥3 mala; ≥1 cifra; ≥1 specijalni
  return /^(?=.{6,10}$)(?=[A-Za-z])(?=(?:.*[A-Z]){1,})(?=(?:.*[a-z]){3,})(?=(?:.*\d){1,})(?=(?:.*[^A-Za-z0-9]){1,}).*$/.test(pw || '');
}

export type CardBrand = 'visa' | 'mastercard' | 'diners' | 'unknown';

export function detectBrand(cc: string): CardBrand {
  const d = (cc || '').replace(/\D/g, '');
  // Diners: 300–303 + 12 = 15, 36 + 13 = 15, 38 + 13 = 15
  if (/^(?:30[0-3]\d{12}|36\d{13}|38\d{13})$/.test(d)) return 'diners';
  // MasterCard: 51–55 + 14 = 16 (bez 2221–2720 po zadatku)
  if (/^(?:5[1-5]\d{14})$/.test(d)) return 'mastercard';
  // Visa: tačno nabrojani prefiksi, ukupno 16 cifara
  if (/^(?:4539|4556|4916|4532|4929|4485|4716)\d{12}$/.test(d)) return 'visa';
  return 'unknown';
}

export function detectBrandPreview(cc: string): CardBrand {
  const d = (cc || '').replace(/\D/g, '');
  // Diners čim prepoznamo prefiks
  if (/^30[0-3]/.test(d) || /^36/.test(d) || /^38/.test(d)) return 'diners';
  // MasterCard čim prepoznamo 51–55
  if (/^5[1-5]/.test(d)) return 'mastercard';
  // Visa čim prepoznamo 4-cif. prefiks iz zadatka
  if (/^(?:4539|4556|4916|4532|4929|4485|4716)/.test(d)) return 'visa';
  return 'unknown';
}

export function isCardValidForProject(cc: string): boolean {
  return detectBrand(cc) !== 'unknown';
}

export function maskCard(cc: string): string {
  const d = (cc || '').replace(/\D/g, '');
  const last4 = d.slice(-4).padStart(4, '•');
  const masked = d.slice(0, -4).replace(/\d/g, '•') + last4;
  return masked.replace(/(.{4})/g, '$1 ').trim();
}

export function urlLike(s: string): boolean {
  // dozvoli http(s) ili lok putanju sa ekstenzijom
  return /^(https?:\/\/|\/).+\.(png|jpe?g|webp|avif)$/i.test((s || '').trim());
}

export function nonEmptyTrim(s: string): boolean {
  return !!(s && s.trim().length);
}

/**
 * Proverava da li broj kartice odgovara Visa, MasterCard ili Diners formatu.
 * @returns Tip kartice ili `null` ako nije validna.
 */
export function getCardType(num: string): 'visa' | 'mastercard' | 'diners' | null {
  const b = detectBrand(num);
  return b === 'unknown' ? null : b;
}
