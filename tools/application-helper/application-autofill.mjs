import {memoryMatch} from './answer-memory.mjs?v=20261115.4';
import {commonQuestion,backgroundAnswer} from './common-questions.mjs?v=20261115.4';
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function suggestField(field,profile,memory=[],origin='',context=''){
 if(!profile?.confirmed)return null;
 const label=normalize(field.label).replace(/\b(required|optional)\b/g,'').trim();
 const common=commonQuestion(label),background=backgroundAnswer(label,profile);
 if(!label||(!common&&!background&&/password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(label)))return null;
 if(!['text','email','tel','url','textarea','select-one','combobox','radio-group','number'].includes(field.type)||field.filled||field.disabled)return null;
 const patterns={firstName:/^(legal )?(first|given) name$/,lastName:/^(legal )?(last name|family name|surname)$/,fullName:/^(legal |full |legal full )?name$/,email:/^(personal |primary |contact )?e ?mail( address)?$/,phone:/^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/,city:/^(current |home )?city$/,state:/^(current |home )?(state|province|state province)$/,postalCode:/^(zip|postal|zip postal)( code)?$/,country:/^(current |home )?country( of residence)?$/,school:/^(current )?(university|school|college|school university|university college)( name)?$/,major:/^(major|field of study|academic major)$/,graduationYear:/^(expected |anticipated )graduation year$/,portfolio:/^(portfolio|personal website|portfolio website)( url| link)?$/,linkedin:/^linkedin( profile)?( url| link)?$/,github:/^github( profile)?( url| link)?$/};
 const key=Object.keys(patterns).find(k=>patterns[k].test(label));const custom=(profile.answers||[]).filter(a=>normalize(a.question)===label||(common&&commonQuestion(a.question)?.question===common.question));
 const remembered=!key?memoryMatch(field.label,memory,origin,context):null;
 const value=key==='fullName'?[profile.values.firstName,profile.values.lastName].filter(Boolean).join(' '):key?(profile.values[key]||background?.value):common?.question==='How did you hear about this position?'&&remembered?remembered.value:custom.length&&new Set(custom.map(a=>a.answer.trim())).size===1?custom[0].answer:background?.value||remembered?.value;
 if(!value||(field.maxLength>0&&value.length>field.maxLength))return null;
 const review={reason:background?'Based on your confirmed background':common?.review?'Confirm this answer for this application':remembered?.reason,sourceQuestion:background?background.sourceQuestion:common?.review?common.question:remembered?.question,requiresReview:!!common?.review||!!background};
 if(field.type==='select-one'||field.type==='combobox'||field.type==='radio-group'){
  const aliases=key==='state'&&normalize(value)==='new jersey'?['new jersey','nj']:key==='country'&&['us','usa','united states'].includes(normalize(value))?['united states','united states of america','us','usa']:common?.question==='Highest completed degree'&&normalize(value)==='high school diploma'?['high school diploma','high school diploma or equivalent','high school diploma ged','high school or equivalent']:[normalize(value)];
  if(field.type==='combobox')return {value,display:value,aliases,...review};
  const matches=(field.options||[]).filter(o=>!o.disabled&&(aliases.includes(normalize(o.label))||field.type!=='radio-group'&&aliases.includes(normalize(o.value))));if(matches.length!==1)return null;return {value:matches[0].value,display:matches[0].label,...review};
 }
 return {value,display:value,...review};
}

// Self-contained: the popup injects this same bridge for scan, remember and fill.
export function formBridge({action='scan',url,fields=[]}={}){
 const text=e=>(e?.innerText||e?.textContent||'').trim();
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const comboSelector='[role="combobox"],[aria-haspopup="listbox"],[role="button"][aria-haspopup="true"],button[aria-haspopup="true"],.dropdown-toggle,.ng-select,.select2-selection,mat-select';
 const controls='input,select,textarea,'+comboSelector+',[role="radio"]';
 const activate=e=>{e.addEventListener('click',event=>event.preventDefault(),{once:true,capture:true});e.click();};
 const custom=e=>e.tagName!=='SELECT'&&e.matches(comboSelector);
 const radio=e=>e.type==='radio'||e.getAttribute('role')==='radio';
 const type=e=>radio(e)?'radio-group':custom(e)?'combobox':e.type||e.tagName.toLowerCase();
 const labelled=e=>(e?.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>text(document.getElementById(id))).join(' ');
 const group=e=>e.closest('[role="radiogroup"],fieldset');
 const radios=e=>{const g=group(e);return [...(g||e.form||document).querySelectorAll('input[type="radio"],[role="radio"]')].filter(r=>g?group(r)===g&&(!e.name||r.name===e.name):!!e.name&&r.name===e.name&&r.form===e.form);};
 const labelText=e=>{if(!e)return '';const copy=e.cloneNode(true);for(const control of copy.querySelectorAll(controls+',button,[role="listbox"]'))control.remove();return text(copy);};
 const ownLabel=e=>(e.getAttribute('aria-label')||labelled(e)||[...(e.labels||[])].map(labelText).join(' ')||labelText(e.closest('label'))||'').trim();
 const nearbyLabel=e=>{let parent=e.parentElement;for(let n=0;n<5&&parent&&parent!==document.body;n++,parent=parent.parentElement){const groups=[...parent.querySelectorAll(controls)].filter(c=>!c.parentElement?.closest(comboSelector));if(radio(e)){if(groups.some(c=>!radio(c)||!radios(e).includes(c)))break;}else if(groups.filter(c=>!radio(c)).length!==1)break;const heading=parent.querySelector('legend,label:not([for]),.control-label,.form-label,[data-question],h3,h4');const value=labelText(heading);if(value&&!/^(yes|no)$/i.test(value))return value;}return '';};
 const label=e=>{if(radio(e)){const g=group(e);return (g&&(g.getAttribute('aria-label')||labelled(g)||text(g.querySelector('legend')))||nearbyLabel(e)).trim().slice(0,250);}return (ownLabel(e)||nearbyLabel(e)||e.placeholder||'').trim().slice(0,250);};
 const elements=()=>[...document.querySelectorAll(controls)].filter(e=>!e.parentElement?.closest(comboSelector)).filter((e,i,all)=>!radio(e)||radios(e)[0]===e);
 const selectedValue=e=>{let parent=e;for(let n=0;n<4&&parent;n++,parent=parent.parentElement){if(parent!==e&&parent.querySelectorAll(comboSelector).length>1)break;const selected=parent.querySelector('[class*="singleValue"],[data-selected-value],.ng-value-label,.select2-selection__rendered,.mat-select-value-text');if(selected)return text(selected);}return (e.value||text(e)).trim();};
 const selectedRadio=e=>radios(e).find(r=>r.checked||r.getAttribute('aria-checked')==='true');
 const optionLabel=e=>ownLabel(e)||text(e)||e.value||'';
 const placeholder=value=>!value||/^(select|choose|please select|select an? option|select one|select an? answer|please choose)([ .…]*)$/i.test(value.trim());
 const empty=e=>radio(e)?!selectedRadio(e):custom(e)?placeholder(selectedValue(e)):!e.value||(e.tagName==='SELECT'&&e.selectedIndex===0&&/select|choose|please/i.test(text(e.options[0])));
 const disabled=e=>e.disabled||e.readOnly&&!custom(e)||e.getAttribute('aria-disabled')==='true';
 const snapshot=(e,index)=>({index,label:label(e),type:type(e),name:e.name||'',id:e.id||'',maxLength:e.maxLength,filled:!empty(e),disabled:!!disabled(e),options:e.tagName==='SELECT'?[...e.options].map(o=>({value:o.value,label:text(o),disabled:o.disabled})):radio(e)?radios(e).map((r,i)=>({value:String(i),label:optionLabel(r),disabled:!!disabled(r)})):undefined});
 if(action==='scan'){const all=elements();return {url:location.href,fields:all.map(snapshot).filter(f=>visible(all[f.index])).slice(0,150),embeddedForms:document.querySelectorAll('iframe').length};}
 if(action==='remember'){
  const blocked=/password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/i;
  const candidates=[];
  for(const e of elements()){
   if(!['text','email','tel','url','textarea','select-one','number','combobox','radio-group'].includes(type(e))||disabled(e)||!visible(e)||empty(e))continue;
   const question=label(e);if(!question||blocked.test(question+' '+(e.name||'')+' '+e.id)||/one-time-code|cc-|current-password|new-password/.test(e.autocomplete||''))continue;
   const answer=radio(e)?optionLabel(selectedRadio(e)):custom(e)?selectedValue(e):e.tagName==='SELECT'?text(e.options[e.selectedIndex]):e.value;
   if(!answer||answer.length>1500||placeholder(answer))continue;
   candidates.push({question,answer});if(candidates.length>=100)break;
  }
  return {url:location.href,origin:location.origin,candidates};
 }
 return (async()=>{
  if(location.href!==url)return {filled:0,skipped:fields.length,changed:true};
  const all=elements(),targets=fields.map(f=>[f,all[f.index]]);let filled=0,skipped=0;
  for(const [f,e] of targets){
   if(location.href!==url||!e||!e.isConnected||!empty(e)||disabled(e)||!visible(e)||label(e)!==f.label||type(e)!==f.type||(e.name||'')!==f.name||(e.id||'')!==f.id){skipped++;continue;}
   if(radio(e)){
    const choices=radios(e),matching=choices.filter(r=>!disabled(r)&&visible(r)&&norm(optionLabel(r))===norm(f.display));
    if(matching.length!==1){skipped++;continue;}matching[0].click();await new Promise(r=>setTimeout(r,60));
    if(selectedRadio(e)===matching[0])filled++;else skipped++;
   }else if(custom(e)){
    const boxSelector='[role="listbox"],.ng-dropdown-panel,.select2-results__options,.mat-select-panel,.dropdown-menu';
    const optionSelector='[role="option"],.ng-option,.select2-results__option,mat-option,[role="menuitem"],li > a';
    const before=new Set([...document.querySelectorAll(boxSelector)].filter(visible));
    e.focus();activate(e);if(e.getAttribute('aria-expanded')!=='true')e.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));
    let boxes=[];
    for(let attempt=0;attempt<15;attempt++){
     if(location.href!==url||!e.isConnected)break;
     const ids=((e.getAttribute('aria-controls')||'')+' '+(e.getAttribute('aria-owns')||'')).trim().split(/\s+/).filter(Boolean);
     boxes=ids.map(id=>document.getElementById(id)).filter(n=>n&&visible(n));
     if(!boxes.length)boxes=[...document.querySelectorAll(boxSelector)].filter(n=>visible(n)&&!before.has(n));
     if(boxes.length===1&&boxes[0].querySelector(optionSelector))break;
     await new Promise(r=>setTimeout(r,80));
    }
    const aliases=f.aliases||[norm(f.value)],options=boxes.length===1?[...boxes[0].querySelectorAll(optionSelector)].filter(o=>visible(o)&&!disabled(o)&&!o.classList.contains('ng-option-disabled')&&aliases.includes(norm(text(o)))):[];
    // An open menu's option text must not be mistaken for an existing selection.
    if(location.href!==url||!e.isConnected||options.length!==1){e.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));skipped++;continue;}
    activate(options[0]);let accepted=false;
    for(let attempt=0;attempt<10;attempt++){await new Promise(r=>setTimeout(r,80));if(location.href!==url||!e.isConnected)break;if(aliases.includes(norm(selectedValue(e)))){accepted=true;break;}}
    if(accepted)filled++;else skipped++;
   }else{
    if(e.tagName==='SELECT'&&![...e.options].some(o=>o.value===f.value&&!o.disabled&&text(o)===f.display)){skipped++;continue;}
    const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(e,f.value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,60));if(e.isConnected&&e.value===f.value)filled++;else skipped++;
   }
  }
  return {filled,skipped};
 })();
}
export const scanForm=()=>formBridge({action:'scan'});
export const fillForm=options=>formBridge({...options,action:'fill'});
