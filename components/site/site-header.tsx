"use client";

import Link from "next/link";
import { ArrowDownRight, Globe2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Brand } from "@/components/site/brand";

const navigation = [
  ["Tokyo", "/en/tokyo/"],
  ["Kyoto", "/en/kyoto/"],
  ["Experiences", "/en/experiences/"],
  ["Private tours", "/en/tours/"],
  ["Our approach", "/#approach"],
] as const;

export function SiteHeader({ variant = "overlay" }: { variant?: "overlay" | "solid" }) {
  return (
    <header className={`site-header ${variant === "solid" ? "solid" : ""}`}>
      <Brand />
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navigation.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
      </nav>
      <div className="header-tools">
        <button className="language-button" type="button" aria-label="Language: English"><Globe2 size={16} /> EN</button>
        <Button asChild className="header-cta"><Link href="/en/experiences/">Find an experience</Link></Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button className="menu-button" size="icon" variant="outline" aria-label="Open menu"><Menu size={20} /></Button>
          </SheetTrigger>
          <SheetContent className="mobile-menu">
            <SheetTitle><Brand /></SheetTitle>
            <nav aria-label="Mobile navigation">
              {navigation.map(([label, href]) => <Link key={label} href={href}>{label}<ArrowDownRight size={18} /></Link>)}
            </nav>
            <p>English · Français · Español · 繁體中文</p>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
