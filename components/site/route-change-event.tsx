"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readAttribution } from "@/lib/attribution-client";
import { track } from "@/lib/analytics";

let lastPath: string | null = null;

/** vinext navigates with a pushState it captured before any tag loaded, so
 *  GTM and the Meta Pixel never see client-side page changes. Tell GTM here —
 *  on every change of page, not on the first load (All Pages covers that). */
export function RouteChangeEvent() {
  const path = usePathname();
  useEffect(() => {
    readAttribution();
    if (lastPath !== null && lastPath !== path) track("route_change", { page_path: path });
    lastPath = path;
  }, [path]);
  return null;
}
