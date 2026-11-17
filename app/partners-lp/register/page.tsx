import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "体験情報の登録 | KAMEHAME JAPAN", robots: { index: false, follow: false, noarchive: true }, alternates: { canonical: "https://kamehame-japan.com/partners-lp/register/" } };
import { ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/site/brand';
import { SupplierForm } from '@/components/suppliers/supplier-form';
export default function RegistrationPage() {
  return <main className="sp-page kh-registration" lang="ja"><header className="sp-header"><Brand lang="ja"/><Link className="kh-back-link" href="/partners-lp/"><ArrowLeft size={15}/>募集ページへ</Link></header><section className="sp-wrap kh-register-content"><div className="kh-register-heading"><p className="sp-eyebrow">EXPERIENCE REGISTRATION</p><h1>あなたの体験を、<br/>教えてください。</h1><p>ご相談後、担当者からご案内した事業者様向けの登録フォームです。<br/>体験内容・受入条件・貴社へのお支払額の希望を、日本語でご入力ください。</p></div><SupplierForm/></section><footer className="sp-footer"><div className="sp-wrap"><p>KAMEHAME JAPAN ／ 株式会社プロセント</p><a href="https://kamehame-japan.com/ja/privacy/">プライバシーポリシー</a></div></footer></main>;
}
