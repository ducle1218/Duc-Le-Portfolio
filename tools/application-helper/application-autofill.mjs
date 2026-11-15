import {memoryMatch} from './answer-memory.mjs?v=20261115.2';
import {commonQuestion} from './common-questions.mjs?v=20261115.2';
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function suggestField(field,profile,memory=[],origin='',context=''){
 if(!profile?.confirmed)return null;
 const label=normalize(field.label).replace(/\b(required|optional)\b/g,'').trim();
 const common=commonQuestion(label);
 if(!label||(!common&&/password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(label)))return null;
 if(!['text','email','tel','url','textarea','select-one','combobox','number'].includes(field.type)||field.filled||field.disabled)return null;
 const patterns={firstName:/^(legal )?(first|given) name$/,lastName:/^(legal )?(last name|family name|surname)$/,fullName:/^(legal |full |legal full )?name$/,email:/^(personal |primary |contact )?e ?mail( address)?$/,phone:/^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/,city:/^(current |home )?city$/,state:/^(current |home )?(state|province|state province)$/,postalCode:/^(zip|postal|zip postal)( code)?$/,country:/^(current |home )?country( of residence)?$/,school:/^(current )?(university|school|college|school university|university college)( name)?$/,major:/^(major|field of study|academic major)$/,graduationYear:/^(expected |anticipated )graduation year$/,portfolio:/^(portfolio|personal website|portfolio website)( url| link)?$/,linkedin:/^linkedin( profile)?( url| link)?$/,github:/^github( profile)?( url| link)?$/};
 const key=Object.keys(patterns).find(k=>patterns[k].test(label));const custom=(profile.answers||[]).filter(a=>normalize(a.question)===label||(common&&commonQuestion(a.question)?.question===common.question));
 const remembered=!key&&!custom.length?memoryMatch(field.label,memory,origin,context):null;
 const value=key==='fullName'?[profile.values.firstName,profile.values.lastName].filter(Boolean).join(' '):key?profile.values[key]:custom.length&&new Set(custom.map(a=>a.answer.trim())).size===1?custom[0].answer:remembered?.value;
 if(!value||(field.maxLength>0&&value.length>field.maxLength))return null;
 const review={reason:common?.review?'Confirm this answer for this application':remembered?.reason,sourceQuestion:common?.review?common.question:remembered?.question,requiresReview:!!common?.review};
 if(field.type==='select-one'||field.type==='combobox'){
  const aliases=key==='state'&&normalize(value)==='new jersey'?['new jersey','nj']:key==='country'&&['us','usa','united states'].includes(normalize(value))?['united states','united states of america','us','usa']:[normalize(value)];
  if(field.type==='combobox')return {value,display:value,aliases,...review};
  const matches=(field.options||[]).filter(o=>!o.disabled&&(aliases.includes(normalize(o.label))||aliases.includes(normalize(o.value))));if(matches.length!==1)return null;return {value:matches[0].value,display:matches[0].label,...review};
 }
 return {value,display:value,...review};
}

// Self-contained so Chrome can inject this function without module dependencies.
export function formBridge({action='scan',url,fields=[]}={}){
 const text=e=>(e?.innerText||e?.textContent||'').trim();
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const custom=e=>e.tagName!=='SELECT'&&(e.getAttribute('role')==='combobox'||e.getAttribute('aria-haspopup')==='listbox');
 const type=e=>custom(e)?'combobox':e.type||e.tagName.toLowerCase();
 const selectedValue=e=>{let parent=e.parentElement;for(let n=0;n<3&&parent;n++,parent=parent.parentElement){if(parent.querySelectorAll('[role="combobox"],[aria-haspopup="listbox"]').length>1)break;const selected=parent.querySelector('[class*="singleValue"],[data-selected-value]');if(selected)return selected;}return null;};
 const elements=()=>[...document.querySelectorAll('input,select,textarea,[role="combobox"],[aria-haspopup="listbox"]')].filter(e=>!e.parentElement?.closest('[role="combobox"],[aria-haspopup="listbox"]'));
 const labelText=e=>{if(!e)return '';const copy=e.cloneNode(true);for(const control of copy.querySelectorAll('input,select,textarea,button,[role="combobox"],[role="listbox"]'))control.remove();return text(copy);};
 const label=e=>(e.getAttribute('aria-label')||(e.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>labelText(document.getElementById(id))).join(' ')||[...(e.labels||[])].map(labelText).join(' ')||labelText(e.closest('label'))||e.placeholder||'').trim().slice(0,250);
 const empty=e=>{if(!custom(e))return !e.value||(e.tagName==='SELECT'&&e.selectedIndex===0&&/select|choose|please/i.test(text(e.options[0])));const selected=selectedValue(e);if(selected&&text(selected))return false;const value=(e.value||text(e)).trim();return !value||/^(select|choose|please select|select an? option|select one)(\.\.\.)?$/i.test(value);};
 const disabled=e=>e.disabled||e.readOnly&&!custom(e)||e.getAttribute('aria-disabled')==='true';
 const snapshot=(e,index)=>({index,label:label(e),type:type(e),name:e.name||'',id:e.id||'',maxLength:e.maxLength,filled:!empty(e),disabled:!!disabled(e),options:e.tagName==='SELECT'?[...e.options].map(o=>({value:o.value,label:text(o),disabled:o.disabled})):undefined});
 if(action==='scan'){const all=elements();return {url:location.href,fields:all.map(snapshot).filter(f=>visible(all[f.index])).slice(0,150),embeddedForms:document.querySelectorAll('iframe').length};}
 return (async()=>{
  if(location.href!==url)return {filled:0,skipped:fields.length,changed:true};
  // Capture element identities once: opening a menu must not shift later targets.
  const all=elements(),targets=fields.map(f=>[f,all[f.index]]);let filled=0,skipped=0;
  for(const [f,e] of targets){
   if(location.href!==url){skipped++;continue;}
   if(!e||!e.isConnected||!empty(e)||disabled(e)||!visible(e)||label(e)!==f.label||type(e)!==f.type||(e.name||'')!==f.name||(e.id||'')!==f.id){skipped++;continue;}
   if(custom(e)){
    const before=new Set([...document.querySelectorAll('[role="listbox"]')].filter(visible));
    e.focus();e.click();if(e.getAttribute('aria-expanded')!=='true')e.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));
    let boxes=[];
    for(let attempt=0;attempt<10;attempt++){
     if(location.href!==url||!e.isConnected)break;
     const ids=((e.getAttribute('aria-controls')||'')+' '+(e.getAttribute('aria-owns')||'')).trim().split(/\s+/).filter(Boolean);
     boxes=ids.map(id=>document.getElementById(id)).filter(n=>n&&visible(n));
     if(!boxes.length)boxes=[...document.querySelectorAll('[role="listbox"]')].filter(n=>visible(n)&&!before.has(n));
     if(boxes.length===1&&boxes[0].querySelector('[role="option"]'))break;
     await new Promise(r=>setTimeout(r,80));
    }
    const aliases=f.aliases||[norm(f.value)],options=boxes.length===1?[...boxes[0].querySelectorAll('[role="option"]')].filter(o=>visible(o)&&o.getAttribute('aria-disabled')!=='true'&&aliases.includes(norm(text(o)))):[];
    if(location.href!==url||!e.isConnected||!empty(e)||options.length!==1){e.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));skipped++;continue;}
    options[0].click();await new Promise(r=>setTimeout(r,60));
    const selected=selectedValue(e);
    const displayed=norm(e.value||text(selected)||text(e));
    if(aliases.includes(displayed)||(options[0].isConnected&&options[0].getAttribute('aria-selected')==='true'))filled++;else skipped++;
   }else{
    if(e.tagName==='SELECT'&&![...e.options].some(o=>o.value===f.value&&!o.disabled&&text(o)===f.display)){skipped++;continue;}
    const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(e,f.value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));filled++;
   }
  }
  return {filled,skipped};
 })();
}
export const scanForm=()=>formBridge({action:'scan'});
export const fillForm=options=>formBridge({...options,action:'fill'});
