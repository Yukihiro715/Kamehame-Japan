"use client";

import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export function ConsultationForm() {
  const [complete, setComplete] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<{ id: string; content: string } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = new FormData(e.currentTarget);
    const payload = { kind: 'consult', company: data.get('company'), name: data.get('name'), email: data.get('email'), phone: data.get('phone'), title: data.get('title'), websiteUrl: data.get('websiteUrl'), message: data.get('message'), website: data.get('website'), consent: data.get('consent') === 'on' };
    const content = JSON.stringify(payload);
    if (!request.current || request.current.content !== content) request.current = { id: crypto.randomUUID(), content };
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/supplier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, requestId: request.current.id }), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.reference) throw new Error(response.status === 429 ? '送信が続いています。しばらく時間をおいてお試しください。' : '送信を確認できませんでした。入力内容を残したまま再送するか、hello@kamehame-japan.comへご連絡ください。');
      setComplete(result.reference);
      requestAnimationFrame(() => receiptRef.current?.focus());
    } catch (err) { setError(err instanceof Error && err.name === 'Error' ? err.message : '通信に時間がかかっています。入力内容は残っていますので、再送をお試しください。'); }
    finally { setBusy(false); }
  }
  if (complete) return <div className="kh-consult-receipt" ref={receiptRef} tabIndex={-1} role="status"><Check size={30}/><h3>ご相談を受け付けました。</h3><p>ご入力のメールアドレスへ受付メールをお送りしました。担当者が内容を確認し、あらためてメールでご連絡します。</p><p>掲載をご希望の場合は、そのやり取りの中で体験情報の登録フォームをご案内します。</p><p className="sp-help">受付番号：{complete}</p></div>;
  return <form className="kh-consult-form" onSubmit={submit}>
    <fieldset disabled={busy}><div className="sp-honey" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className="kh-consult-fields">
      <label className="sp-field"><span>会社・施設名 <small>必須</small></span><input name="company" autoComplete="organization" required maxLength={160} placeholder="例：○○工房"/></label>
      <label className="sp-field"><span>お名前 <small>必須</small></span><input name="name" autoComplete="name" required maxLength={120}/></label>
      <label className="sp-field kh-full"><span>メールアドレス <small>必須</small></span><input name="email" type="email" autoComplete="email" required maxLength={200}/></label>
      <label className="sp-field kh-full"><span>電話番号 <small>任意</small></span><input name="phone" type="tel" autoComplete="tel" maxLength={60} placeholder="例：03-1234-5678"/></label>
      <label className="sp-field kh-full"><span>体験名・サービス名 <small>必須</small></span><input name="title" required maxLength={160} placeholder="例：茶道体験、陶芸ワークショップ（仮称でも可）"/></label>
      <label className="sp-field kh-full"><span>公式サイト・紹介ページ <small>任意</small></span><input name="websiteUrl" type="url" placeholder="https://" maxLength={1000}/></label>
      <label className="sp-field kh-full"><span>ご相談内容 <small>必須</small></span><textarea name="message" required maxLength={3000} rows={4} placeholder="体験の内容や開催エリア、集客のお悩みなど。詳しい料金や資料は、まだ揃っていなくても大丈夫です。"/></label>
    </div>
    <label className="kh-consult-consent"><input name="consent" type="checkbox" required/><span><a href="https://kamehame-japan.com/ja/privacy/" target="_blank" rel="noreferrer">プライバシーポリシー</a>を確認し、ご相談への対応のための情報利用に同意します。</span></label>
    {error && <p className="sp-error" role="alert">{error}</p>}
    <button type="submit" className="sp-button">{busy ? "送信中…" : "相談を送信する"} <ArrowRight size={18}/></button>
  </fieldset></form>;
}
