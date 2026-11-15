export async function makeResumeAttachment(output,jobUrl,name){
 jobUrl=new URL(jobUrl).href;
 const bytes=new Uint8Array(output);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
 return validateResumeAttachment({name,jobUrl,base64:btoa(binary),sha256},jobUrl);
}
export function validateResumeAttachment(value,jobUrl){
 if(!value||value.jobUrl!==jobUrl||!/^https:\/\//.test(jobUrl)||typeof value.base64!=='string'||value.base64.length>2_000_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(value.base64)||!/^[a-f0-9]{64}$/.test(value.sha256||''))throw new Error('The tailored resume does not match this job. Prepare it again in Studio.');
 const data=atob(value.base64);if(!data.startsWith('%PDF-')||data.length<100)throw new Error('Prepare a valid tailored PDF first.');
 const name=String(value.name||'').replace(/[^a-zA-Z0-9_. -]/g,'_').slice(0,160);if(!name.toLowerCase().endsWith('.pdf'))throw new Error('The resume must be a PDF.');
 return {name,jobUrl,base64:value.base64,sha256:value.sha256};
}
// Injected independently. Only one unambiguous, empty resume/CV file input is eligible.
export async function attachResume({url,resume}){
 if(location.href!==url)return {attached:false,message:'The page changed. Scan again before attaching.'};
 const text=e=>(e?.innerText||e?.textContent||'').trim();
 const label=e=>[...(e.labels||[])].map(text).join(' ')||e.getAttribute('aria-label')||(e.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>text(document.getElementById(id))).join(' ')||e.name||e.id||'';
 const candidates=[...document.querySelectorAll('input[type="file"]')].filter(e=>{
  if(e.disabled||e.multiple)return false;
  const nearby=e.closest('fieldset')||e.closest('[role="group"]')||e.parentElement?.parentElement;
  const words=label(e)+' '+text(nearby).slice(0,500);
  return /\b(resume|résumé|cv|curriculum vitae)\b/i.test(words)&&!/cover letter|transcript|passport|photo|certificate/i.test(words);
 });
 if(candidates.length!==1)return {attached:false,message:'No single supported resume upload found. Use the PDF download to attach it manually.'};
 const input=candidates[0];if(input.files?.length)return {attached:false,message:'A file is already selected; it was left unchanged.'};
 const accept=(input.accept||'').toLowerCase().split(',').map(s=>s.trim());if(input.accept&&!accept.some(s=>['.pdf','application/pdf','application/*','*/*'].includes(s)))return {attached:false,message:'This upload does not accept PDF. Attach a supported format manually.'};
 if(!resume||typeof resume.base64!=='string'||resume.base64.length>2_000_000)return {attached:false,message:'Start this job from Studio with its tailored PDF first.'};
 const bytes=Uint8Array.from(atob(resume.base64),c=>c.charCodeAt(0));const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(digest!==resume.sha256||String.fromCharCode(...bytes.subarray(0,5))!=='%PDF-')return {attached:false,message:'Resume verification failed. Prepare it again in Studio.'};
 if(location.href!==url||!input.isConnected||input.files?.length||input.disabled)return {attached:false,message:'The upload changed; no file was replaced.'};
 try{const transfer=new DataTransfer();transfer.items.add(new File([bytes],resume.name,{type:'application/pdf'}));input.files=transfer.files;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return {attached:true,message:resume.name+' attached. Check the employer’s upload status before continuing.'};}catch{return {attached:false,message:'This uploader needs a manual file selection. Download the tailored PDF from Studio.'};}
}
