/** Public wording shared by the form and the server-side consent record. */
export const SUPPLIER_POLICY_VERSION = "2026-11-15-v2";
export const SUPPLIER_PRICE_NOTE = "卸価格（貴社受取額）は、一般販売価格の25％引きを目安にご設定ください。当社は集客・予約対応を行い、ホテル・ガイド等への紹介料（販売価格の5〜10％程度）を負担します。販売価格は当社で設定し、一般販売価格を上回る場合があります。紹介料を卸価格から別途差し引くことはありません。";
export const SUPPLIER_SCOPE_NOTE = "対応対象はKAMEHAME JAPAN経由のお問い合わせ・予約です。受入可否の確認、体験の提供、当日の安全管理は事業者様にお願いします。通訳・送迎や特別な対応は個別に条件を確認します。";
export const SUPPLIER_STATUSES = { pending: "受付済み", reviewing: "審査中", needs_info: "追加確認", approved: "掲載準備可", rejected: "見送り" } as const;
export type SupplierStatus = keyof typeof SUPPLIER_STATUSES;
