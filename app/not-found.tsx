import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

/** Shown for any address that no longer exists — including the pages of
 *  experiences that were withdrawn (lib/catalog.ts PLACEHOLDERS_PUBLISHED). */
export default function NotFound() {
  return (
    <main className="subpage not-found" lang="en">
      <SiteHeader variant="solid" lang="en" />
      <section className="not-found-body">
        <p className="eyebrow"><span /> 404</p>
        <h1>That page is not here.</h1>
        <p>The address may have changed, or the experience it pointed to is no longer offered. Everything we currently host is listed below.</p>
        <div className="not-found-links">
          <Link className="chip" href="/en/experiences/">Experiences <ArrowRight size={13} /></Link>
          <Link className="chip" href="/en/journal/">Journal <ArrowRight size={13} /></Link>
          <Link className="chip" href="/en/contact/">Contact <ArrowRight size={13} /></Link>
          <Link className="chip" href="/">Home <ArrowRight size={13} /></Link>
        </div>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
