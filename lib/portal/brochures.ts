import { catalogFor } from "@/lib/catalog";
import { listPrice } from "@/lib/pricing";
import { randomId, type SqlDb } from "@/lib/referral/db";
import { bad, notFound } from "./util";
import type { BrochureBrand, BrochurePrice, BrochureExperience } from "./brochure-types";

function text(value: unknown, max: number, required = false) {
  if (typeof value !== "string" || value.trim().length > max || /[\x00-\x1f\x7f]/.test(value) || (required && !value.trim())) throw bad("brochure_invalid", "入力内容・文字数をご確認ください / Please check the entered values and lengths.");
  return value.trim();
}
export function validateBrand(input: Record<string, unknown>): BrochureBrand {
  const brand = { companyName: text(input.companyName, 80, true), accentColor: text(input.accentColor, 7), contactEmail: text(input.contactEmail, 120), contactPhone: text(input.contactPhone, 40), contactUrl: text(input.contactUrl, 240), logoDataUrl: input.logoDataUrl === null ? null : text(input.logoDataUrl, 280000) };
  if (!/^#[\da-f]{6}$/i.test(brand.accentColor)) throw bad("brochure_color", "カラーを選択してください / Choose a color.");
  if (brand.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.contactEmail)) throw bad("brochure_email", "メールアドレスをご確認ください / Check the email address.");
  if (brand.contactUrl) {
    let url: URL; try { url = new URL(brand.contactUrl); } catch { throw bad("brochure_url", "https:// から始まるURLを入力してください / Enter an HTTPS URL."); }
    if (url.protocol !== "https:" || url.username || url.password) throw bad("brochure_url", "https:// から始まるURLを入力してください / Enter an HTTPS URL.");
  }
  if (brand.logoDataUrl) {
    if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(brand.logoDataUrl)) throw bad("brochure_logo", "ロゴを再選択してください / Select the logo again.");
    let bytes: string; try { bytes = atob(brand.logoDataUrl.split(',')[1]); } catch { throw bad("brochure_logo"); }
    const u32 = (offset: number) => Array.from(bytes.slice(offset, offset + 4)).reduce((n, c) => n * 256 + c.charCodeAt(0), 0);
    if (!bytes.startsWith('\x89PNG\r\n\x1a\n') || bytes.slice(12,16) !== 'IHDR' || bytes.length < 45 || u32(16) < 1 || u32(20) < 1 || u32(16) > 1200 || u32(20) > 1200) throw bad("brochure_logo", "ロゴを再選択してください / Select the logo again.");
  }
  return brand;
}
export function brochureExperiences() {
  const forLang = (lang: "ja" | "en"): BrochureExperience[] => catalogFor(lang).experiences.filter(x => x.status === "live").map(x => {
    const price = listPrice(x, lang);
    return { slug: x.slug, img: x.img, title: x.title, tagline: x.tagline, area: x.area, duration: x.duration, group: x.group, highlights: x.whatYoullDo.slice(0,3), basePrice: price.price, priceUnit: price.unit };
  });
  return { ja: forLang('ja'), en: forLang('en') };
}
export function validatePrice(input: Record<string, unknown>): { slug: string; value: BrochurePrice } {
  const slug = text(input.slug, 120, true);
  if (!catalogFor('ja').experiences.some(x => x.slug === slug && x.status === 'live')) throw notFound();
  if (input.priceJpy !== null && (typeof input.priceJpy !== 'number' || !Number.isSafeInteger(input.priceJpy) || input.priceJpy < 1 || input.priceJpy > 100000000)) throw bad('brochure_price', '案内価格は1〜100,000,000円の整数で入力してください / Enter a whole-yen price from 1 to 100,000,000.');
  if (input.priceUnit !== 'person' && input.priceUnit !== 'group') throw bad('brochure_unit');
  return { slug, value: { priceJpy: input.priceJpy as number | null, priceUnit: input.priceUnit, priceNote: text(input.priceNote, 180) } };
}
export async function readBrochureConfig(db: SqlDb, hotelId: string) {
  const hotel = await db.first<{ name: string }>('SELECT name FROM hotels WHERE id=?', [hotelId]);
  if (!hotel) throw notFound();
  const brand = await db.first<BrochureBrand>(`SELECT company_name AS companyName,logo_data_url AS logoDataUrl,accent_color AS accentColor,contact_email AS contactEmail,contact_phone AS contactPhone,contact_url AS contactUrl FROM partner_brochure_brands WHERE hotel_id=?`, [hotelId]);
  const rows = await db.all<BrochurePrice & { slug: string }>(`SELECT experience_slug AS slug,price_jpy AS priceJpy,price_unit AS priceUnit,price_note AS priceNote FROM partner_brochure_prices WHERE hotel_id=?`, [hotelId]);
  return { brand: brand ?? { companyName: hotel.name, logoDataUrl: null, accentColor: '#b74908', contactEmail: '', contactPhone: '', contactUrl: '' }, prices: Object.fromEntries(rows.map(({ slug, ...price }) => [slug, price])) };
}
export async function saveBrochureBrand(db: SqlDb, hotelId: string, input: Record<string, unknown>, by: string) {
  const v = validateBrand(input), at = new Date().toISOString();
  await db.batch([
    { sql: `INSERT INTO partner_brochure_brands VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(hotel_id) DO UPDATE SET company_name=excluded.company_name,logo_data_url=excluded.logo_data_url,accent_color=excluded.accent_color,contact_email=excluded.contact_email,contact_phone=excluded.contact_phone,contact_url=excluded.contact_url,updated_at=excluded.updated_at,updated_by=excluded.updated_by`, params: [hotelId,v.companyName,v.logoDataUrl,v.accentColor,v.contactEmail,v.contactPhone,v.contactUrl,at,by] },
    { sql: `INSERT INTO audit_logs(id,at,actor,action,target_type,target_id,after_json) VALUES (?,?,?,'partner.brochure.brand','hotel',?,?)`, params: [randomId(),at,by,hotelId,JSON.stringify({ companyName:v.companyName,accentColor:v.accentColor,hasLogo:!!v.logoDataUrl })] },
  ]);
  return v;
}
export async function saveBrochurePrice(db: SqlDb, hotelId: string, input: Record<string, unknown>, by: string) {
  const { slug, value: v } = validatePrice(input), at = new Date().toISOString();
  await db.batch([
    { sql: `INSERT INTO partner_brochure_prices VALUES (?,?,?,?,?,?,?) ON CONFLICT(hotel_id,experience_slug) DO UPDATE SET price_jpy=excluded.price_jpy,price_unit=excluded.price_unit,price_note=excluded.price_note,updated_at=excluded.updated_at,updated_by=excluded.updated_by`, params: [hotelId,slug,v.priceJpy,v.priceUnit,v.priceNote,at,by] },
    { sql: `INSERT INTO audit_logs(id,at,actor,action,target_type,target_id,after_json) VALUES (?,?,?,'partner.brochure.price','hotel',?,?)`, params: [randomId(),at,by,hotelId,JSON.stringify({slug,...v})] },
  ]);
  return v;
}
