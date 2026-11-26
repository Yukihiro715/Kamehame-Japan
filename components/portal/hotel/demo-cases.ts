export interface LocalDemoCase {
  id: string;
  publicRef: string;
  experienceSlug: string;
  experienceTitle: string;
  experienceTitleEn: string;
  customerName: string;
  preferredDate: string;
  guests: string;
  timePref: string;
  updatedAt: string;
}
const key = "kh-demo-cases";
export function localDemoCases(): LocalDemoCase[] {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "[]") as LocalDemoCase[];
  } catch {
    return [];
  }
}
export function addLocalDemoCase(item: LocalDemoCase) {
  sessionStorage.setItem(
    key,
    JSON.stringify([item, ...localDemoCases()].slice(0, 50)),
  );
}
