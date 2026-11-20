import type { Metadata } from "next";
import SupplierLandingPage from "@/components/suppliers/page";

export const metadata: Metadata = {
  title: "体験事業者様へ｜インバウンド集客の新たな選択肢｜KAMEHAME JAPAN",
  description: "ホテル・旅行会社の紹介から、検索・AI・SNSまで。日本の体験に、新しい集客経路を。掲載無料・日本語登録で、多言語掲載と問い合わせ・予約調整をカメハメがサポートします。",
  alternates: { canonical: "https://kamehame-japan.com/partners-lp/" },
  openGraph: {
    title: "インバウンド集客の、新たな選択肢。｜KAMEHAME JAPAN",
    description: "ホテル・旅行会社の紹介から、検索・AI・SNSまで。あなたの体験と、世界の旅行者をつなぎます。",
    url: "https://kamehame-japan.com/partners-lp/", locale: "ja_JP",
    images: [{ url: "/images/suppliers/tea-yotsuya-guests.jpg", alt: "茶道を楽しむ訪日旅行者" }],
  },
};

export default function Page() { return <SupplierLandingPage />; }
