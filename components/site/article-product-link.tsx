"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

export function ArticleProductLink({ href, article, product, children }: { href: string; article: string; product: string; children: ReactNode }) {
  return <Link className="article-cta-card" href={href} onClick={() => track("article_product_click", { article_slug: article, experience_slug: product })}>{children}</Link>;
}
