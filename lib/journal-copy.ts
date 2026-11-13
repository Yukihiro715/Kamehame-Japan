import type { Lang } from "@/lib/i18n";

/** Shared article interface copy; article text stays in its locale data. */
export const JOURNAL_COPY: Record<Lang, {
  by: string; planningNotes: string; contents: string; plan: string;
  related: string; editorial: string; about: string; planningGuides: string;
  all: string; note: string; imageCaption: string;
}> = {
  en: {
    by: "By", planningNotes: "Golf planning notes", contents: "In this article", plan: "Plan your round",
    related: "Continue planning", editorial: "Editorial note", about: "About this guide",
    planningGuides: "Before you book: golf planning guides", all: "Browse all articles",
    note: "Prepared from KAMEHAME JAPAN booking correspondence and operating guidance, with AI assistance. Guest cases are anonymised; enquiries and proposals are not presented as completed trips. Published 13 November 2026. Prices and arrangements remain subject to the specific booking.",
    imageCaption: "Illustrative image from our golf and equipment pages; not a photograph of the guest case described. The course, equipment, vehicle and conditions for your booking may differ.",
  },
  ja: {
    by: "執筆：", planningNotes: "ゴルフ旅行の手配ガイド", contents: "この記事の目次", plan: "ゴルフの計画を相談する",
    related: "あわせて読みたい記事", editorial: "編集について", about: "この記事について",
    planningGuides: "予約前に読みたいゴルフ手配ガイド", all: "すべての記事を見る",
    note: "KAMEHAME JAPANの予約に関するやりとりと運用方針をもとに、AIの補助を用いて作成しています。お客様の事例は匿名化し、お問い合わせや提案を実施済みの旅行としては紹介していません。2026年11月13日公開。料金・手配内容は個別のご予約条件によります。",
    imageCaption: "当サイトのゴルフ・用具紹介に使用しているイメージ写真です。本文の相談事例を撮影したものではありません。実際のコース・用具・車両・利用条件はご予約により異なります。",
  },
  es: {
    by: "Por", planningNotes: "Guía para organizar una jornada de golf", contents: "En este artículo", plan: "Planifica tu jornada de golf",
    related: "Sigue preparando tu viaje", editorial: "Nota editorial", about: "Acerca de esta guía",
    planningGuides: "Antes de reservar: guías para jugar al golf", all: "Ver todos los artículos",
    note: "Elaborado a partir de las consultas de reserva y las pautas operativas de KAMEHAME JAPAN, con ayuda de IA. Los casos de clientes están anonimizados; las consultas y propuestas no se presentan como viajes realizados. Publicado el 13 de noviembre de 2026. Los precios y los servicios dependen de las condiciones de cada reserva.",
    imageCaption: "Imagen ilustrativa de nuestras páginas de golf y equipamiento; no corresponde al caso de cliente descrito. El campo, el equipo, el vehículo y las condiciones de tu reserva pueden ser distintos.",
  },
  fr: {
    by: "Par", planningNotes: "Conseils pour organiser votre golf", contents: "Dans cet article", plan: "Préparez votre journée de golf",
    related: "Pour poursuivre vos préparatifs", editorial: "Note éditoriale", about: "À propos de ce guide",
    planningGuides: "Avant de réserver : nos guides pour jouer au golf", all: "Voir tous les articles",
    note: "Rédigé à partir des échanges de réservation et des consignes opérationnelles de KAMEHAME JAPAN, avec l’aide de l’IA. Les cas clients sont anonymisés ; les demandes et les propositions ne sont pas présentées comme des voyages effectués. Publié le 13 novembre 2026. Les tarifs et les prestations restent soumis aux conditions de chaque réservation.",
    imageCaption: "Image d’illustration issue de nos pages consacrées au golf et au matériel ; elle ne représente pas le cas client décrit. Le parcours, le matériel, le véhicule et les conditions de votre réservation peuvent différer.",
  },
  "zh-tw": {
    by: "撰文：", planningNotes: "高爾夫行程規劃指南", contents: "文章目錄", plan: "規劃您的高爾夫行程",
    related: "延伸閱讀", editorial: "編輯說明", about: "關於本指南",
    planningGuides: "預訂前必讀：高爾夫行程規劃指南", all: "查看所有文章",
    note: "本指南以 KAMEHAME JAPAN 的預訂往來與作業方針為基礎，並使用 AI 輔助撰寫。旅客案例均已匿名處理；詢問與報價提案不會被描述為已成行的旅程。發布日期為 2026 年 11 月 13 日。價格與安排以各筆預訂的實際條件為準。",
    imageCaption: "圖片取自本站的高爾夫及球具介紹頁面，僅供示意，並非文中旅客案例的實拍照片。實際球場、球具、車輛與使用條件可能依預訂而有所不同。",
  },
};
