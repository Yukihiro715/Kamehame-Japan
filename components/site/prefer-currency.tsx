"use client";

import { useEffect } from "react";
import { preferCurrency } from "@/lib/currency-store";
import type { Currency } from "@/lib/currency";

/** Renders nothing; after hydration it asks the store to show this currency unless the
 *  visitor has already chosen one. The server HTML stays in yen, as everywhere. */
export function PreferCurrency({ currency }: { currency: Currency }) {
  useEffect(() => { preferCurrency(currency); }, [currency]);
  return null;
}
