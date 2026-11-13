import type { BrochureBrand, BrochureContactOptions } from '@/lib/portal/brochure-types';
import { brochureContacts, brochureQrCaption, brochureQrUrl, brochureContactError } from '@/lib/portal/brochure-contact';
import { Field, Notice } from '../ui';

export function BrochureContactSettings({brand,en,disabled,onChange}:{brand:BrochureBrand;en:boolean;disabled:boolean;onChange:(brand:BrochureBrand)=>void}) {
  const c=brochureContacts(brand);
  const edit=<K extends keyof BrochureContactOptions>(key:K,value:BrochureContactOptions[K])=>onChange({...brand,contactOptions:{...c,[key]:value}});
  const error=brochureContactError(brand),destination=brochureQrUrl(brand);
  return <fieldset className="pt-brochure-contacts" disabled={disabled}>
    <legend>{en?'Contact details on all PDFs':'全PDF共通の連絡先設定'}</legend>
    <p className="pt-small pt-muted">{en?'Choose what appears on printed brochures. A website is optional. Saved settings apply to every experience.':'印刷したパンフレットに掲載する項目を選べます。ホームページは必須ではありません。保存した設定はすべての体験に共通で使います。'}</p>
    {(['Email','Phone','Url'] as const).map((kind,i)=>{
      const field=`contact${kind}` as 'contactEmail'|'contactPhone'|'contactUrl';
      const show=`show${kind}` as 'showEmail'|'showPhone'|'showUrl';
      return <div key={kind}>
        <Field label={(en?['Contact email','Contact phone','Website URL']:['お問い合わせメール','お問い合わせ電話','ホームページURL'])[i]}>
          <input type={['email','tel','url'][i]} value={brand[field]} maxLength={[120,40,240][i]} placeholder={kind==='Url'?'https://…':undefined} onChange={e=>onChange({...brand,[field]:e.target.value})}/>
        </Field>
        <label className="pt-brochure-check"><input type="checkbox" checked={c[show]} onChange={e=>edit(show,e.target.checked)}/>{en?'Print this contact detail':'この連絡先をPDFに掲載する'}</label>
      </div>;
    })}
    <label className="pt-brochure-check"><input type="checkbox" checked={c.qrEnabled} onChange={e=>edit('qrEnabled',e.target.checked)}/><strong>{en?'Include a QR code':'QRコードを掲載する'}</strong></label>
    {c.qrEnabled&&<div className="pt-brochure-qr-fields">
      <Field label={en?'QR destination type':'QRのリンク先の種類'}><select value={c.qrType} onChange={e=>onChange({...brand,contactOptions:{...c,qrType:e.target.value as BrochureContactOptions['qrType'],qrUrl:''}})}>
        <option value="website">{en?'Website':'ホームページ'}</option><option value="line">LINE</option><option value="whatsapp">WhatsApp</option><option value="other">{en?'Other':'その他'}</option>
      </select></Field>
      {c.qrType==='whatsapp'?<Field label={en?'WhatsApp number with country code':'WhatsAppの電話番号（国番号付き）'} hint={en?'For Japan, remove the first 0 and start with +81.':'日本の番号は先頭の0を除き、+81から入力してください。'}><input type="tel" value={c.whatsappPhone} maxLength={40} placeholder="+81 90 1234 5678" onChange={e=>edit('whatsappPhone',e.target.value)}/></Field>
        :<Field label={en?'QR destination URL':'QRのリンク先URL'} hint={c.qrType==='website'?(en?'Leave blank to use the website URL above.':'空欄の場合は上のホームページURLを使います。'):c.qrType==='line'?(en?'Paste the LINE sharing URL (line.me or lin.ee).':'LINEの共有URL（line.me または lin.ee）を貼り付けてください。'):undefined}><input type="url" value={c.qrUrl} maxLength={240} placeholder={c.qrType==='line'?'https://lin.ee/…':'https://…'} onChange={e=>edit('qrUrl',e.target.value)}/></Field>}
      <Field label="QRの説明文（日本語）" hint="空欄ならリンク先の種類に応じた説明文を使います。"><input value={c.captionJa} maxLength={60} placeholder={brochureQrCaption({...brand,contactOptions:{...c,captionJa:''}},'ja')} onChange={e=>edit('captionJa',e.target.value)}/></Field>
      <Field label="QR caption (English)" hint="Leave blank to use the default caption. Custom captions are not automatically translated."><input value={c.captionEn} maxLength={60} placeholder={brochureQrCaption({...brand,contactOptions:{...c,captionEn:''}},'en')} onChange={e=>edit('captionEn',e.target.value)}/></Field>
      {destination&&<p className="pt-small pt-muted">{en?'QR destination':'QRの接続先'}: <span className="pt-brochure-destination">{destination}</span></p>}
      <p className="pt-small pt-muted">{en?'For printed copies, also include an email or phone number so guests can contact you without scanning.':'印刷で渡す場合は、QRを読み取れない方のためにメールや電話も掲載できます。'}</p>
    </div>}
    {error&&<Notice tone="bad">{error}</Notice>}
  </fieldset>;
}
