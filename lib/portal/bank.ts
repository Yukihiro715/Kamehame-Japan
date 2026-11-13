import { randomId, type SqlDb } from "@/lib/referral/db";
import { ApiError, bad, notFound, str } from "./util";
export interface BankDetails { bank: string; branch: string; type: string; number: string; holder: string }
async function bankKey(secret?: string) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) throw new ApiError(503,"bank_unavailable","支払い先の設定は準備中です。運営にお問い合わせください。");
  return crypto.subtle.importKey("raw",Uint8Array.from(secret.match(/../g)!, x => parseInt(x,16)),"AES-GCM",false,["encrypt","decrypt"]);
}
export async function saveBank(db: SqlDb, profileId: string, input: Record<string,unknown>, by: string, secret?: string) {
  const value: BankDetails = { bank:str(input.bank,100),branch:str(input.branch,100),type:str(input.type,10),number:str(input.number,10),holder:str(input.holder,120) };
  if (!value.bank || !value.branch || !value.holder || !["ordinary","current"].includes(value.type) || !/^\d{7}$/.test(value.number)) throw bad("bad_bank","銀行・支店・口座種別・7桁の口座番号・口座名義を入力してください。");
  const key = await bankKey(secret), iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:new TextEncoder().encode(profileId)},key,new TextEncoder().encode(JSON.stringify(value))));
  const encoded = JSON.stringify({v:1,iv:Array.from(iv),data:Array.from(ciphertext)});
  const masked = `${value.bank} ${value.branch} ${value.type === "ordinary" ? "普通" : "当座"} ***${value.number.slice(-4)}`;
  const at = new Date().toISOString();
  if (!await db.first(`SELECT id FROM settlement_profiles WHERE id=?`,[profileId])) throw notFound();
  await db.batch([
    {sql:`UPDATE settlement_profiles SET bank_details_enc=?,bank_details_masked=?,payee_name=?,version=version+1,updated_at=? WHERE id=?`,params:[encoded,masked,value.holder,at,profileId]},
    {sql:`INSERT INTO audit_logs (id,at,actor,action,target_type,target_id,after_json) VALUES (?,?,?,'settlement.bank.update','settlement_profile',?,?)`,params:[randomId(),at,by,profileId,JSON.stringify({masked})]},
  ]);
  return {masked,holder:value.holder};
}
export async function readBank(db: SqlDb, profileId: string, secret?: string): Promise<BankDetails | null> {
  const row = await db.first<{bank_details_enc:string|null}>(`SELECT bank_details_enc FROM settlement_profiles WHERE id=?`,[profileId]);
  if (!row) throw notFound();
  if (!row.bank_details_enc) return null;
  const key = await bankKey(secret), data = JSON.parse(row.bank_details_enc);
  const decoded = await crypto.subtle.decrypt({name:"AES-GCM",iv:new Uint8Array(data.iv),additionalData:new TextEncoder().encode(profileId)},key,new Uint8Array(data.data));
  return JSON.parse(new TextDecoder().decode(decoded));
}
