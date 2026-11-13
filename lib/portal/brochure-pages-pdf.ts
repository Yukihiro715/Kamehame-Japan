export interface BrochurePdfPage {
  jpeg: Uint8Array; width: number; height: number;
  widthPt: number; heightPt: number;
  link?: {url:string;rect:[number,number,number,number]};
}
/** Multi-page PDF with explicit page dimensions and one optional referral annotation per side. */
export function brochurePagesPdf(pages:BrochurePdfPage[]):Uint8Array {
  if(!pages.length)throw new Error('No brochure pages');
  const encode=(s:string)=>new TextEncoder().encode(s),chunks:Uint8Array[]=[],offsets=[0];let length=0;
  const add=(b:Uint8Array)=>{chunks.push(b);length+=b.length;};
  const obj=(id:number,parts:(string|Uint8Array)[])=>{offsets[id]=length;add(encode(`${id} 0 obj\n`));parts.forEach(p=>add(typeof p==='string'?encode(p):p));add(encode('\nendobj\n'));};
  add(encode('%PDF-1.4\n'));
  obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2,[`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+4*i} 0 R`).join(' ')}] /Count ${pages.length} >>`]);
  pages.forEach((p,i)=>{
    const id=3+i*4,url=p.link?.url.startsWith('https://')?encodeURI(p.link.url).replace(/[\\()]/g,'\\$&'):'';
    obj(id,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.widthPt} ${p.heightPt}] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R${url?` /Annots [${id+3} 0 R]`:''} >>`]);
    obj(id+1,[`<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,p.jpeg,'\nendstream']);
    const content=`q ${p.widthPt} 0 0 ${p.heightPt} 0 0 cm /Im0 Do Q`;
    obj(id+2,[`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
    obj(id+3,[url?`<< /Type /Annot /Subtype /Link /Rect [${p.link!.rect.join(' ')}] /Border [0 0 0] /A << /S /URI /URI (${url}) >> >>`:'null']);
  });
  const start=length;add(encode(`xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`));
  const pdf=new Uint8Array(length);let cursor=0;for(const part of chunks){pdf.set(part,cursor);cursor+=part.length;}return pdf;
}
