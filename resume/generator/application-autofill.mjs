import {memoryMatch} from './answer-memory.mjs?v=20261123.3';
import {commonQuestion,backgroundAnswer} from './common-questions.mjs?v=20261123.3';
import {answerRule} from './answer-rules.mjs?v=20261123.3';
import {portfolioAnswer} from './portfolio-answers.mjs?v=20261123.3';
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function suggestField(field,profile,memory=[],origin='',context='',portfolio=null){
 if(!profile?.confirmed)return null;
 if(field.type==='chat-reply'){
  if(field.filled||field.disabled)return null;
  // Resolve one current prompt. A greeting or description may precede it.
  const parts=field.label.split(/(?:[.!]\s+(?=[A-Z])|\n+)/);
  const prompt=parts.at(-1).replace(/^to get started,\s*/i,'').trim();
  if((field.label.match(/\?/g)||[]).length>1)return null;
  const request=normalize(prompt).replace(/^(?:(?:can|could|would) you (?:please )?|please )?(?:provide(?: (?:us|me))?(?: with)?|enter|share|tell (?:us|me)|type) (?:your )?/,'').replace(/^what (?:is|are) your /,'');
  const contact=new Map([['first and last name','Full name'],['full name','Full name'],['first name','First name'],['last name','Last name'],['email','Email'],['email address','Email'],['phone number','Phone number'],['mobile number','Phone number']]);
  const answer=suggestField({...field,label:contact.get(request)||prompt,type:'text'},profile,memory,origin,context,portfolio);
  return answer?{...answer,reason:'Draft reply for your review',sourceQuestion:answer.sourceQuestion||contact.get(request)||prompt}:null;
 }
 const wording=String(field.label||'').replace(/^\s*(?:question\s+)?\d{1,3}\s*[*.)\-:]+\s*[.*:]?\s*/i,'');
 field={...field,label:wording};
 const label=normalize(wording).replace(/\b(required|optional)\b/g,'').trim();
 if(field.employmentEntry&&profile.answers?.some(a=>commonQuestion(a.question)?.question==='Employment experience'&&normalize(a.answer)==='none'))return null;
 const common=commonQuestion(label),background=backgroundAnswer(label,profile,memory.filter(a=>a.scope==='*'||a.scope===origin&&a.context===context));
 const rule=answerRule(field,profile,memory,origin,context);if(rule?.blocked)return null;
 if(/^(in )?(what|which) country( region)?$/.test(label))return null;
 if(!label||(!rule&&!common&&!background&&/password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|\breference|emergency|guardian|parent|\breferr|manager|supervisor/.test(label)))return null;
 if(!['text','email','tel','url','textarea','select-one','combobox','radio-group','checkbox-group','number','date','month'].includes(field.type)||field.filled||field.disabled)return null;
 const patterns={firstName:/^(legal )?(first|given) name$/,lastName:/^(legal )?(last name|family name|surname)$/,fullName:/^(legal |full |legal full )?name$/,email:/^(personal |primary |contact )?e ?mail( address)?$/,phone:/^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/,city:/^(current |home )?city$/,state:/^(current |home )?(state|province|state province)$/,postalCode:/^(zip|postal|zip postal)( code)?$/,country:/^(current |home )?country( of residence)?$/,school:/^(current )?(university|school|college|school university|school or university|university college)( name)?$/,major:/^(major|field of study|academic major)$/,graduationYear:/^(expected |anticipated )graduation year$/,portfolio:/^(portfolio|personal website|portfolio website)( url| link)?$/,linkedin:/^linkedin( profile| account)?( url| link)?$/,github:/^github( profile)?( url| link)?$/};
 const fieldAliases={
  'location city':'city','city of residence':'city','town or city':'city',
  'discipline':'major','academic discipline':'major','primary field of study':'major',
  'school affiliation':'school','university affiliation':'school','college or university name':'school',
  'other website':'portfolio','personal portfolio url':'portfolio'
 };
 const directLabel=label.replace(/^(?:please (?:enter|provide|indicate) (?:us )?(?:your )?|what is your |what s your )/,'');
 // A country selector paired with a phone input may represent a calling code.
 if((label==='country'||/^(?:country phone code|phone country(?: code)?|country calling code|dial code)$/.test(label))&&(field.phoneCountry||/phone|dial|calling/i.test(field.id+' '+field.name+' '+label))){
  const num=String(profile.values.phone||'').replace(/\D/g,'');
  const us=/^(united states(?: of america)?|usa|us)$/.test(normalize(profile.values.country||background?.value));
  if(field.filled||field.disabled||!us||!/^1?\d{10}$/.test(num))return null;
  const aliases=['united states 1','united states of america 1','united states','us 1'];
  if(field.type==='combobox')return {value:'United States +1',display:'United States +1',aliases};
  const matches=(field.options||[]).filter(o=>!o.disabled&&aliases.includes(normalize(o.label)));
  return matches.length===1?{value:matches[0].value,display:matches[0].label}:null;
 }
 const key=fieldAliases[directLabel]||Object.keys(patterns).find(k=>patterns[k].test(directLabel));const custom=(profile.answers||[]).filter(a=>normalize(a.question)===label||(common&&commonQuestion(a.question)?.question===common.question));
 const remembered=!key?memoryMatch(field.label,memory,origin,context):null;
 const value=rule?.value||(key==='fullName'?[profile.values.firstName,profile.values.lastName].filter(Boolean).join(' '):key?(profile.values[key]||background?.value):common?.question==='How did you hear about this position?'&&remembered?remembered.value:custom.length&&new Set(custom.map(a=>a.answer.trim())).size===1?custom[0].answer:background?.value||remembered?.value);
 if(!value){
  const derived=portfolioAnswer(field,portfolio);if(!derived)return null;
  if(['select-one','combobox','radio-group'].includes(field.type)){
   if(derived.value!=='Yes')return null;
   if(field.type==='combobox')return {...derived,aliases:['yes']};
   const matches=(field.options||[]).filter(o=>!o.disabled&&normalize(o.label)==='yes');
   return matches.length===1?{...derived,value:matches[0].value,display:matches[0].label}:null;
  }
  return ['text','textarea'].includes(field.type)?derived:null;
 }
 if(field.maxLength>0&&value.length>field.maxLength)return null;
 if(field.type==='checkbox-group'){
  if(rule?.markIncomplete)return {value:'Not Completed',display:'Not Completed',selectedLabels:[field.options[0].label],reason:rule.reason,sourceQuestion:rule.sourceQuestion};
  // Only explicit region preferences are supported: never consent/attestation boxes.
  if(common?.question!=='Preferred work regions')return null;
  const desired=value.split(';').map(normalize),matches=(field.options||[]).filter(o=>!o.disabled&&desired.includes(normalize(o.label)));
  if(matches.length!==desired.length||new Set(matches.map(o=>normalize(o.label))).size!==desired.length)return null;
  return {value:matches.map(o=>o.value),display:matches.map(o=>o.label).join('; '),selectedLabels:matches.map(o=>o.label),reason:'Your saved work-region preferences',requiresReview:false};
 }
 const confirmedMale=common?.question==='Sex'&&normalize(value)==='male'&&custom.length>0&&new Set(custom.map(a=>normalize(a.answer))).size===1;
 const review=rule?{reason:rule.reason,sourceQuestion:rule.sourceQuestion,requiresReview:rule.requiresReview}:{reason:confirmedMale?'Your confirmed profile answer':background?'Based on your confirmed background':common?.review?'Confirm this answer for this application':remembered?.reason,sourceQuestion:background?background.sourceQuestion:common?.review?common.question:remembered?.question,requiresReview:!confirmedMale&&(!!common?.review||!!background||!!remembered?.requiresReview)};
 if(field.type==='select-one'||field.type==='combobox'||field.type==='radio-group'){
  const aliases=rule?.aliases||(key==='state'&&normalize(value)==='new jersey'?['new jersey','nj']:(key==='country'||background?.value==='United States')&&['us','usa','united states','united states of america'].includes(normalize(value))?['united states','united states of america','us','usa']:common?.question==='Highest completed degree'&&normalize(value)==='high school diploma'?['high school diploma','high school diploma or equivalent','high school diploma ged','high school or equivalent']:[normalize(value)]);
  if(rule?.confirmUSPersons&&field.type==='select-one'){
   const choices=field.options.filter(o=>!o.disabled&&o.value&&!/^(?:please )?(?:select|choose)\b/.test(normalize(o.label)));
   if(choices.length===1)return {value:choices[0].value,display:choices[0].label,...review};
  }
  if(rule?.careerSiteDetail&&field.type==='select-one'){
   const candidates=field.options.filter(o=>!o.disabled&&o.value&&/\b(?:careers? (?:web)?site|careers? page|company website)$/.test(normalize(o.label)));
   if(candidates.length===1)return {value:candidates[0].value,display:candidates[0].label,...review};
  }
  if(field.type==='combobox')return {value,display:value,aliases,...(rule?.confirmUSPersons?{confirmUSPersons:true}:{}),...(rule?.careerSiteDetail?{careerSiteDetail:true}:{}),...(common?.question==='How did you hear about this position?'&&normalize(value)==='company website'?{sourceTree:true}:{}),...review};
  const matches=(field.options||[]).filter(o=>!o.disabled&&(aliases.includes(normalize(o.label))||field.type!=='radio-group'&&aliases.includes(normalize(o.value))));if(rule?.aliases&&matches.length>1){matches.sort((a,b)=>aliases.indexOf(normalize(a.label))-aliases.indexOf(normalize(b.label)));if(normalize(matches[0].label)!==normalize(matches[1].label))matches.splice(1);}if(matches.length!==1)return null;return {value:matches[0].value,display:matches[0].label,...review};
 }
 return {value,display:value,...review};
}

// Self-contained: the popup injects this same bridge for scan, remember and fill.
export function formBridge({action='scan',url,fields=[],origins=[]}={}){
 if(action==='scan-chat'&&!origins.includes(location.origin))return null;
 const text=e=>(e?.innerText||e?.textContent||'').trim();
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const comboSelector='[role="combobox"],input[aria-controls][aria-expanded],[role="searchbox"][aria-controls],[aria-haspopup="listbox"],[role="button"][aria-haspopup="true"],button[aria-haspopup="true"],button[aria-haspopup="menu"],button[data-automation-id][aria-expanded],button[aria-controls][aria-expanded],input[data-automation-id="searchBox"],button[data-automation-id="selectWidget"],button[name][aria-required],button[data-automation-id="countryRegion"],button[data-automation-id="degree"],input[aria-autocomplete="list"],.iti__selected-country,.iti__selected-flag,.selected-flag,.dropdown-toggle,.ng-select,.select2-selection,mat-select,.selectize-input,.ui-select-container,.ts-control';
 const controls='[contenteditable][data-placeholder],[contenteditable][aria-label],[contenteditable="true"][role="textbox"],[contenteditable="plaintext-only"],input,select,textarea,'+comboSelector+',[role="radio"]';
 const activate=(e,option=false)=>{
  if(option)e.scrollIntoView?.({block:"nearest"});
  const Mouse=typeof MouseEvent==='undefined'?Event:MouseEvent;
  if(typeof PointerEvent!=='undefined')e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'mouse',button:0}));
  const down=new Mouse('mousedown',{bubbles:true,cancelable:true,button:0});e.dispatchEvent(down);
  e.dispatchEvent(new Mouse('mouseup',{bubbles:true,cancelable:true,button:0}));
  if(typeof PointerEvent!=='undefined')e.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'mouse',button:0}));
  if(option){
   if(e.isConnected&&visible(e)){
    if(e.closest('a,button,input[type=submit]'))e.addEventListener('click',event=>event.preventDefault(),{once:true,capture:true});
    e.click();
   }
   return;
  }
  if(!down.defaultPrevented&&e.isConnected&&visible(e)){e.addEventListener('click',event=>event.preventDefault(),{once:true,capture:true});e.click();}
 };
 const custom=e=>e.tagName!=='SELECT'&&e.matches(comboSelector);
 const radio=e=>e.type==='radio'||e.getAttribute('role')==='radio';
 const checkbox=e=>e.type==='checkbox';
 const choice=e=>radio(e)||checkbox(e);
 const isReply=e=>e.matches('textarea,input:not([type]),input[type="text"],[contenteditable]')&&/^(?:write|type|enter|send) (?:a |your )?(?:reply|message)(?: here)?[. …]*$/i.test((e.placeholder||e.getAttribute('data-placeholder')||e.getAttribute('aria-placeholder')||e.getAttribute('aria-label')||'').trim());
 const chatQuestion=e=>{
  const messages='.ol-text-message,[data-message-id],[data-author],[data-sender],[role="log"] > *,[class*="message-bubble"],[class*="message__text"],[class*="message-text"],[class*="chat-message"],[class*="message-content"]';
  for(let p=e.parentElement;p;p=p.parentElement){
   if([...p.querySelectorAll(controls)].filter(c=>isReply(c)&&visible(c)).length!==1)break;
   const rows=[...p.querySelectorAll(messages)].filter(m=>visible(m)&&text(m)&&!m.contains(e)&&!m.matches('input,textarea')&&!(m.compareDocumentPosition(e)&2));
   const row=rows.at(-1);
   if(row){
    if(row.closest('[data-author="user"],[data-sender="user"],[data-author="candidate"],[class*="outgoing"],[class*="user-message"]'))return '';
    return text(row).slice(-800);
   }
   // Some Olivia skins render plain text bubbles without message roles.
   if(/(?:olivia by paradox|job assistant|recruiting assistant)/i.test(text(p))&&(!p.matches('body,html')||/(^|\.)paradox\.ai$/.test(location.hostname))){
    const leaves=[...p.querySelectorAll('p,div,span')].filter(n=>!n.children.length&&visible(n)&&(n.compareDocumentPosition(e)&4)&&text(n).length>5&&!n.closest('button,label,footer'));
    const last=leaves.at(-1);if(last&&/\?\s*$/.test(text(last)))return text(last).slice(-800);
   }
  }
  return '';
 };
 const type=e=>isReply(e)?'chat-reply':radio(e)?'radio-group':checkbox(e)?'checkbox-group':custom(e)?'combobox':e.type||e.tagName.toLowerCase();
 const labelled=e=>(e?.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>text(document.getElementById(id))).join(' ');
 const radioSelector='input[type="radio"],[role="radio"]';
 const choiceVisible=e=>visible(e)||[...(e.labels||[]),e.closest('label')].some(l=>l&&visible(l));
 const group=e=>{const explicit=e.closest('[role="radiogroup"],[role="group"],fieldset');if(explicit)return explicit;
  if(radio(e)){
   if(e.name)return null;
   for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){
    const rows=[...p.querySelectorAll(radioSelector)];if(rows.length<2)continue;
    if(rows.some(r=>r.name||r.closest('[role="radiogroup"],fieldset'))||p.querySelector('textarea,select,input:not([type="radio"]):not([type="hidden"])'))return null;
    return p;
   }
   return null;
  }let p=e.parentElement;for(let i=0;i<6&&p&&p!==document.body;i++,p=p.parentElement){if(p.querySelectorAll('input:not([type="checkbox"]),select,textarea').length)break;if(p.querySelectorAll('input[type="checkbox"]').length>1&&p.querySelector('p,legend,.question-label,.form-label,.control-label'))return p;}return null;};
 const radios=e=>{if(checkbox(e)&&norm(ownLabel(e))==='not completed')return [e];const g=group(e),selector=checkbox(e)?'input[type="checkbox"]':'input[type="radio"],[role="radio"]';return [...(g||e.form||document).querySelectorAll(selector)].filter(r=>g?group(r)===g&&(checkbox(e)||!e.name||r.name===e.name):!!e.name&&r.name===e.name&&r.form===e.form);};
 const original=e=>e.matches('.selectize-input,.ts-control')?e.closest('.selectize-control,.ts-wrapper')?.previousElementSibling:null;
 const labelText=e=>{if(!e)return '';const copy=e.cloneNode(true);for(const control of copy.querySelectorAll(controls+',button,[role="listbox"],.selectize-control,.ui-select-match,.select2-container,.ts-wrapper'))control.remove();return text(copy);};
 const useful=s=>/^(select|please select|choose|open menu|clear|select an option|select one)[. …]*$/i.test((s||'').trim())?'':s;
 const ownLabel=e=>(useful(e.getAttribute('aria-label'))||useful(labelled(e))||[...(e.labels||[]),...([...document.querySelectorAll('label[for]')].filter(l=>e.id&&l.getAttribute('for')===e.id))].map(labelText).filter((v,i,a)=>a.indexOf(v)===i).join(' ')||labelText(e.closest('label'))||'').trim();
 const nearbyLabel=e=>{let parent=e.parentElement;const members=choice(e)?radios(e):[];
  for(let n=0;n<8&&parent&&parent!==document.body;n++,parent=parent.parentElement){
   const contained=[...parent.querySelectorAll(controls)].filter(c=>!c.parentElement?.closest(comboSelector)&&type(c)!=='hidden'&&(c===e||visible(c)));
   if(choice(e)){if(contained.some(c=>!choice(c)||!members.includes(c)))break;if(!members.length||!members.every(r=>parent.contains(r)))continue;}
   else if(contained.filter(c=>!radio(c)).length!==1)break;
   const candidates=[...parent.querySelectorAll('legend,[data-question],.question-label,.control-label,.form-label,h3,h4,p,label,strong')].filter(h=>!h.closest('[role="listbox"],[role="option"]')&&!h.querySelector(controls)&&!members.some(r=>r.closest('label')?.contains(h)||[...(r.labels||[])].some(l=>l.contains(h))));
   if(!choice(e))candidates.sort((a,b)=>Number(!a.matches('label,strong,.question-label,.control-label,.form-label'))-Number(!b.matches('label,strong,.question-label,.control-label,.form-label')));
   if(choice(e)){
    const prompts=[...parent.querySelectorAll('div,span,legend,p,label,h2,h3,h4')].filter(h=>!h.querySelector(controls)&&!h.closest('[role="radio"]')&&/\?\s*\*?$/.test(text(h))&&text(h).length<=800);
    candidates.unshift(...prompts.filter(h=>!prompts.some(other=>other!==h&&h.contains(other))));
   }
   for(const heading of candidates){const value=labelText(heading);if(value&&!/^(yes|no|male|female)$/i.test(value)&&value.length<=800)return value;}
  }return '';
 };
 const label=e=>{
  if(isReply(e))return chatQuestion(e);
  const wrapper=e.closest('[data-automation-id^="formField-"]');
  const fieldLabel=wrapper?.querySelector('[data-automation-id="formLabel"],legend')||wrapper?.querySelector('label');
  if(fieldLabel&&(!choice(e)||!fieldLabel.contains(e))){const value=labelText(fieldLabel);if(value&&!/^(yes|no)$/i.test(value))return value;}
  if(e.matches('.iti__selected-country,.iti__selected-flag,.selected-flag'))return 'Country';
  if(checkbox(e)&&norm(ownLabel(e))==='not completed')return ownLabel(e);
  if(choice(e)){const g=group(e),single=g&&[...g.querySelectorAll('input[type="radio"],[role="radio"],input[type="checkbox"]')].every(r=>radios(e).includes(r));return (single&&(g.getAttribute('aria-label')||labelled(g)||text(g.querySelector('legend')))||nearbyLabel(e)).trim().slice(0,800);}return (ownLabel(e)||(custom(e)&&e.querySelector('input')?ownLabel(e.querySelector('input')):'')||(original(e)?ownLabel(original(e)):'')||nearbyLabel(e)||e.placeholder||'').trim().slice(0,800);};
 let shadowEditors=null;
 const elements=()=>{
  const list=[...document.querySelectorAll(controls)];
  const shadowReplies=root=>{for(const host of root.querySelectorAll('*'))if(host.shadowRoot){
   shadowEditors.push(...[...host.shadowRoot.querySelectorAll(controls)].filter(isReply));shadowReplies(host.shadowRoot);
  }};
  if(!shadowEditors){shadowEditors=[];shadowReplies(document);}list.push(...shadowEditors);
  return list.filter(e=>!e.parentElement?.closest(comboSelector)).filter(e=>!choice(e)||radios(e)[0]===e);};
 const selectedValue=e=>{
  if(e.matches('[data-automation-id="searchBox"]')){
   const holder=e.closest('[data-automation-id^="formField"],[data-automation-id="multiSelectContainer"]')||e.parentElement;
   return text(holder?.querySelector('[data-automation-id="selectedItem"],[data-automation-id="selectedItemLabel"]'));
  }
  if(e.matches('.iti__selected-country,.iti__selected-flag,.selected-flag')){
   const selected=e.title||e.getAttribute('aria-label')?.replace(/^selected country\s*:?\s*/i,'')||'';
   return /\+\d/.test(selected)?selected:'';
  }
  if(e.matches('.selectize-input,.ts-control,.ui-select-container')){
   const items=[...e.querySelectorAll('.item,[data-item],.ui-select-match-item,.ui-select-match-text')].filter(n=>!n.parentElement?.closest('.item,[data-item],.ui-select-match-item'));
   return items.map(n=>{const c=n.cloneNode(true);for(const x of c.querySelectorAll('.remove,.ui-select-match-close,button,[aria-label="Remove"]'))x.remove();return text(c).replace(/^[×✕]\s*/,'');}).filter(Boolean).join('; ');
  }
  let parent=e;for(let n=0;n<4&&parent;n++,parent=parent.parentElement){if(parent!==e&&parent.querySelectorAll(comboSelector).length>1)break;const selected=parent.querySelector('[class*="singleValue"],[class*="__single-value"],[data-selected-value],.ng-value-label,.select2-selection__rendered,.mat-select-value-text,.ui-select-match-text');if(selected){if(text(selected)==='+1'&&selected.querySelector('.iti__us,[data-country-code="us"]'))return 'United States +1';return text(selected);}}return (e.value||text(e)).trim();};
 const selectedRadio=e=>radios(e).find(r=>r.checked||r.getAttribute('aria-checked')==='true');
 const optionLabel=e=>{const associated=[...(e.labels||[])];const root=associated[0]||e.closest('label');if(root){const copy=root.cloneNode(true);const described=(e.getAttribute('aria-describedby')||'').split(/\s+/);for(const n of copy.querySelectorAll('input,[role="radio"],p,small,.description,.help-block,[id]'))if(n.matches('input,[role="radio"],p,small,.description,.help-block')||described.includes(n.id))n.remove();const value=text(copy).split('\n').map(s=>s.trim()).find(Boolean);if(value)return value;}return ownLabel(e)||text(e)||e.value||'';};
 const placeholder=value=>!value||/^(select|choose|please select|select an? option|select one|select an? answer|please choose)([ .…]*)$/i.test(value.trim());
 const empty=e=>isReply(e)?!(e.value||e.textContent||'').trim():choice(e)?!selectedRadio(e):custom(e)?placeholder(selectedValue(e)):!e.value||(e.tagName==='SELECT'&&e.selectedIndex===0&&/select|choose|please/i.test(text(e.options[0])));
 const disabled=e=>e.disabled||e.readOnly&&!custom(e)||e.getAttribute('aria-disabled')==='true';
 const valueText=e=>choice(e)?optionLabel(selectedRadio(e)||e):e.tagName==='SELECT'?text(e.options[e.selectedIndex]):custom(e)?selectedValue(e).replace(/^[×✕✖]\s*|\s*[×✕✖]$/g,'').trim():e.value||'';
 // For a question referring to "categories above", inspect the nearest list.
 // A preceding control or section heading ends the scope of the reference.
 const citizenList=e=>{
  const stopSelector=controls+',h1,h2,h3,h4';
  // Inspect the closest list before the field in document order, including lists
  // in a disclosure with a Read more button or a hidden form input after it.
  for(let node=e,level=0;node&&node!==document.body&&level<14;node=node.parentElement,level++){
   for(let sibling=node.previousElementSibling;sibling;sibling=sibling.previousElementSibling){
    const selector=stopSelector+',ul,ol,[role="list"]';
    const candidates=[sibling,...sibling.querySelectorAll(selector)].reverse();
    for(const candidate of candidates){
     if(candidate.matches('ul,ol,[role="list"]')){
      return [...candidate.querySelectorAll('li,[role="listitem"]')].some(item=>/^(?:u s|us|united states) citizens?$/.test(norm(text(item))));
     }
     if(candidate.matches(stopSelector)&&visible(candidate)&&candidate.type!=='hidden'&&!candidate.closest('ul,ol,[role="list"]'))return false;
    }
   }
  }
  return false;
 };
 const context=e=>{
  const wording=norm(label(e));
  for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){
   const headings=[...p.querySelectorAll('h1,h2,h3,h4,legend,[role="heading"]')];
   if(!headings.length)continue;
   if(headings.some(h=>/^(employment history|work experience)( \d+)?$/.test(norm(text(h))))&&headings.every(h=>/^(employment history|work experience)( \d+)?$/.test(norm(text(h)))))return {employmentEntry:true};
   break;
  }
  if(/(?:confirm|verify|repeat|re ?enter).*e ?mail|e ?mail.*confirmation/.test(wording)){
   const scope=e.form||e.closest('[role="dialog"]')||document;
   const originals=[...scope.querySelectorAll('input')].filter(c=>c!==e&&visible(c)&&/^(?:primary |personal |contact )?e ?mail(?: address)?$/.test(norm(label(c))));
   return {primaryEmail:originals.length===1?originals[0].value||'':originals.length>1?'ambiguous':''};
  }
  if(wording.replace(/ required$/,'')==='country'||e.matches('.iti__selected-country,.iti__selected-flag,.selected-flag')){
   let box=e.parentElement;for(let depth=0;box&&box!==document.body&&depth<13;depth++,box=box.parentElement){
    if(box.matches('.iti,.react-tel-input,.intl-tel-input,.phone-input__country,.phone-input')||box.querySelector('input[type="tel"],input[autocomplete="tel"],input[id="phone"]')&&[...box.querySelectorAll('input')].filter(i=>visible(i)&&i.type!=='hidden'&&i.getAttribute('aria-hidden')!=='true').length<=2)return {phoneCountry:true};
   }
  }
  if(wording==='please indicate if you belong to one of the categories above')return {includesCitizenCategory:citizenList(e)};
  if(/date granted$|^if\b|\bif (?:you (?:selected|answered) )?no\b|^(?:source )?details?$|^military (branch|status)$|^please review the question again/.test(wording)&&!/^if .+ please specify$/.test(wording)){
   const all=elements(),prior=all.slice(0,all.indexOf(e)).filter(c=>visible(c)&&label(c)&&!['hidden','button','submit','file'].includes(type(c)));
   let last=prior.at(-1);
   if(wording==='military status'&&last&&norm(label(last))==='military branch')last=prior.at(-2);
   return {parentQuestion:last?label(last):'',parentAnswer:last&&!empty(last)?valueText(last):'',parentIncludesCitizenCategory:!!last&&/belong to one of the categories above/.test(norm(label(last)))&&citizenList(last)};
  }
  let degreePair=false,rowDegree='';
  if(['degree','degree type','not completed'].includes(wording)){
   for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){
    const items=[...p.querySelectorAll(controls)];
    const degrees=items.filter(c=>!choice(c)&&/^(degree|degree type)$/.test(norm(label(c))));
    const boxes=items.filter(c=>checkbox(c)&&norm(ownLabel(c))==='not completed');
    if(degrees.length>1||boxes.length>1)break;
    if(degrees.length===1&&boxes.length===1){degreePair=true;rowDegree=empty(degrees[0])?'':valueText(degrees[0]);break;}
   }
  }
  const q=norm(label(e));if(!/not completed|degree|gpa|grade point|overall result|field of study|^to actual or expected$|^source detail|please specify|academic standing details/.test(q))return {parentAnswer:'',parentQuestion:'',educationSchool:''};
  const all=elements(),before=all.slice(0,all.indexOf(e));let parentAnswer='',parentQuestion='',educationSchool='';
  if(/^source details?$|^if .+ please specify$/.test(q)){const parents=before.filter(c=>/^how (did|do) you (hear|learn|find out) about/.test(norm(label(c))));const last=parents.at(-1);if(last&&!empty(last))parentAnswer=valueText(last);}
  if(/^(please specify|other please specify|academic standing details)$/.test(q)){const last=before.at(-1);if(last&&!empty(last)&&/current academic standing/.test(norm(label(last)))){parentAnswer=valueText(last);parentQuestion=label(last);}}
  if(/not completed|degree|gpa|grade point|overall result|field of study|^to actual or expected$/.test(q)){
   let container=e.parentElement;for(let n=0;n<7&&container&&container!==document.body;n++,container=container.parentElement){
    const schools=all.filter(c=>container.contains(c)&&/^(school or university|school university|school|university|college)( name)?$/.test(norm(label(c))));
    if(schools.length>1)break;if(schools.length===1){educationSchool=valueText(schools[0]);break;}
   }
  }
  let highestEducation=false;
  if(q==='degree'||q==='degree type'){
   let section=e.parentElement;for(let depth=0;section&&section!==document.body&&depth<9;depth++,section=section.parentElement){
    if([...section.querySelectorAll('p,small,div,span')].some(n=>n.childElementCount<2&&/^in the degree field provide (?:your |the )?highest level of education[.\s]*$/i.test(text(n)))){highestEducation=true;break;}
   }
  }
  return {parentAnswer,parentQuestion,educationSchool,highestEducation,degreePair,rowDegree};
 };
 const snapshot=(e,index)=>({index,label:label(e),type:type(e),name:e.name||'',id:e.id||'',maxLength:e.maxLength,filled:!empty(e),disabled:!!disabled(e),required:!!e.required||e.getAttribute('aria-required')==='true'||label(e).includes('*')||!!e.closest('[aria-required="true"]'),placeholder:e.placeholder||'',min:e.min||'',max:e.max||'',...context(e),options:e.tagName==='SELECT'?[...e.options].map(o=>({value:o.value,label:text(o),disabled:o.disabled})):choice(e)?radios(e).map((r,i)=>({value:String(i),label:optionLabel(r),disabled:!!disabled(r)})):undefined});
 if(action==='prepare-education'){
  const buttons=[...document.querySelectorAll('button')].filter(b=>visible(b)&&!b.disabled&&!b.matches('[type="submit"]')&&(!b.form||b.type==='button')&&/^(?:\+\s*)?add(?: education history)?$/i.test(text(b)));
  const education=buttons.filter(b=>{
   for(let section=b.parentElement;section&&section!==document.body;section=section.parentElement){
    const headings=[...section.querySelectorAll('h1,h2,h3,h4,h5,legend,[role="heading"]')].filter(visible);
    if(!headings.length)continue;
    return headings.length===1&&/^(?:education|education history)$/.test(norm(text(headings[0])))&&!section.querySelector('input:not([type="hidden"]),select,textarea,[role="combobox"]')&&buttons.filter(other=>section.contains(other)).length===1;
   }
   return false;
  });
  if(education.length!==1)return false;
  education[0].click();
  return (async()=>{for(let i=0;i<20;i++){if(elements().some(c=>visible(c)&&norm(label(c))==='school or university'))break;await new Promise(r=>setTimeout(r,60));}return true;})();
 }
 if(action==='scan-chat')return {url:location.href,fields:elements().flatMap((e,i)=>isReply(e)&&visible(e)?[snapshot(e,i)]:[])};
 if(action==='scan'){
  const countries=new Set(),postings=[];
  for(const script of document.querySelectorAll('script[type="application/ld+json"]')){
   if(script.textContent.length>250000)continue;
   try{const json=JSON.parse(script.textContent);for(const row of [json].flat().flatMap(x=>x?.['@graph']||[x]))if([row?.['@type']].flat().includes('JobPosting'))postings.push(row);}catch{}
  }
  if(postings.length===1)for(const place of [postings[0].jobLocation].flat()){
   let country=place?.address?.addressCountry;country=country?.name||country;
   if(typeof country==='string'&&/^[a-z]{2}$/i.test(country))country=new Intl.DisplayNames(['en'],{type:'region'}).of(country.toUpperCase());
   countries.add(typeof country==='string'?country:'');
  }
  const jobLocation=countries.size===1?[...countries][0]:'';
  const all=elements();return {url:location.href,jobLocation,fields:all.map(snapshot).filter(f=>choice(all[f.index])?choiceVisible(all[f.index]):visible(all[f.index])).slice(0,150),chatFrames:[...document.querySelectorAll('iframe[src]')].filter(visible).flatMap(frame=>{
   try{const u=new URL(frame.src,location.href);return u.protocol==='https:'&&(/(^|\.)paradox\.ai$/.test(u.hostname)||/\b(chat|chatbot|olivia)\b/i.test([frame.title,frame.id,frame.name].join(' ')))?[u.origin]:[];}catch{return [];}
  }),hasPasswordField:!!document.querySelector('input[type=password i]'),embeddedForms:document.querySelectorAll('iframe').length};
 }
 if(action==='remember'){
  const blocked=/password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/i;
  const candidates=[];
  for(const e of elements()){
   if(!['text','email','tel','url','textarea','select-one','number','combobox','radio-group','checkbox-group','date','month'].includes(type(e))||disabled(e)||!visible(e)||empty(e))continue;
   if(checkbox(e)&&norm(label(e))!=='in which of the following u s geographic locations are you willing to work')continue;
   const question=label(e),identity=/^(sex|what is your sex|gender|what is your gender|preferred pronouns?|pronouns|what are your pronouns|race|ethnicity|race ethnicity|race ethnic background|what is your race ethnic background|what is your race ethnicity|what is your race|what is your ethnicity|what is your racial ethnic background|country of citizenship|in which country region do you have citizenship|in which country do you have citizenship|which country are you a citizen of)$/.test(norm(question));if(!question||/^(in )?(what|which) country( region)?$/.test(norm(question))||(!identity&&blocked.test(question+' '+(e.name||'')+' '+e.id))||/one-time-code|cc-|current-password|new-password/.test(e.autocomplete||''))continue;
   const answer=checkbox(e)?radios(e).filter(r=>r.checked).map(optionLabel).join('; '):radio(e)?optionLabel(selectedRadio(e)):custom(e)?selectedValue(e):e.tagName==='SELECT'?text(e.options[e.selectedIndex]):e.value;
   if(!answer||answer.length>1500||placeholder(answer))continue;
   candidates.push({question,answer});if(candidates.length>=100)break;
  }
  return {url:location.href,origin:location.origin,candidates};
 }
 return (async()=>{
  if(location.href!==url)return {filled:0,skipped:fields.length,changed:true};
  let filled=0,skipped=0;
  for(const f of fields){
   const all=elements();let e=all[f.index];
   if(f.id&&e?.id!==f.id){const matches=all.filter(c=>c.id===f.id);e=matches.length===1?matches[0]:null;}
   if(location.href!==url||!e||!e.isConnected||!empty(e)||disabled(e)||!(choice(e)?choiceVisible(e):visible(e))||label(e)!==f.label||type(e)!==f.type||(e.name||'')!==f.name||(e.id||'')!==f.id){skipped++;continue;}
   const currentContext=context(e);if(('primaryEmail' in f&&currentContext.primaryEmail&&String(currentContext.primaryEmail).trim().toLowerCase()!==String(f.value).trim().toLowerCase())||(f.degreePair&&(!currentContext.degreePair||f.rowDegree&&f.rowDegree!==currentContext.rowDegree))||(f.includesCitizenCategory&&!currentContext.includesCitizenCategory)||(f.parentIncludesCitizenCategory&&!currentContext.parentIncludesCitizenCategory)||(f.parentQuestion&&currentContext.parentQuestion!==f.parentQuestion)||(f.parentAnswer&&currentContext.parentAnswer!==f.parentAnswer)||(f.educationSchool&&currentContext.educationSchool!==f.educationSchool)){skipped++;continue;}
   if(checkbox(e)){
    const choices=radios(e),labels=f.selectedLabels||[],matching=choices.filter(r=>!disabled(r)&&choiceVisible(r)&&labels.some(l=>norm(l)===norm(optionLabel(r))));
    if(!labels.length||matching.length!==labels.length||new Set(matching.map(r=>norm(optionLabel(r)))).size!==labels.length){skipped++;continue;}
    for(const r of matching)if(!r.checked)r.click();await new Promise(r=>setTimeout(r,60));
    if(matching.every(r=>r.checked))filled++;else skipped++;
   }else if(radio(e)){
    const choices=radios(e),matching=choices.filter(r=>!disabled(r)&&choiceVisible(r)&&norm(optionLabel(r))===norm(f.display));
    if(matching.length!==1){skipped++;continue;}matching[0].click();await new Promise(r=>setTimeout(r,60));
    if(selectedRadio(e)===matching[0])filled++;else skipped++;
   }else if(custom(e)){
    const boxSelector='[class*="__menu-list"],[id^="react-select-"][id$="-listbox"],[role="listbox"],[role="menu"],[role="tree"],[data-automation-id="activeListContainer"],[data-automation-id="promptOptionsContainer"],.iti__country-list,.country-list,[class$="-menu-list"],.ng-dropdown-panel,.select2-results__options,.mat-select-panel,.dropdown-menu,.selectize-dropdown,.ui-select-choices,.ts-dropdown';
    const optionSelector='[class*="__option"],[id^="react-select-"][id*="-option-"],[role="option"],[role="treeitem"],[data-automation-id="menuItem"],[data-automation-id="promptOption"],[data-automation-id="promptLeafNode"],.iti__country,.country[data-country-code],[class$="-option"],.ng-option,.select2-results__option,mat-option,[role="menuitem"],li,[tabindex]:not([tabindex="-1"]),[data-selectable],.ui-select-choices-row';
    const before=new Set([...document.querySelectorAll(boxSelector)].filter(visible));
    const opener=e.matches('.ui-select-container')?(e.querySelector('.ui-select-toggle,.ui-select-match')||e):e;e.focus();if(e.getAttribute('aria-expanded')!=='true')activate(opener);if(e.getAttribute('aria-expanded')!=='true')e.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));
    let boxes=[];
    for(let attempt=0;attempt<15;attempt++){
     if(location.href!==url||!e.isConnected)break;
     const ids=((e.getAttribute('aria-controls')||'')+' '+(e.getAttribute('aria-owns')||'')).trim().split(/\s+/).filter(Boolean);
     boxes=ids.map(id=>e.getRootNode().getElementById?.(id)||document.getElementById(id)).filter(n=>n&&visible(n));
     if(!boxes.length){const local=e.closest('[data-automation-id^="formField-"],.iti,.react-tel-input,.intl-tel-input,.selectize-control,.ui-select-container,.ts-wrapper');if(local)boxes=[...local.querySelectorAll(boxSelector)].filter(visible);}
     if(!boxes.length&&e.parentElement?.querySelectorAll(comboSelector).length===1)boxes=[...e.parentElement.querySelectorAll(boxSelector)].filter(visible);
     if(!boxes.length)boxes=[...document.querySelectorAll(boxSelector)].filter(n=>visible(n)&&!before.has(n));
     boxes=boxes.filter((b,i,all)=>!all.some(other=>other!==b&&other.contains(b)));
     if(boxes.length===1&&boxes[0].querySelector(optionSelector))break;
     await new Promise(r=>setTimeout(r,80));
    }
    const aliases=[...(f.aliases||[norm(f.value)])];const readOptions=()=>boxes.length===1?[...boxes[0].querySelectorAll(optionSelector)].filter(o=>visible(o)&&!disabled(o)&&!o.classList.contains('ng-option-disabled')).filter(o=>!o.matches('input,textarea')&&!o.matches('[role="listbox"],[role="tree"],[role="menu"]')).filter((o,i,all)=>!all.some(other=>other!==o&&o.contains(other)&&norm(text(o))===norm(text(other)))):[];
    const optionKey=o=>f.phoneCountry&&o.getAttribute('data-country-code')?.toLowerCase()==='us'&&/\+1\b/.test(text(o))?'united states 1':norm(text(o));
    let available=readOptions();
    // Address pickers may fetch rows only after a search. A search term is never itself a selection.
    const isAddressPicker=/^(?:current |home )?(?:country(?: of residence)?|state(?: province)?|province)$/.test(norm(f.label));
    const input=e.matches('input:not([readonly])')?e:e.querySelector('input:not([readonly]):not([type="hidden"])');
    const query=input&&isAddressPicker&&!f.phoneCountry&&boxes.length===1&&!input.value&&!available.some(o=>aliases.includes(optionKey(o)))?String(f.value):'';
    const setQuery=value=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true,composed:true}));};
    if(query){
     setQuery(query);
     for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,80));if(!e.isConnected||location.href!==url)break;available=readOptions();if(available.some(o=>aliases.includes(optionKey(o))))break;}
    }
    // Virtualized pickers mount only the visible rows. Scroll the associated list.
    if(boxes.length===1&&!available.some(o=>aliases.includes(optionKey(o)))){
     const scroll=[boxes[0],...boxes[0].querySelectorAll('ul,div')].find(n=>n.clientHeight>0&&n.scrollHeight>n.clientHeight+2);
     if(scroll){scroll.scrollTop=0;scroll.dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,45));available=readOptions();for(let i=0;i<45&&!available.some(o=>aliases.includes(optionKey(o)));i++){const top=scroll.scrollTop;scroll.scrollTop+=scroll.clientHeight;if(scroll.scrollTop===top)break;scroll.dispatchEvent(new Event('scroll'));await new Promise(r=>setTimeout(r,45));available=readOptions();if(available.some(o=>aliases.includes(optionKey(o))))break;}}
    }
    if(f.confirmUSPersons){
     const choices=available.filter(o=>!placeholder(text(o)));
     if(choices.length===1)aliases.push(norm(text(choices[0])));
    }
    if(f.careerSiteDetail){
     const careerSites=available.map(o=>norm(text(o))).filter(v=>/\b(?:careers? (?:web)?site|careers? page|company website)$/.test(v));
     if(careerSites.length===1)aliases.push(careerSites[0]);
    }
    const options=available.filter(o=>aliases.includes(optionKey(o)));
    if(f.phoneCountry&&options.length>1&&options.every(o=>optionKey(o)==='united states 1'))options.splice(1);
    if(options.length>1&&aliases.length>1){options.sort((a,b)=>aliases.indexOf(norm(text(a)))-aliases.indexOf(norm(text(b))));if(norm(text(options[0]))!==norm(text(options[1])))options.splice(1);}
    // An open menu's option text must not be mistaken for an existing selection.
    if(location.href!==url||!e.isConnected||options.length!==1){if(query&&input.isConnected&&input.value===query)setQuery('');e.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));e.blur();skipped++;continue;}
    options[0].scrollIntoView?.({block:'nearest'});activate(options[0],true);let accepted=false,leafChosen=false;
    const sourceBranch=f.sourceTree&&/^(?:company|our) web\s*site$/i.test(text(options[0]));

    for(let attempt=0;attempt<10;attempt++){await new Promise(r=>setTimeout(r,80));if(location.href!==url||!e.isConnected)break;if(sourceBranch&&!leafChosen){
      const lists=[...document.querySelectorAll(boxSelector)].filter(n=>visible(n)&&(boxes.includes(n)||!before.has(n)));
      const leaves=[...new Set(lists.flatMap(b=>[...b.querySelectorAll(optionSelector)]))].filter(o=>visible(o)&&!disabled(o)&&/^(?:(?:company|employer) )?careers? (?:web ?site|site|page)$/.test(norm(text(o))));
      if(leaves.length===1){aliases.push(norm(text(leaves[0])));activate(leaves[0],true);leafChosen=true;continue;}
      if(lists.length)continue;
     }
     if(aliases.includes(norm(valueText(e)))&&e.getAttribute('aria-invalid')!=='true'&&(!query||input.value!==query||e.getAttribute('aria-expanded')!=='true'&&boxes.every(b=>!b.isConnected||!visible(b)))){accepted=true;break;}}
    if(boxes.some(b=>b.isConnected&&visible(b))){e.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));e.blur();}
    if(!accepted&&query&&input.isConnected&&input.value===query)setQuery('');
    if(accepted)filled++;else skipped++;
   }else{
    if(e.tagName==='SELECT'&&![...e.options].some(o=>o.value===f.value&&!o.disabled&&text(o)===f.display)){skipped++;continue;}
    if(isReply(e)&&e.hasAttribute('contenteditable')){
     e.textContent=f.value;e.dispatchEvent(new Event('input',{bubbles:true,composed:true}));
     if(e.isConnected&&text(e)===f.value)filled++;else skipped++;
     continue;
    }
    let fillValue=f.value;
    if(e.type==='date'||e.type==='month'||/^(YYYY-MM-DD|YYYY-MM|MM\/DD\/YYYY)$/i.test(e.placeholder||'')){
     const month=e.type==='month'||/^YYYY-MM$/i.test(e.placeholder||'');
     if(!(month?/^\d{4}-\d{2}$/:/^\d{4}-\d{2}-\d{2}$/).test(fillValue)||(e.min&&fillValue<e.min)||(e.max&&fillValue>e.max)){skipped++;continue;}
     const parsed=new Date(fillValue+(month?'-01':'' )+'T12:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,month?7:10)!==fillValue){skipped++;continue;}
     if(/^MM\/DD\/YYYY$/i.test(e.placeholder||''))fillValue=fillValue.slice(5,7)+'/'+fillValue.slice(8,10)+'/'+fillValue.slice(0,4);
    }
    const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(e,fillValue);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
    if(!isReply(e))e.dispatchEvent(new Event('blur',{bubbles:true}));await new Promise(r=>setTimeout(r,120));if(e.isConnected&&e.value===fillValue&&(!e.validity||e.validity.valid))filled++;else skipped++;
   }
  }
  return {filled,skipped};
 })();
}
export const scanForm=()=>formBridge({action:'scan'});
export const fillForm=options=>formBridge({...options,action:'fill'});
