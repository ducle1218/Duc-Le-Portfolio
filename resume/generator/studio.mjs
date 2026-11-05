import {selectWording,composePdf} from './engine.mjs';
const $=id=>document.getElementById(id);
const status=text=>{$('status').textContent=text;};
const loaded=new Map();
function script(url){if(!loaded.has(url))loaded.set(url,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>{loaded.delete(url);s.remove();reject(new Error('A required library could not load. Check your connection and try again.'));};document.head.append(s);}));return loaded.get(url);}
async function bytes(file){const r=await fetch('./assets/'+file);if(!r.ok)throw new Error('Resume assets could not load. Refresh and try again.');return r.arrayBuffer();}
let busy=false,pdfURL=null;
function setBusy(value){busy=value;$('generate').disabled=value;$('images').disabled=value;$('description').disabled=value;}
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
$('generate').onclick=async()=>{
  if(busy)return;
  const text=$('description').value.trim();
  if(text.length<40){status('Add the job responsibilities and qualifications, at least 40 characters.');return;}
  if(/^https?:\/\/\S+$/.test(text)){status('Paste the job description from that link, or add a screenshot.');return;}
  setBusy(true);clearResult();status('Matching your experience and preparing the PDF…');
  try{
    const [manifest,feed]=await Promise.all([fetch('./assets/manifest.json').then(r=>{if(!r.ok)throw new Error('Resume template unavailable.');return r.json();}),fetch('../../data/portfolio.json').then(r=>r.json()),script('./pdf-lib.min.js')]);
    if(manifest.baselineSha256!==feed.resume.sha256)throw new Error('Your resume was updated. The generator template needs to be refreshed before exporting.');
    const selected=selectWording(manifest,text);
    const claims=new Map(feed.projects.flatMap(p=>p.claims.map(c=>[c.id,c])));
    for(const slot of selected)for(const source of slot.choice?.sources||[]){const c=claims.get(source.id);if(!c||['text','owner','state'].some(k=>c[k]!==source[k]))throw new Error('A source project changed. The generator wording needs review before exporting.');}
    const output=await composePdf(PDFLib.PDFDocument,selected,bytes);
    pdfURL=URL.createObjectURL(new Blob([output],{type:'application/pdf'}));$('download').href=pdfURL;
    const edits=selected.filter(s=>s.choice);
    $('count').textContent=edits.length+' wording updates';$('summary').textContent='Review '+edits.length+' wording changes';$('changes').replaceChildren();
    for(const edit of edits){const article=document.createElement('article');for(const [label,text,cls] of [['ORIGINAL',edit.before,'before'],['TAILORED',edit.choice.text,'after']]){const small=document.createElement('small');small.textContent=label;const p=document.createElement('p');p.textContent=text;p.className=cls;article.append(small,p);}$('changes').append(article);}
    $('empty').hidden=true;$('result').hidden=false;
    status(edits.length?'Your PDF is ready. Review the changes before using it.':'No supported wording changes matched. Your original wording is ready to download.');
    try{
      const pdfjs=await import('../../src/vendor/pdfjs/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc='../../src/vendor/pdfjs/pdf.worker.min.mjs';
      const root=new URL('../../src/vendor/pdfjs/',location.href).href;
      const task=pdfjs.getDocument({data:output.slice(),wasmUrl:root+'wasm/',cMapUrl:root+'cmaps/',cMapPacked:true,standardFontDataUrl:root+'standard_fonts/'});const pdf=await task.promise;const page=await pdf.getPage(1);const viewport=page.getViewport({scale:1.5});const canvas=$('preview');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;await task.destroy();
    }catch(error){console.error('Resume preview failed',error);status('PDF ready to download. The on-page preview could not load.');}
  }catch(e){clearResult();status(e.message||'Could not generate the resume. Please try again.');}
  finally{setBusy(false);}
};
