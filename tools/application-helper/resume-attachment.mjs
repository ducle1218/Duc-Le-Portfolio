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
 const inputs=[...document.querySelectorAll('input[type="file"]')];
 const pageUpload=/upload (your |a |either )?(resume|résumé|cv)|resume upload|resume label|uploading your resume/i.test(text(document.body));
 const context=e=>{let node=e.parentElement,best=label(e);for(let n=0;n<6&&node&&node!==document.body;n++,node=node.parentElement){if(node.querySelectorAll('input[type="file"]').length>1)break;const words=text(node);if(words.length>3000)break;best+=' '+words;if(/\b(resume|résumé|cv|curriculum vitae)\b/i.test(best))break;}return best;};
 const candidates=inputs.filter(e=>{
  if(e.disabled||e.multiple)return false;
  const words=context(e);
  return (/\b(resume|résumé|cv|curriculum vitae)\b/i.test(words)||(inputs.length===1&&pageUpload))&&!/cover letter|transcript|passport|photo|certificate/i.test(words);
 });
 // Prefer the file input. Some uploaders expose only a drop target and create the file input on demand.
 const dropSelector='[ondrop],[data-dropzone],[data-automation-id*="drop" i],[data-bind*="drop:"],[class*="dropzone" i],[class*="drop-zone" i],[role="application"]';
 const resumeSection=e=>{for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const headings=[...p.querySelectorAll('h1,h2,h3,h4,legend,[role=heading]')];if(headings.length)return headings.length===1&&/^(?:resume|résumé|cv)(?:\s*\/\s*cv)?$/i.test(text(headings[0]))?p:null;}return null;};
 const isResumeZone=e=>/\bdrop\s+(?:your\s+|a\s+)?(?:resume|résumé|cv)\b/i.test(text(e))||(/drop files? here/i.test(text(e))&&!!resumeSection(e));
 const eligibleZone=e=>isResumeZone(e)&&!/cover letter|transcript|passport|photo|certificate/i.test(text(e))&&e.getClientRects().length;
 const zones=candidates.length?[]:[...document.querySelectorAll(dropSelector)].filter(eligibleZone);
 const containers=zones.filter(z=>!zones.some(other=>other!==z&&z.contains(other)));
 const zone=containers.length===1?containers[0]:null;
 if(candidates.length!==1&&!zone)return {attached:false,message:'No single supported resume upload found. Use the PDF download to attach it manually.'};
 const input=candidates[0],target=input||zone;
 if(zone&&(zone.querySelector('input[type=file], [aria-busy=true], [role=progressbar]')||/\.pdf\b|replace|remove|uploading/i.test(text(zone))))return {attached:false,message:'Review the existing résumé upload.'};
 if(input?.files?.length)return {attached:false,message:'A file is already selected; it was left unchanged.'};
 const accept=(input?.accept||'').toLowerCase().split(',').map(s=>s.trim());if(input?.accept&&!accept.some(s=>['.pdf','application/pdf','application/*','*/*'].includes(s)))return {attached:false,message:'This upload does not accept PDF. Attach a supported format manually.'};
 if(!resume||typeof resume.base64!=='string'||resume.base64.length>2_000_000)return {attached:false,message:'Start this job from Studio with its tailored PDF first.'};
 const bytes=Uint8Array.from(atob(resume.base64),c=>c.charCodeAt(0));const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(digest!==resume.sha256||String.fromCharCode(...bytes.subarray(0,5))!=='%PDF-')return {attached:false,message:'Resume verification failed. Prepare it again in Studio.'};
 const sizeText=(input?context(input):text(resumeSection(zone)||zone))+(inputs.length===1?' '+text(document.body):'');
 const limits=[...sizeText.matchAll(/(\d+(?:\.\d+)?)\s*(MB|KB)\s*(?:max|maximum)|(?:max(?:imum)?(?: file)? size(?: of)?|smaller than|up to)\s*:?\s*(\d+(?:\.\d+)?)\s*(MB|KB)/gi)].map(m=>Number(m[1]||m[3])*((m[2]||m[4]).toUpperCase()==='MB'?1_000_000:1000));
 if(limits.length&&bytes.length>Math.min(...limits))return {attached:false,message:'The tailored PDF exceeds this uploader’s file-size limit. Use a smaller PDF.'};
 if(location.href!==url||!target.isConnected||input?.files?.length||input?.disabled)return {attached:false,message:'The upload changed; no file was replaced.'};
 try{const transfer=new DataTransfer();transfer.items.add(new File([bytes],resume.name,{type:'application/pdf'}));if(zone){
   const holder=zone.parentElement||zone;
   for(const event of ['dragenter','dragover','drop'])zone.dispatchEvent(new DragEvent(event,{bubbles:true,cancelable:true,composed:true,dataTransfer:transfer}));
   for(let i=0;i<18;i++){if(text(holder).includes(resume.name)&&!/upload failed|upload error/i.test(text(holder)))return {attached:true,message:resume.name+' received by the résumé uploader.'};await new Promise(resolve=>setTimeout(resolve,100));}
   return {attached:false,message:'PDF dropped. Check the résumé uploader for confirmation.'};
  }
  input.files=transfer.files;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));if(!input.files?.length)return {attached:false,message:'The employer cleared the file. Check upload errors or attach the PDF manually.'};return {attached:true,message:resume.name+' attached. Check the employer’s upload status before continuing.'};}catch{return {attached:false,message:'This uploader needs a manual file selection. Download the tailored PDF from Studio.'};}
}
