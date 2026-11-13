export interface BrochureBrand {
  companyName: string; logoDataUrl: string | null; accentColor: string;
  contactEmail: string; contactPhone: string; contactUrl: string;
}
export interface BrochurePrice { priceJpy: number | null; priceUnit: "person" | "group"; priceNote: string }
export interface BrochureExperience {
  slug: string; img: string; title: string; area: string; duration: string; group: string;
  tagline: string; highlights: string[]; basePrice: string; priceUnit: "person" | "group";
}
export interface BrochureConfig {
  brand: BrochureBrand; prices: Record<string, BrochurePrice>;
  experiences: { ja: BrochureExperience[]; en: BrochureExperience[] };
  canManage: boolean; canPrice: boolean; demo: boolean;
}
