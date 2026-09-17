import Link from "next/link";
import { ArrowDownRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "@/components/site/brand";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { catalogFor, TOURS_PUBLISHED } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";

export function SiteHeader({ variant = "overlay", lang = "en" }: { variant?: "overlay" | "solid"; lang?: Lang }) {
  const T = t(lang);
  // Cities appear once they have something bookable in them.
  const { cities } = catalogFor(lang);
  const navigation: [string, string][] = [
    ...cities.map((c) => [c.title, `/${lang}/${c.slug}/`] as [string, string]),
    [T.navExperiences, `/${lang}/experiences/`],
    ...(TOURS_PUBLISHED ? [[T.navTours, `/${lang}/tours/`] as [string, string]] : []),
    [T.navApproach, `/${lang}/about/`],
  ];
  return (
    <header className={`site-header ${variant === "solid" ? "solid" : ""}`}>
      <Brand lang={lang} />
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navigation.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
      </nav>
      <div className="header-tools">
        <LanguageSwitcher lang={lang} />
        <Button asChild className="header-cta"><Link href={`/${lang}/experiences/`}>{T.findExperience}</Link></Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="menu-button" size="icon" variant="outline" aria-label="Open menu"><Menu size={20} /></Button>
          </SheetTrigger>
          <SheetContent className="mobile-menu">
            <SheetTitle><Brand lang={lang} /></SheetTitle>
            <nav aria-label="Mobile navigation">
              {navigation.map(([label, href]) => <Link key={label} href={href}>{label}<ArrowDownRight size={18} /></Link>)}
            </nav>
            <p>{T.langNote}</p>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
