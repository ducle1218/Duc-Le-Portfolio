import {suggestField,scanForm,fillForm} from './application-autofill.mjs';
import {scanAnsweredFields} from './answer-memory.mjs';
import {attachResume} from './resume-attachment.mjs';
import {reviewAnswers} from './memory-panel.mjs';
// Runs in Chrome's isolated world, only in a tab started by Application Studio.
if(!globalThis.__ducApplicationHelper){
 globalThis.__ducApplicationHelper=true;
 let entry,host,root,review,timer,observer,debounce,lastSignature='',remembering=false,filling=false;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const stop=()=>{clearTimeout(timer);clearTimeout(debounce);observer?.disconnect();host?.remove();entry=null;review=null;};
 function mount(next){
  stop();entry=next;remembering=false;lastSignature='';if(entry.expiresAt<=Date.now()||location.origin!==entry.origin)return;
  host=el('div');host.style.cssText='position:fixed;bottom:20px;right:20px;z-index:2147483647;';root=host.attachShadow({mode:'closed'});
  const style=el('style');style.textContent=`:host{all:initial}*{box-sizing:border-box}.panel{width:350px;max-width:calc(100vw - 32px);color:#f1f0ed;background:#151719;border:1px solid #62686c;border-radius:16px;box-shadow:0 12px 50px #0006;font:14px/1.5 system-ui;padding:18px}header{display:flex;align-items:center;gap:8px}header strong{flex:1}button{font:inherit;cursor:pointer;border:1px solid #555d62;background:#252a2e;color:inherit;border-radius:7px;padding:8px 12px}button:hover{background:#363e44}button:focus-visible{outline:2px solid #a9d5ed}button:disabled{opacity:.5;cursor:default}small{display:block;color:#b8bfc4}p{margin:10px 0}h3{font-size:15px;margin:12px 0 0}.answers{max-height:240px;overflow:auto;margin:12px 0}.answer{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #383e42}.answer span{overflow-wrap:anywhere}input{accent-color:#c4dbea}footer{display:flex;gap:8px}.fill{background:#edf1f3;color:#151719} [hidden]{display:none!important}`;
  const panel=el('section');panel.className='panel';panel.setAttribute('aria-label','Application Helper');
  const header=el('header'),title=el('strong','Application Helper'),minimize=el('button','−'),close=el('button','×');minimize.setAttribute('aria-label','Collapse application helper');close.setAttribute('aria-label','End application helper');header.append(title,minimize,close);
  const content=el('div'),job=el('h3',entry.job.title),company=el('small',entry.job.company),status=el('p');status.setAttribute('role','status');const list=el('div');list.className='answers';const footer=el('footer'),scan=el('button','Scan form'),fill=el('button','Fill selected');fill.className='fill';fill.hidden=true;footer.append(scan,fill);
  const remember=el('button','Remember my answers'),memoryArea=el('div');memoryArea.className='answers';memoryArea.hidden=true;const memoryNote=el('small','Saved answers stay in this extension, even after clearing browser cache.');
  style.textContent+=' .memory-row{padding:12px 0;border-bottom:1px solid #444}.memory-row label{display:block}textarea,select{font:inherit;width:100%;margin:6px 0;background:#202528;color:#f1f0ed;border:1px solid #62686c;border-radius:4px;padding:7px}';
  content.append(job,company,status,list,footer,remember,memoryArea,memoryNote,el('small','Review answers and PDF. You submit on the employer’s form.'));panel.append(header,content);root.append(style,panel);document.documentElement.append(host);
  remember.onclick=()=>{remembering=true;memoryArea.hidden=false;list.hidden=footer.hidden=true;const found=scanAnsweredFields();reviewAnswers(memoryArea,{origin:found.origin,context:entry.job.company.trim().toLowerCase(),candidates:found.candidates,onSave:async items=>{const result=await chrome.runtime.sendMessage({type:'memory-save',items});if(!result.ok)throw new Error(result.error);entry.memory=result.items;remembering=false;memoryArea.hidden=true;list.hidden=footer.hidden=false;scanNow();status.textContent=items.length+' answers saved for future applications. Review them whenever they are suggested.';},onCancel:()=>{remembering=false;memoryArea.hidden=true;list.hidden=footer.hidden=false;scanNow();}});};
  minimize.onclick=()=>{content.hidden=!content.hidden;minimize.textContent=content.hidden?'+':'−';minimize.setAttribute('aria-label',content.hidden?'Expand application helper':'Collapse application helper');};
  close.onclick=()=>{stop();chrome.runtime.sendMessage({type:'stop-handoff'}).catch(()=>{});};
  function scanNow(automatic=false){
   if(!entry||Date.now()>=entry.expiresAt){stop();return;}if(remembering||filling)return;
   const found=scanForm(),signature=JSON.stringify([found.url,found.fields]);if(automatic&&signature===lastSignature)return;lastSignature=signature;
   review={url:found.url,createdAt:Date.now(),fields:found.fields.flatMap(f=>{const answer=suggestField(f,entry.profile,entry.memory||[],location.origin,entry.job.company.trim().toLowerCase());return answer?[{...f,...answer}]:[];})};
   list.replaceChildren();for(const [i,f] of review.fields.entries()){const label=el('label');label.className='answer';const check=el('input');check.type='checkbox';check.checked=!f.requiresReview;check.value=String(i);const text=el('span',f.label);text.append(el('small',f.display));if(f.reason)text.append(el('small',f.reason+' · '+f.sourceQuestion));label.append(check,text);list.append(label);}
   if(entry.resume){const label=el('label');label.className='answer';const check=el('input');check.type='checkbox';check.checked=true;check.value='resume';const text=el('span','Attach tailored resume');text.append(el('small',entry.resume.name));label.append(check,text);list.append(label);}fill.hidden=!review.fields.length&&!entry.resume;
   status.textContent=review.fields.length?`${review.fields.length} suggested answers. Review and uncheck any you don’t want to fill.`:'Open the employer’s application form or sign in. Supported empty fields will appear here.';
   if(found.embeddedForms)status.textContent+=' Embedded forms may need opening directly and scanning with the extension button.';
  }
  scan.onclick=()=>scanNow();fill.onclick=async()=>{
   if(filling)return;if(!review||Date.now()-review.createdAt>120000){scanNow();status.textContent='Suggestions refreshed. Review them again before filling.';return;}
   const checked=[...list.querySelectorAll('input:checked')],fields=checked.filter(c=>c.value!=='resume').map(c=>review.fields[Number(c.value)]),withResume=checked.some(c=>c.value==='resume');
   if(!fields.length&&!withResume){status.textContent='Select an answer or the tailored PDF.';return;}
   filling=true;fill.disabled=scan.disabled=remember.disabled=true;
   try{const result=await fillForm({url:review.url,fields});const upload=withResume&&entry?.resume?await attachResume({url:review.url,resume:entry.resume}):null;list.replaceChildren();fill.hidden=true;review=null;status.textContent=result.changed?'The page changed. Scan again.':`${result.filled} answers filled; ${result.skipped} skipped. ${upload?.message||''} Nothing was submitted.`;lastSignature=JSON.stringify([location.href,scanForm().fields]);}
   catch{status.textContent='Some controls need manual entry. Check the form and scan again.';}
   finally{filling=false;fill.disabled=scan.disabled=remember.disabled=false;}
  };
  scanNow();observer=new MutationObserver(()=>{clearTimeout(debounce);debounce=setTimeout(()=>scanNow(true),700);});observer.observe(document.body||document.documentElement,{childList:true,subtree:true});
  timer=setTimeout(()=>{stop();chrome.runtime.sendMessage({type:'stop-handoff'}).catch(()=>{});},Math.max(0,entry.expiresAt-Date.now()));
 }
 chrome.runtime.onMessage.addListener((message,sender)=>{if(sender.id===chrome.runtime.id&&message?.type==='application-handoff')mount(message.entry);});
}
