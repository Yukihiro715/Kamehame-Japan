import type { BrochureBrand, BrochureContactOptions } from './brochure-types';

/** Preserve legacy website QRs; new companies with no URL start with QR off. */
export function brochureContacts(brand: BrochureBrand): BrochureContactOptions {
  return brand.contactOptions ?? { showEmail: true, showPhone: true, showUrl: true,
    qrEnabled: !!brand.contactUrl, qrType: 'website', qrUrl: '', whatsappPhone: '', captionJa: '', captionEn: '' };
}
export function httpsUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password && !/[\s\x00-\x1f\x7f]/.test(value); } catch { return false; }
}
export function whatsappUrl(phone: string): string {
  const cleaned = phone.replace(/[ ()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(cleaned) ? `https://wa.me/${cleaned.slice(1)}` : '';
}
export function brochureQrUrl(brand: BrochureBrand): string {
  const c = brochureContacts(brand);
  if (!c.qrEnabled) return '';
  if (c.qrType === 'whatsapp') return whatsappUrl(c.whatsappPhone);
  const url = c.qrUrl || (c.qrType === 'website' ? brand.contactUrl : '');
  if (!httpsUrl(url)) return '';
  if (c.qrType === 'line' && !['line.me', 'lin.ee'].some(host => new URL(url).hostname === host || new URL(url).hostname.endsWith(`.${host}`))) return '';
  return url;
}
export function brochureQrCaption(brand: BrochureBrand, lang: 'ja' | 'en'): string {
  const c = brochureContacts(brand), en = lang === 'en';
  return (en ? c.captionEn : c.captionJa) || {
    website: en ? 'Visit our website' : '詳しくは公式サイトへ',
    line: en ? 'Enquire on LINE' : 'LINEで予約・相談',
    whatsapp: en ? 'Enquire on WhatsApp' : 'WhatsAppでお問い合わせ',
    other: en ? 'Scan to enquire' : 'こちらからお問い合わせ',
  }[c.qrType];
}
export function visibleBrochureContacts(brand: BrochureBrand) {
  const c = brochureContacts(brand);
  return [
    { value: c.showEmail ? brand.contactEmail : '', url: `mailto:${brand.contactEmail}` },
    { value: c.showPhone ? brand.contactPhone : '', url: `tel:${brand.contactPhone.replace(/[ ()-]/g, '')}` },
    { value: c.showUrl ? brand.contactUrl : '', url: brand.contactUrl },
  ].filter(item => item.value);
}
export function brochureContactError(brand: BrochureBrand): string {
  const c = brochureContacts(brand);
  if (brand.contactUrl && !httpsUrl(brand.contactUrl) || c.qrUrl && !httpsUrl(c.qrUrl)) return 'https:// から始まるURLをご確認ください / Check the HTTPS URL.';
  if (brand.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.contactEmail)) return 'メールアドレスをご確認ください / Check the email address.';
  if (c.qrEnabled && !brochureQrUrl(brand)) return c.qrType === 'whatsapp'
    ? 'WhatsAppは国番号付きで入力してください（例：+81 90 1234 5678） / Include the country code, e.g. +81 90 1234 5678.'
    : c.qrType === 'line' ? 'LINEの共有URL（https://line.me/… または https://lin.ee/…）を入力してください / Enter a LINE sharing URL.'
      : 'QRのリンク先URLを入力してください / Enter the QR destination URL.';
  return '';
}
export function brochureBrandReady(brand: BrochureBrand): boolean {
  return !!brand.companyName.trim() && !brochureContactError(brand) && (visibleBrochureContacts(brand).length > 0 || !!brochureQrUrl(brand));
}
