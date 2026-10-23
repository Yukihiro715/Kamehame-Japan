import { permanentRedirect } from "next/navigation";
import { OFUKURO_FOUNDING } from "@/lib/ofukuro-dinner";

// The founding-guest page was built here as an unlisted preview and published
// on 2026-10-23 at its public address; anyone holding the old link lands there.
export default function OfukuroFoundingGuestsRedirect() {
  permanentRedirect(OFUKURO_FOUNDING.path);
}
