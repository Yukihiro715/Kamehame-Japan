/** Official referral material contains only public catalogue content and the site's referral URL. */
export type OfficialBrochureLanguage = 'ja' | 'en';
export interface OfficialBrochureExperience {
  slug: string; title: string; area: string; img: string; tagline: string;
  duration: string; group: string; highlights: string[]; price: string; priceNote: string;
}
export interface OfficialBrochureInput {
  lang: OfficialBrochureLanguage; experience: string | null; items: OfficialBrochureExperience[];
  referralUrl: string; demo: boolean; issuedOn: string;
}
export interface OfficialBrochureCatalog {
  experiences: Record<OfficialBrochureLanguage, {slug:string;title:string}[]>;
}
