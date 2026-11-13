export interface BrochureBrand {
  companyName: string; logoDataUrl: string | null; accentColor: string;
  contactEmail: string; contactPhone: string; contactUrl: string;
  contactOptions?: BrochureContactOptions;
}
export interface BrochureContactOptions {
  showEmail: boolean; showPhone: boolean; showUrl: boolean;
  qrEnabled: boolean; qrType: "website" | "line" | "whatsapp" | "other";
  qrUrl: string; whatsappPhone: string; captionJa: string; captionEn: string;
}
export interface BrochurePrice { priceJpy: number | null; priceUnit: "person" | "group"; priceMode: "fixed" | "inquiry" | "unset"; priceNote: string; priceNoteEn: string }
export interface BrochureExperience {
  slug: string; img: string; detailImg?: string; title: string; area: string; duration: string; group: string;
  tagline: string; highlights: string[]; basePrice: string; priceUnit: "person" | "group";
}
export interface BrochureConfig {
  brand: BrochureBrand; prices: Record<string, BrochurePrice>;
  experiences: { ja: BrochureExperience[]; en: BrochureExperience[] };
  canManage: boolean; canPrice: boolean; demo: boolean;
}

export function emptyBrochurePrice(priceUnit: "person" | "group"): BrochurePrice {
  return { priceJpy: null, priceUnit, priceMode: "unset", priceNote: "", priceNoteEn: "" };
}
export function brochurePriceReady(price: BrochurePrice): boolean {
  return price.priceMode === "inquiry" || (price.priceMode === "fixed" && Number.isSafeInteger(price.priceJpy) && price.priceJpy! >= 1 && price.priceJpy! <= 100000000);
}
export function sameBrochurePrice(a: BrochurePrice, b: BrochurePrice): boolean {
  return a.priceJpy===b.priceJpy && a.priceMode===b.priceMode && a.priceUnit===b.priceUnit && a.priceNote===b.priceNote && a.priceNoteEn===b.priceNoteEn;
}
