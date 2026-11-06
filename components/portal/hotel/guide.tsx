"use client";

import { t } from "../i18n";
import { Card } from "../ui";

/** How the portal works, in the partner's language: the screens, the flow and the commission rules. */
export function HotelGuide() {
  const G = t().guide;
  return (
    <>
      <p className="pt-note-box">{G.lead}</p>
      {G.sections.map(([h, body]) => <Card key={h} title={h}><p style={{ margin: 0, fontSize: 14, lineHeight: 1.8 }}>{body}</p></Card>)}
    </>
  );
}
