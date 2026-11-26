"use client";
import Link from "next/link";
import { HotelMaterials } from "./materials";
import { usePortal } from "../shell";
export function PartnerTools() {
  const { hotel, me, lang } = usePortal();
  return (
    <>
      {(hotel?.partner_type === "agency" || me.demo) && (
        <Link className="pt-btn pt-btn-primary" href="/partner/brochures/">
          {lang === "en"
            ? "Create an agency PDF"
            : "自社価格・料金非掲載のPDFを作成"}
        </Link>
      )}
      {hotel?.features?.refer && <HotelMaterials />}
    </>
  );
}
