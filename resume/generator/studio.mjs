import {composePdf} from './engine.mjs';
import {validateJob,filename} from './job-core.mjs';
import {selectProjects,projectSlots,projectFooterRect} from './project-selection.mjs';
const $=id=>document.getElementById(id);
const status=text=>{$('status').textContent=text;};
const loaded=new Map();
function script(url){if(!loaded.has(url))loaded.set(url,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>{loaded.delete(url);s.remove();reject(new Error('A required library could not load. Check your connection and try again.'));};document.head.append(s);}));return loaded.get(url);}
const assetCache=new Map();
async function bytes(file){if(!assetCache.has(file)){const r=await fetch('./assets/'+file);if(!r.ok)throw new Error('Resume assets could not load. Refresh and try again.');assetCache.set(file,await r.arrayBuffer());}return assetCache.get(file);}
let busy=false,pdfURL=null;
let currentJob=null;
function setBusy(value){busy=value;$('generate').disabled=value;$('images').disabled=value;$('description').disabled=value;}
export function lockStudio(value){if(value&&busy)throw new Error('Finish the current screenshot or resume first.');setBusy(value);}
function clearResult(){if(pdfURL)URL.revokeObjectURL(pdfURL);pdfURL=null;$('download').removeAttribute('href');$('result').hidden=true;$('empty').hidden=false;$('count').textContent='Original template';}
$('description').addEventListener('input',clearResult);
function themeLabel(){$('theme').textContent=document.documentElement.classList.contains('dark')?'Light mode ☀':'Dark mode ☾';}
$('theme').onclick=()=>{const dark=document.documentElement.classList.toggle('dark');try{localStorage.setItem('portfolio-theme-v2',dark?'dark':'light');}catch{}themeLabel();};themeLabel();
async function recognize(files){
  if(busy)return;
  const images=[...files];
  if(!images.length)return;
  if(images.length>5||images.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>12*1024*1024)){status('Choose up to 5 PNG, JPG or WebP images, each under 12 MB.');return;}
  setBusy(true);clearResult();let worker;
  try{
    status('Loading screenshot reader… The first use may take a moment.');
    await script('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js');
    worker=await Tesseract.createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text')status('Reading screenshot… '+Math.round(m.progress*100)+'%');}});
    const extracted=[];
    for(const file of images){
      const bitmap=await createImageBitmap(file);
      if(bitmap.width*bitmap.height>24000000){bitmap.close();throw new Error('This image is too large. Crop it to the job description and try again.');}
      bitmap.close();
      const result=await worker.recognize(file);extracted.push(result.data.text.trim());
    }
    const combined=[$('description').value.trim(),...extracted].filter(Boolean).join('\n\n');
    if(combined.length>65000)throw new Error('The extracted text is too long. Use fewer screenshots.');
    if(!extracted.some(Boolean))throw new Error('No readable text found. Try a clearer screenshot or paste the text.');
    $('description').value=combined;
    $('thumbnails').replaceChildren();
    for(const file of images){const img=document.createElement('img');const url=URL.createObjectURL(file);img.src=url;img.alt='Job screenshot';img.onload=()=>URL.revokeObjectURL(url);$('thumbnails').append(img);}
    status('Screenshot text added. Check the wording above, then tailor your resume.');
  }catch(e){status(e.message||'Screenshot reading failed. Try again or paste the text.');}
  finally{await worker?.terminate();setBusy(false);$('images').value='';}
}
$('images').onchange=e=>recognize(e.target.files);
document.addEventListener('paste',e=>{const files=[...(e.clipboardData?.files||[])];if(files.length){e.preventDefault();recognize(files);}});
for(const name of ['dragover','dragleave','drop'])$('drop').addEventListener(name,e=>{e.preventDefault();$('drop').classList.toggle('drag',name==='dragover');if(name==='drop')recognize(e.dataTransfer.files);});
$('generate').onclick=()=>generateResume();
export async function buildResume(text){
  const [manifest,feed]=await Promise.all([fetch('./assets/manifest.json').then(r=>{if(!r.ok)throw new Error('Resume template unavailable.');return r.json();}),fetch('../../data/portfolio.json').then(r=>{if(!r.ok)throw new Error('Portfolio data unavailable.');return r.json();}),script('./pdf-lib.min.js')]);
  if(manifest.baselineSha256!==feed.resume.sha256)throw new Error('Your resume was updated. The generator template needs to be refreshed before exporting.');
  const library=await fetch('./assets/projects.json').then(r=>{if(!r.ok)throw new Error('Project library unavailable.');return r.json();});
  if(library.baselineSha256!==feed.resume.sha256)throw new Error('The project template needs updating for your new resume.');
  const selected=projectSlots(selectProjects(library,text));
  const claims=new Map(feed.projects.flatMap(p=>p.claims.map(c=>[c.id,c])));
  for(const slot of selected)for(const source of slot.choice?.sources||[]){const c=claims.get(source.id);if(!c||['text','owner','state'].some(k=>c[k]!==source[k]))throw new Error('A source project changed. The generator wording needs review before exporting.');}
  const output=await composePdf(PDFLib.PDFDocument,selected,bytes);
  return {output,selected,edits:selected.filter(s=>s.choice),baselineSha256:manifest.baselineSha256};
}
async function generateResume(){
  if(busy)return;
  const text=$('description').value.trim();
  if(text.length<40){status('Add the job responsibilities and qualifications, at least 40 characters.');return;}
  if(/^https?:\/\/\S+$/.test(text)){status('Paste the job description from that link, or add a screenshot.');return;}
  setBusy(true);clearResult();status('Matching your experience and preparing the PDF…');
  try{
    const {output,selected,edits}=await buildResume(text);
    pdfURL=URL.createObjectURL(new Blob([output],{type:'application/pdf'}));$('download').href=pdfURL;
    $('download').download=currentJob?filename(currentJob):'Duc_Le_Tailored_Resume.pdf';
    $('count').textContent=selected.length+' selected projects';$('summary').textContent='Why these projects?';$('changes').replaceChildren();
    for(const edit of edits){const article=document.createElement('article');for(const [label,text,cls] of [[edit.title,edit.reason,'reason'],['RESUME WORDING',edit.choice.text,'after']]){const small=document.createElement('small');small.textContent=label;const p=document.createElement('p');p.textContent=text;p.className=cls;article.append(small,p);}$('changes').append(article);}
    $('empty').hidden=true;$('result').hidden=false;
    status('Your PDF is ready. Review the selected projects and wording before using it.');
    try{
      const loadImage=file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Preview image unavailable'));image.src='./assets/'+file;});
      const images=await Promise.all(['project-base.png',...selected.map(s=>s.file.replace('.pdf','.png')),'project-footer.png'].map(loadImage));
      const canvas=$('preview');canvas.width=1224;canvas.height=1584;const context=canvas.getContext('2d');context.drawImage(images[0],0,0);
      selected.forEach((slot,i)=>{const [x0,y0]=slot.rect;context.drawImage(images[i+1],Math.floor(x0*2),Math.floor(y0*2));});
      const [footerX,footerY]=projectFooterRect(selected);context.drawImage(images.at(-1),footerX*2,footerY*2);
    }catch(error){console.error('Resume preview failed',error);status('PDF ready to download. The on-page preview could not load.');}
  }catch(e){clearResult();status(e.message||'Could not generate the resume. Please try again.');}
  finally{setBusy(false);}
}
export async function previewJob(job){
 if(busy)throw new Error('Finish the current screenshot or resume first.');
 currentJob=validateJob(job);clearResult();$('description').value=currentJob.description;
 $('job-details').hidden=false;$('job-title').textContent=currentJob.title;$('job-company').textContent=[currentJob.company,currentJob.location].filter(Boolean).join(' · ');$('job-source').href=currentJob.url;
 document.querySelector('.workspace').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 await generateResume();
}
$('new-draft').onclick=()=>{if(busy)return;currentJob=null;clearResult();$('job-details').hidden=true;$('description').value='';$('thumbnails').replaceChildren();status('Ready for a new job description.');};
