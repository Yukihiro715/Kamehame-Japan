"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Whether the chosen-model club rental option (lib/golf-club-rental.ts) is offered on this
 *  page. Off everywhere by default; the unlisted preview page turns it on while the owner
 *  reviews it. Client components (the form, the options panel, the sticky bar) read it here;
 *  the server-rendered section takes the same flag as a prop. */
const Ctx = createContext(false);

export function ClubRentalProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <Ctx.Provider value={enabled}>{children}</Ctx.Provider>;
}

export const useClubRental = () => useContext(Ctx);
