import {memoryMatch} from './answer-memory.mjs?v=20261123.3';
import {commonQuestion,backgroundAnswer} from './common-questions.mjs?v=20261123.3';
import {answerRule} from './answer-rules.mjs?v=20261123.3';
import {portfolioAnswer} from './portfolio-answers.mjs?v=20261123.3';
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const skillKey=s=>normalize(String(s).toLowerCase().replace(/c\+\+/g,'cplusplus').replace(/c#/g,'csharp'));
const skillEquivalents={
 cad:['computer aided design','computer aided design cad','cad computer aided design'],
 fea:['finite element analysis','finite element analysis fea'],
 excel:['microsoft excel'],'3d printing':['3 d printing','three dimensional printing'],
 solidworks:['solidworks cad','solidworks 3d cad']
};
export function suggestField(field,profile,memory=[],origin='',context='',portfolio=null){
 if(!profile?.confirmed)return null;
 if(field.type==='skill-list'||field.type==='language-list'){
  const skills=field.type==='skill-list';
  const languages=profile.answers?.find(a=>normalize(a.question)==='languages spoken')?.answer||'';
  const values=skills?(portfolio?.skills||[]).map(s=>s.name):languages.split(/[,;]/).map(s=>s.trim());
  const aliasesFor=v=>[skillKey(v),...(skills?skillEquivalents[skillKey(v)]||[]:[])];
  const present=new Set((field.existing||[]).map(skillKey));
  const pending=[...new Set(values.filter(Boolean))].filter(v=>!aliasesFor(v).some(alias=>present.has(alias))).slice(0,skills?Math.max(0,10-present.size):20);
  return pending.length?{...(skills?{skillAliases:Object.fromEntries(pending.map(v=>[v,aliasesFor(v)]))}:{}),value:pending,display:pending.join(', '),reason:skills?'Skills documented on your résumé':'Languages in your confirmed profile',requiresReview:true}:null;
 }
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
 const parts=wording.trim().split(/\s+/),half=parts.length/2;
 if(Number.isInteger(half)&&normalize(parts.slice(0,half).join(' '))===normalize(parts.slice(half).join(' ')))field={...field,label:parts.slice(0,half).join(' ')};
 else field={...field,label:wording};
 const label=normalize(field.label).replace(/\b(required|optional)\b/g,'').trim();
 if(field.employmentEntry&&label!=='current professional title'&&profile.answers?.some(a=>commonQuestion(a.question)?.question==='Employment experience'&&normalize(a.answer)==='none'))return null;
 const common=commonQuestion(label),background=backgroundAnswer(label,profile,memory.filter(a=>a.scope==='*'||a.scope===origin&&a.context===context));
 const rule=answerRule(field,profile,memory,origin,context);if(rule?.blocked)return null;
 if(/^(in )?(what|which) country( region)?$/.test(label))return null;
 if((!label&&!rule)||(!rule&&!common&&!background&&/password|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|birth|social security|consent|agree|certify|signature|salary|compensation|gpa|completed|previous|\breference|emergency|guardian|parent|\breferr|manager|supervisor/.test(label)))return null;
 if(field.emailSave&&field.emailValue&&field.emailValue.toLowerCase()===profile.values?.email?.toLowerCase()&&!field.disabled)return {value:profile.values.email,display:profile.values.email,reason:'Save the matching email in this field'};
 if(!['text','email','tel','url','textarea','select-one','combobox','radio-group','checkbox-group','number','date','month'].includes(field.type)||(field.filled&&!(field.languageRow==='english'&&field.currentLevel==='basic'&&rule?.value==='Fluent'))||field.disabled)return null;
 const patterns={firstName:/^(legal )?(first|given) name$/,lastName:/^(legal )?(last name|family name|surname)$/,fullName:/^(legal |full |legal full )?name$/,email:/^(personal |primary |contact )?e ?mail( address)?$/,phone:/^(primary |contact |mobile |cell )?(phone|telephone)( number)?$/,city:/^(current |home )?city$/,state:/^(current |home )?(state|province|state province)$/,postalCode:/^(zip|postal|zip postal)( code)?$/,country:/^(current |home )?country( of residence)?$/,school:/^(current )?(university|school|college|school university|school or university|university college)( name)?$/,major:/^(major|field of study|academic major)$/,graduationYear:/^(expected |anticipated )graduation year$/,portfolio:/^(portfolio|personal website|portfolio website)( url| link)?$/,linkedin:/^linkedin( profile| account)?( url| link)?$/,github:/^github( profile)?( url| link)?$/};
 const fieldAliases={
  'email address username':'email','username email address':'email','state location':'state','location city':'city','city of residence':'city','town or city':'city',
  'discipline':'major','academic discipline':'major','primary field of study':'major',
  'school affiliation':'school','university affiliation':'school','college or university name':'school',
  'educational institution':'school','school name':'school','school or university name':'school','university or college':'school','major subject':'major','other website':'portfolio','personal portfolio url':'portfolio'
 };
 const directLabel=label.replace(/^(?:please (?:enter|provide|indicate) (?:us )?(?:your )?|what is your |what s your )/,'');
 // A country selector paired with a phone input may represent a calling code.
 if((label==='country'||/^(?:(?:phone(?: number)? )?country code|country phone code|phone country|country calling code|dial code)$/.test(label))&&(field.phoneCountry||/phone|dial|calling/i.test(field.id+' '+field.name+' '+label))){
  const num=String(profile.values.phone||'').replace(/\D/g,'');
  const us=/^(united states(?: of america)?|usa|us)$/.test(normalize(profile.values.country||background?.value));
  if(field.filled||field.disabled||!us||!/^1?\d{10}$/.test(num))return null;
  const aliases=['united states 1','united states of america 1','united states','us 1','1 united states','1 united states of america','united states us 1'];
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
 if(field.maxLength>0&&value?.length>field.maxLength)return null;
 if(field.type==='checkbox-group'){
  if(rule?.markIncomplete)return {value:'Not Completed',display:'Not Completed',selectedLabels:[field.options[0].label],reason:rule.reason,sourceQuestion:rule.sourceQuestion};
  // Only explicit region preferences are supported: never consent/attestation boxes.
  if(rule?.raceSelection){
   const asian=field.options.filter(o=>!o.disabled&&/^asian(?: united states(?: of america)?)?$/.test(normalize(o.label)));
   if(asian.length===1)return {value:[asian[0].value],display:asian[0].label,selectedLabels:[asian[0].label],sourceQuestion:rule.sourceQuestion};
  }
  if(common?.question!=='Preferred work regions')return null;
  const desired=value.split(';').map(normalize),matches=(field.options||[]).filter(o=>!o.disabled&&desired.includes(normalize(o.label)));
  if(matches.length!==desired.length||new Set(matches.map(o=>normalize(o.label))).size!==desired.length)return null;
  return {value:matches.map(o=>o.value),display:matches.map(o=>o.label).join('; '),selectedLabels:matches.map(o=>o.label),reason:'Your saved work-region preferences',requiresReview:false};
 }
 const confirmedMale=common?.question==='Sex'&&normalize(value)==='male'&&custom.length>0&&new Set(custom.map(a=>normalize(a.answer))).size===1;
 const review=rule?{reason:rule.reason,sourceQuestion:rule.sourceQuestion,requiresReview:rule.requiresReview}:{reason:confirmedMale?'Your confirmed profile answer':background?'Based on your confirmed background':common?.review?'Confirm this answer for this application':remembered?.reason,sourceQuestion:background?background.sourceQuestion:common?.review?common.question:remembered?.question,requiresReview:!confirmedMale&&(!!common?.review||!!background||!!remembered?.requiresReview)};
 if(field.type==='select-one'||field.type==='combobox'||field.type==='radio-group'){
  const aliases=rule?.aliases||(key==='state'&&normalize(value)==='new jersey'?['new jersey','nj']:(key==='country'||background?.value==='United States')&&['us','usa','united states','united states of america'].includes(normalize(value))?['united states','united states of america','us','usa']:common?.question==='Highest completed degree'&&normalize(value)==='high school diploma'?['high school diploma','high school diploma or equivalent','high school diploma ged','high school or equivalent']:[normalize(value)]);
  if(common?.question==='Street address'&&profile.values.city&&profile.values.state&&profile.values.postalCode){
   const state=normalize(profile.values.state),states=state==='new jersey'?['nj',state]:[state];
   for(const region of states)aliases.push(normalize([value,profile.values.city,region,profile.values.postalCode].join(' ')));
  }
  const sourceTree=common?.question==='How did you hear about this position?'&&normalize(value)==='company website';
  const sourceFallbacks=sourceTree&&profile.answers?.some(a=>a.question==='Application source fallbacks'&&a.answer==='LinkedIn or Indeed, then a career fair');
  if(sourceFallbacks){
   const fallback=['linkedin','linked in','indeed','indeed com','job board','job boards','job board job search site','career fair','job fair','recruiting event','career fair recruiting event'];
   const university=aliases.findIndex(a=>a.startsWith('university'));
   aliases.splice(university<0?aliases.length:university,0,...fallback);
   for(const option of field.options||[]){
    const name=normalize(option.label);
    if(/\bcareers? (?:web ?site|page|site)$/.test(name))aliases.unshift(name);
   }
  }
  if(rule?.confirmUSPersons&&field.type==='select-one'){
   const choices=field.options.filter(o=>!o.disabled&&o.value&&!/^(?:please )?(?:select|choose)\b/.test(normalize(o.label)));
   if(choices.length===1)return {value:choices[0].value,display:choices[0].label,...review};
  }
  if(rule?.careerSiteDetail&&field.type==='select-one'){
   const candidates=field.options.filter(o=>!o.disabled&&o.value&&/\b(?:careers? (?:web)?site|careers? page|company website)$/.test(normalize(o.label)));
   if(candidates.length===1)return {value:candidates[0].value,display:candidates[0].label,...review};
  }
  if(field.type==='combobox')return {value,display:sourceFallbacks?'Company career site, then LinkedIn or Indeed, then career fair':value,aliases,...(rule?.confirmUSPersons?{confirmUSPersons:true}:{}),...(rule?.careerSiteDetail?{careerSiteDetail:true}:{}),...(sourceTree?{sourceTree:true,sourceFallbacks}: {}),...review};
  const matches=(field.options||[]).filter(o=>!o.disabled&&(aliases.includes(normalize(o.label))||field.type!=='radio-group'&&aliases.includes(normalize(o.value))));if(rule?.aliases&&matches.length>1){matches.sort((a,b)=>aliases.indexOf(normalize(a.label))-aliases.indexOf(normalize(b.label)));if(normalize(matches[0].label)!==normalize(matches[1].label))matches.splice(1);}if(matches.length!==1)return null;return {value:matches[0].value,display:matches[0].label,...review};
 }
 return {value,display:value,...review};
}

// Self-contained: the popup injects this same bridge for scan, remember and fill.
export function formBridge({action='scan',url,fields=[],origins=[]}={}){
 if(action==='scan-chat'&&!origins.includes(location.origin))return null;
 if(action==='scan-frame'){if(!origins.includes(location.href))return null;action='scan';}
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
 const labelled=e=>(e?.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>text(e.getRootNode?.().getElementById?.(id)||document.getElementById(id))).join(' ');
 const radioSelector='input[type="radio"],[role="radio"]';
 const choiceVisible=e=>visible(e)||[...(e.labels||[]),e.closest('label')].some(l=>l&&visible(l))||radio(e)&&e.parentElement?.querySelectorAll(radioSelector).length===1&&visible(e.parentElement)&&!!e.parentElement.querySelector('svg,[role="img"]');
 const group=e=>{const explicit=e.closest('[role="radiogroup"],fieldset')||e.closest('[role="group"]');if(explicit)return explicit;
  if(radio(e)){
   if(e.name)return null;
   for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){
    const rows=[...p.querySelectorAll(radioSelector)];if(rows.length===1&&!p.querySelector('select,textarea,input:not([type=radio]):not([type=hidden])')&&[...p.querySelectorAll('label,p,legend,span,div')].some(node=>!node.querySelector(controls)&&/^i understand that i may be considered for other open positions in my country\b/.test(norm(text(node)))))return p;if(rows.length<2)continue;
    if(rows.some(r=>r.name||r.closest('[role="radiogroup"],fieldset'))||p.querySelector('textarea,select,input:not([type="radio"]):not([type="hidden"])'))return null;
    return p;
   }
   return null;
  }let p=e.parentElement;for(let i=0;i<6&&p&&p!==document.body;i++,p=p.parentElement){if(p.querySelectorAll('input:not([type="checkbox"]),select,textarea').length)break;if(p.querySelectorAll('input[type="checkbox"]').length>1&&p.querySelector('p,legend,label:not([for]),[aria-labelledby],.question-label,.form-label,.control-label'))return p;}return null;};
 const radios=e=>{if(checkbox(e)&&norm(ownLabel(e))==='not completed')return [e];const g=group(e),selector=checkbox(e)?'input[type="checkbox"]':'input[type="radio"],[role="radio"]';return [...(g||e.form||e.getRootNode?.()||document).querySelectorAll(selector)].filter(r=>g?group(r)===g&&(checkbox(e)||g.getAttribute('role')==='radiogroup'||!e.name||r.name===e.name):!!e.name&&r.name===e.name&&r.form===e.form);};
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
 const groupPrompt=g=>{
  if(!g)return '';
  for(let node=g;node&&node!==document.body;node=node.parentElement){
   for(let previous=node.previousElementSibling;previous;previous=previous.previousElementSibling){
    if(previous.matches(controls)||previous.querySelector(controls))return '';
    const prompt=text(previous).trim();if(!prompt)continue;
    if(prompt.length<=800&&(/\?\s*\*?$/.test(prompt)||/^(?:select the races|please check one of the boxes|i understand that i may be considered for other open positions|ethnicity\s*\*?$|title$)/i.test(prompt)))return prompt;
    if(prompt.length>50||previous.matches('h1,h2,h3'))return '';
   }
  }
  return '';
 };
 const label=e=>{
  if(/^education-.+--(?:first|last)YearAttended-dateSectionYear-input$/i.test(e.id))return /--firstYear/i.test(e.id)?'From':'To (Actual or Expected)';
  if(isReply(e))return chatQuestion(e);
  if(e.matches('input[type=url],input[type=text]')&&/^(?:url|website url|website|link)$/.test(norm(ownLabel(e)))&&sectionFor('websites')?.contains(e))return 'Portfolio URL';
  const wrapper=e.closest('[data-automation-id^="formField-"]');
  const fieldLabel=wrapper?.querySelector('[data-automation-id="formLabel"],legend')||wrapper?.querySelector('label');
  if(fieldLabel&&(!choice(e)||!fieldLabel.contains(e))){const value=labelText(fieldLabel);if(value&&!/^(yes|no)$/i.test(value))return value;}
  if(e.matches('.iti__selected-country,.iti__selected-flag,.selected-flag'))return 'Country';
  if(checkbox(e)&&norm(ownLabel(e))==='not completed')return ownLabel(e);
  if(choice(e)){const g=group(e),single=g&&[...g.querySelectorAll('input[type="radio"],[role="radio"],input[type="checkbox"]')].every(r=>radios(e).includes(r));return (single&&(g.getAttribute('aria-label')||labelled(g)||text(g.querySelector('legend')))||groupPrompt(g)||nearbyLabel(e)).trim().slice(0,800);}return (ownLabel(e)||(custom(e)&&e.querySelector('input')?ownLabel(e.querySelector('input')):'')||(original(e)?ownLabel(original(e)):'')||nearbyLabel(e)||e.placeholder||'').trim().slice(0,800);};
 let shadowEditors=null;
 const elements=()=>{
  const list=[...document.querySelectorAll(controls)];
  const shadowReplies=root=>{for(const host of root.querySelectorAll('*'))if(host.shadowRoot){
   shadowEditors.push(...host.shadowRoot.querySelectorAll(controls));shadowReplies(host.shadowRoot);
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
 const originalOptionLabel=e=>{const associated=[...(e.labels||[])];const root=associated[0]||e.closest('label');if(root){const copy=root.cloneNode(true);const described=(e.getAttribute('aria-describedby')||'').split(/\s+/);for(const n of copy.querySelectorAll('input,[role="radio"],p,small,.description,.help-block,[id]'))if(n.matches('input,[role="radio"],p,small,.description,.help-block')||described.includes(n.id))n.remove();const value=text(copy).split('\n').map(s=>s.trim()).find(Boolean);if(value)return value;}return ownLabel(e)||text(e)||e.value||'';};
 const optionLabel=e=>{
  const raw=originalOptionLabel(e);
  for(const v of [raw,e.getAttribute('aria-label'),labelled(e),e.parentElement?.getAttribute('aria-label')]){
   const yn=String(v||'').trim().match(/^(yes|no)(?:\s*[,.-]?\s*(?:option\s+)?\d+\s+of\s+\d+)?[.\s]*$/i);
   if(yn)return yn[1];
  }
  return raw;
 };
 const placeholder=value=>!value||/^(select|choose|please select|select an? option|select one|select an? answer|please choose)([ .…]*)$/i.test(value.trim());
 const empty=e=>/^education-.+--(?:first|last)YearAttended-dateSectionYear-input$/i.test(e.id)&&/^(?:0+|yyyy)$/i.test(e.value)?true:isReply(e)?!(e.value||e.textContent||'').trim():choice(e)?!selectedRadio(e):custom(e)?placeholder(selectedValue(e)):!e.value||(e.tagName==='SELECT'&&e.selectedIndex===0&&/select|choose|please|^\s*\[.+\]\s*$/i.test(text(e.options[0])));
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
  if(/^(reading|speaking|writing|understanding|listening)$/.test(wording)){
   for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){
    const langs=[...p.querySelectorAll(controls)].filter(c=>/^(language|language name)$/.test(norm(label(c)))&&visible(c));
    if(langs.length)return {languageRow:langs.length===1?norm(valueText(langs[0])):'',currentLevel:norm(valueText(e))};
   }
  }
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
  if(/^(?:(?:phone(?: number)? )?country code|country)$/.test(wording.replace(/ required$/,''))||e.matches('.iti__selected-country,.iti__selected-flag,.selected-flag')){
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
  if(/\bvisa assistance\b/.test(wording)){
   const all=elements(),recent=all.slice(Math.max(0,all.indexOf(e)-3),all.indexOf(e)).map(c=>norm(label(c)));
   if(recent.some(s=>/right to work in (?:the )?(?:us|u s|united states)$/.test(s))&&!recent.some(s=>/work in /.test(s)&&!/work in (?:the )?(?:us|u s|united states)$/.test(s)))return {workQuestionCountry:'United States'};
  }
  const q=norm(label(e));if(!/not completed|degree|gpa|grade point|overall result|field of study|^from$|^to actual or expected$|^start date$|^end date actual or expected$|^source detail|please specify|academic standing details/.test(q))return {parentAnswer:'',parentQuestion:'',educationSchool:''};
  const all=elements(),before=all.slice(0,all.indexOf(e));let parentAnswer='',parentQuestion='',educationSchool='';
  if(/^source details?$|^if .+ please specify$/.test(q)){const parents=before.filter(c=>/^how (did|do) you (hear|learn|find out) about/.test(norm(label(c))));const last=parents.at(-1);if(last&&!empty(last))parentAnswer=valueText(last);}
  if(/^(please specify|other please specify|academic standing details)$/.test(q)){const last=before.at(-1);if(last&&!empty(last)&&/current academic standing/.test(norm(label(last)))){parentAnswer=valueText(last);parentQuestion=label(last);}}
  if(/not completed|degree|gpa|grade point|overall result|field of study|^from$|^to actual or expected$|^start date$|^end date actual or expected$/.test(q)){
   let container=e.parentElement;for(let n=0;n<7&&container&&container!==document.body;n++,container=container.parentElement){
    const schools=all.filter(c=>container.contains(c)&&/^(school or university|school university|school|university|college)( name)?$/.test(norm(label(c))));
    if(schools.length>1)break;if(schools.length===1){educationSchool=valueText(schools[0])||schools[0].value||'';break;}
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
 const emailSave=e=>{
  if(!e.matches('input[type=email],input[type=text]')||!/^e ?mail(?: address)?$/.test(norm(label(e))))return null;
  for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){
   if(p.querySelectorAll('input:not([type=hidden]),select,textarea').length!==1)break;
   const actions=[...p.querySelectorAll('button,[role=button]')].filter(b=>visible(b)&&!b.disabled&&!(b.form&&b.type==='submit'));
   const caption=b=>norm(b.getAttribute('aria-label')||b.title||text(b));
   const saves=actions.filter(b=>/^(?:(?:save|confirm)(?: (?:email(?: address)?|changes|your changes))?|done editing(?: your)? email(?: address)?)$/.test(caption(b)));
   if(saves.length===1&&actions.some(b=>/^(?:cancel|undo|revert)(?: |$)/.test(caption(b))))return saves[0];
  }
  return null;
 };
 const snapshot=(e,index)=>({index,label:label(e),type:type(e),name:e.name||'',id:e.id||'',maxLength:e.maxLength,filled:!empty(e),disabled:!!disabled(e),required:!!e.required||e.getAttribute('aria-required')==='true'||label(e).includes('*')||!!e.closest('[aria-required="true"]'),placeholder:e.placeholder||'',min:e.min||'',max:e.max||'',...context(e),...(e.value&&emailSave(e)?{emailSave:true,emailValue:e.value}:{}),options:e.tagName==='SELECT'?[...e.options].map(o=>({value:o.value,label:text(o),disabled:o.disabled})):choice(e)?radios(e).map((r,i)=>({value:String(i),label:optionLabel(r),disabled:!!disabled(r)})):undefined});
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const sectionFor=name=>{
  const headings=[...document.querySelectorAll('h1,h2,h3,h4,h5,[role="heading"]')].filter(h=>visible(h)&&norm(text(h))===name);
  if(headings.length!==1)return null;
  for(let p=headings[0].parentElement;p&&p!==document.body;p=p.parentElement){
   if(p.querySelector(name==='skills'?'input:not([type=hidden])':'button,input:not([type=hidden]),select,[role="combobox"]')){
    const other=[...p.querySelectorAll('h1,h2,h3,h4,h5,[role="heading"]')].some(h=>h!==headings[0]&&!/^languages? \d+$/i.test(text(h)));
    return other?null:p;
   }
  }
  return null;
 };
 const chipValues=p=>[...p.querySelectorAll('[data-automation-id="selectedItem"],[data-automation-id="selectedItemLabel"],[data-item],.item[data-value],.select2-selection__choice,[class*="multiValueLabel"]')].flatMap(n=>{
  if(n.querySelector('[data-automation-id="selectedItemLabel"]'))return [];
  const copy=n.cloneNode(true);for(const child of copy.querySelectorAll('button,svg,[aria-hidden=true]'))child.remove();
  const value=(text(copy)||n.getAttribute('data-value')||'').replace(/^[×✕]\s*/,'').trim();return value?[value]:[];
 });
 const skillInput=p=>[...p.querySelectorAll('input:not([type=hidden]):not([type=checkbox])')].find(e=>visible(e)&&!disabled(e)&&(/skills/i.test(label(e)+' '+e.id)||e.getAttribute('data-automation-id')==='searchBox'));
 const languageInputs=p=>elements().filter(e=>p.contains(e)&&visible(e)&&!disabled(e)&&!choice(e)&&/^(language|select language)$/.test(norm(label(e))));
 const languageAdd=p=>[...p.querySelectorAll('button')].find(b=>visible(b)&&!disabled(b)&&(!b.form||b.type==='button')&&/^(add|add another|add language)$/i.test(text(b)));
 const listFields=()=>{
  const fields=[],skills=sectionFor('skills'),languages=sectionFor('languages');
  if(skills&&skillInput(skills))fields.push({type:'skill-list',label:'Skills',existing:chipValues(skills)});
  if(languages&&(languageAdd(languages)||languageInputs(languages).length))fields.push({type:'language-list',label:'Languages',existing:languageInputs(languages).filter(e=>!empty(e)).map(valueText)});
  return fields;
 };
 async function fillLanguages(values){
  for(const value of values){
   const section=sectionFor('languages');if(!section||location.href!==url)return false;
   let inputs=languageInputs(section);
   if(inputs.some(e=>!empty(e)&&norm(valueText(e))===norm(value)))continue;
   if(!inputs.some(empty)){
    const add=languageAdd(section);if(!add)return false;
    add.click();
    for(let i=0;i<20;i++){await pause(75);const next=sectionFor('languages');inputs=next?languageInputs(next):[];if(inputs.some(empty))break;}
   }
   const blanks=inputs.filter(empty);if(blanks.length!==1)return false;
   const target=blanks[0],field=snapshot(target,elements().indexOf(target));
   let answer={value,display:value,aliases:[norm(value)]};
   if(target.tagName==='SELECT'){const options=field.options.filter(o=>!o.disabled&&norm(o.label)===norm(value));if(options.length!==1)return false;answer={value:options[0].value,display:options[0].label};}
   const result=await formBridge({action:'fill',url,fields:[{...field,...answer}]});
   if(!result.filled)return false;
  }
  return true;
 }
 async function fillSkills(values,skillAliases={}){
  let complete=true;
  for(const value of values){
   const section=sectionFor('skills'),e=section&&skillInput(section);if(!e||location.href!==url)return false;
   const skillKey=s=>s.toLowerCase().replace(/c\+\+/g,'cplusplus').replace(/c#/g,'csharp').replace(/[^a-z0-9]+/g,' ').trim();
   const aliases=new Set(skillAliases[value]||[skillKey(value)]);
   const committed=()=>{const p=sectionFor('skills');return !!p&&chipValues(p).some(s=>aliases.has(skillKey(s)));};
   if(committed())continue;
   if(e.value.trim())return false;
   const write=v=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));};
   const menus='[role="listbox"],[data-automation-id="activeListContainer"],[data-automation-id="promptOptionsContainer"]';
   const before=new Set([...document.querySelectorAll(menus)].filter(visible));
   e.focus();write(value);
   let clicked=false;
   for(let i=0;i<20&&!committed();i++){
    await pause(75);if(!e.isConnected||location.href!==url)return false;
    const id=e.getAttribute('aria-controls')||e.getAttribute('aria-owns');
    const panels=[...document.querySelectorAll(menus)].filter(p=>visible(p)&&(p.id===id||section.contains(p)||!before.has(p)));
    const inner=panels.filter(p=>!panels.some(n=>n!==p&&p.contains(n)));
    const panel=panels.find(p=>p.id&&p.id===id)||(inner.length===1?inner[0]:null);
    const rows=panel?[...panel.querySelectorAll('[role="option"],[data-automation-id="promptOption"],[data-automation-id="menuItem"],[data-automation-id="promptLeafNode"],li')].filter(o=>visible(o)&&!disabled(o)):[];
    const matches=rows.filter(o=>aliases.has(skillKey(text(o))));
    const options=matches.filter(o=>!matches.some(n=>n!==o&&o.contains(n)));
    if(!clicked&&options.length===1){activate(options[0],true);clicked=true;}
    else if(!clicked&&i===4&&!rows.length){for(const event of ['keydown','keyup'])e.dispatchEvent(new KeyboardEvent(event,{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true}));}
   }
   if(!committed()){if(e.value===value)write('');e.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));complete=false;}
  }
  return complete;
 }
 if(action==='advance'){
  if(location.href!==url||document.querySelector('input[type=password]'))return false;
  const heading=[...document.querySelectorAll('h1,h2,[aria-current=step]')].filter(visible).map(text).join(' ');
  if(/review and submit|review your application|submit application|certification|signature/i.test(heading))return false;
  const buttons=[...document.querySelectorAll('button,input[type=button],input[type=submit]')].filter(b=>visible(b)&&!disabled(b));
  if(buttons.some(b=>/submit (?:my |your )?application|finish application/i.test(text(b)||b.value)))return false;
  const next=buttons.filter(b=>/^(?:save (?:and|&) continue|continue|next(?: step| section)?)$/i.test((text(b)||b.value||'').trim()));
  if(next.length!==1)return false;
  const current=document.querySelector('[aria-current="step"],[data-automation-id="progressBarActiveStep"]');
  if(current&&/review|submit|certif|signature|final/i.test(text(current)))return false;
  if(next[0].type==='submit'&&!/save (?:and|&) continue/i.test(text(next[0])||next[0].value)&&!current)return false;
  if(next[0].form&&!next[0].form.checkValidity()||[...document.querySelectorAll('[aria-invalid=true]')].some(visible))return false;
  next[0].click();return true;
 }
 if(action==='prepare-education'){
  const sites=sectionFor('websites');
  if(sites&&!sites.querySelector('input:not([type=hidden]),a[href^="http"]')){
   const adds=[...sites.querySelectorAll('button')].filter(b=>visible(b)&&!disabled(b)&&(!b.form||b.type==='button')&&norm(text(b))==='add');
   if(adds.length===1)adds[0].click();
  }
  const buttons=[...document.querySelectorAll('button')].filter(b=>visible(b)&&!b.disabled&&!b.matches('[type="submit"]')&&(!b.form||b.type==='button')&&/^(?:\+\s*)?add(?: education(?: history)?)?$/i.test(text(b)));
  const education=buttons.filter(b=>{
   for(let section=b.parentElement;section&&section!==document.body;section=section.parentElement){
    const headings=[...section.querySelectorAll('h1,h2,h3,h4,h5,legend,[role="heading"]')].filter(visible);
    if(!headings.length)continue;
    if(norm(text(b))==='add education'&&headings.some(h=>/^(?:work and education history|education(?: history)?)$/.test(norm(text(h)))))
     return !section.querySelector('input:not([type=hidden]),select,textarea,[role=combobox],[data-education-entry],[aria-label*="Edit education" i], [class*="timeline-item"]:not([class*="year"])')&&
      ![...section.querySelectorAll('h3,h4,li,[role=listitem]')].some(row=>/\b(?:university|bachelor|diploma|school of)\b/i.test(text(row)));
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
  if(!countries.size)for(const node of document.querySelectorAll('[itemprop=jobLocation],[data-automation-id=locations],[data-bind="html: primaryLocation"],[data-job-location]')){const loc=node.getAttribute('data-job-location')||text(node);if(loc&&loc.length<120)countries.add(loc);}
  const jobLocation=countries.size===1?[...countries][0]:'';
  const all=elements();return {url:location.href,jobLocation,needsEmailVerification:!!document.querySelector('input[type=password]')&&/please verify your account|verify your account before you sign in|verify your email before/i.test(text(document.body)),fields:all.map(snapshot).filter(f=>choice(all[f.index])?choiceVisible(all[f.index]):visible(all[f.index])).concat(listFields()),applicationFrames:[...document.querySelectorAll('iframe[src]')].filter(visible).flatMap(frame=>{try{const u=new URL(frame.src,location.href);return u.origin===location.origin&&u.protocol==='https:'?[u.href]:[];}catch{return [];}}),chatFrames:[...document.querySelectorAll('iframe[src]')].filter(visible).flatMap(frame=>{
   try{const u=new URL(frame.src,location.href);return u.protocol==='https:'&&(/(^|\.)paradox\.ai$/.test(u.hostname)||/\b(chat|chatbot|olivia)\b/i.test([frame.title,frame.id,frame.name].join(' ')))?[u.origin]:[];}catch{return [];}
  }),hasEmailSignIn:[...document.querySelectorAll('h1,h2,h3,[role=heading]')].some(h=>visible(h)&&/^(?:sign in|log in)$/i.test(text(h))),hasPasswordField:!!document.querySelector('input[type=password i]'),embeddedForms:document.querySelectorAll('iframe').length};
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
   if(f.type==='skill-list'||f.type==='language-list'){
    if(location.href===url&&Array.isArray(f.value)&&(await (f.type==='skill-list'?fillSkills:fillLanguages)(f.value,f.skillAliases)))filled++;else skipped++;
    continue;
   }
   const all=elements();let e=all[f.index];
   if(f.id&&e?.id!==f.id){const matches=all.filter(c=>c.id===f.id);e=matches.length===1?matches[0]:null;}
   if(f.emailSave&&e?.isConnected&&location.href===url&&label(e)===f.label&&e.value===f.emailValue&&e.value.toLowerCase()===String(f.value).toLowerCase()){
    const save=emailSave(e);if(save){save.click();await pause(150);if(!e.isConnected||!emailSave(e))filled++;else skipped++;}else skipped++;
    continue;
   }
   if(location.href!==url||!e||!e.isConnected||(!empty(e)&&!(f.languageRow==='english'&&f.currentLevel==='basic'&&context(e).languageRow==='english'&&norm(valueText(e))==='basic'&&f.display==='Fluent'))||disabled(e)||!(choice(e)?choiceVisible(e):visible(e))||label(e)!==f.label||type(e)!==f.type||(e.name||'')!==f.name||(e.id||'')!==f.id){skipped++;continue;}
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
    const boxSelector='[class*="__menu-list"],[id^="react-select-"][id$="-listbox"],[role="listbox"],[role="menu"],[role="tree"],[role="grid"],[data-automation-id="activeListContainer"],[data-automation-id="promptOptionsContainer"],.iti__country-list,.country-list,[class$="-menu-list"],.ng-dropdown-panel,.select2-results__options,.mat-select-panel,.dropdown-menu,.selectize-dropdown,.ui-select-choices,.ts-dropdown';
    const optionSelector='[class*="__option"],[id^="react-select-"][id*="-option-"],[role="option"],[role="gridcell"][aria-selected],[role="treeitem"],[data-automation-id="menuItem"],[data-automation-id="promptOption"],[data-automation-id="promptLeafNode"],.iti__country,.country[data-country-code],[class$="-option"],.ng-option,.select2-results__option,mat-option,[role="menuitem"],li,[tabindex]:not([tabindex="-1"]),[data-selectable],.ui-select-choices-row';
    const before=new Set([...document.querySelectorAll(boxSelector)].filter(visible));
    const opener=e.matches('.ui-select-container')?(e.querySelector('.ui-select-toggle,.ui-select-match')||e):e;e.focus();if(e.getAttribute('aria-expanded')!=='true')activate(opener);if(e.getAttribute('aria-expanded')!=='true')e.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));
    let boxes=[];
    const searchInput=e.matches('input:not([readonly])')?e:e.querySelector('input:not([readonly]):not([type="hidden"])');
    const searchableAddress=/^(?:current |home )?(?:country(?: of residence)?|state(?: province)?|province|city|county|postal code|zip(?: code)?|address line 1)$/.test(norm(f.label));
    const writeSearch=value=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(searchInput,value);searchInput.dispatchEvent(new Event('input',{bubbles:true,composed:true}));};
    let initialQuery='';
    for(let attempt=0;attempt<15;attempt++){
     if(location.href!==url||!e.isConnected)break;
     const ids=((e.getAttribute('aria-controls')||'')+' '+(e.getAttribute('aria-owns')||'')).trim().split(/\s+/).filter(Boolean);
     boxes=ids.map(id=>e.getRootNode().getElementById?.(id)||document.getElementById(id)).filter(n=>n&&visible(n));
     if(!boxes.length){const local=e.closest('[data-automation-id^="formField-"],.iti,.react-tel-input,.intl-tel-input,.selectize-control,.ui-select-container,.ts-wrapper');if(local)boxes=[...local.querySelectorAll(boxSelector)].filter(visible);}
     if(!boxes.length&&e.parentElement?.querySelectorAll(comboSelector).length===1)boxes=[...e.parentElement.querySelectorAll(boxSelector)].filter(visible);
     if(!boxes.length)boxes=[...document.querySelectorAll(boxSelector)].filter(n=>visible(n)&&!before.has(n));
     boxes=boxes.filter((b,i,all)=>!all.some(other=>other!==b&&other.contains(b)));
     if(boxes.length===1&&boxes[0].querySelector(optionSelector))break;
     if(attempt===2&&searchInput&&searchableAddress&&!searchInput.value&&!f.phoneCountry){initialQuery=String(f.value);writeSearch(initialQuery);}
     await new Promise(r=>setTimeout(r,80));
    }
    const aliases=[...(f.aliases||[norm(f.value)])];const readOptions=()=>boxes.length===1?[...boxes[0].querySelectorAll(optionSelector)].filter(o=>visible(o)&&!disabled(o)&&!o.classList.contains('ng-option-disabled')).filter(o=>!o.matches('input,textarea')&&!o.matches('[role="listbox"],[role="tree"],[role="menu"]')).filter((o,i,all)=>!all.some(other=>other!==o&&o.contains(other)&&norm(text(o))===norm(text(other)))):[];
    const optionKey=o=>f.phoneCountry&&o.getAttribute('data-country-code')?.toLowerCase()==='us'&&/\+1\b/.test(text(o))?'united states 1':norm(text(o));
    let available=readOptions();
    // Address pickers may fetch rows only after a search. A search term is never itself a selection.
    const isAddressPicker=searchableAddress;
    const input=searchInput;
    const query=initialQuery||(input&&isAddressPicker&&!f.phoneCountry&&boxes.length===1&&!input.value&&!available.some(o=>aliases.includes(optionKey(o)))?String(f.value):'');
    const setQuery=writeSearch;
    if(query){
     if(!initialQuery)setQuery(query);
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
    const brand=/\.myworkdayjobs\.com$/.test(location.hostname)?norm(location.hostname.split('.')[0]):'';
    if(f.sourceTree){
     const direct=available.filter(o=>/\bcareers? (?:web ?site|page|site)$/.test(optionKey(o)));
     if(direct.length===1)aliases.unshift(optionKey(direct[0]));
     if(brand&&available.some(o=>optionKey(o)===brand))aliases.unshift(brand);
    }
    const options=available.filter(o=>aliases.includes(optionKey(o)));
    if(f.phoneCountry&&options.length>1&&options.every(o=>optionKey(o)==='united states 1'))options.splice(1);
    if(options.length>1&&aliases.length>1){options.sort((a,b)=>aliases.indexOf(norm(text(a)))-aliases.indexOf(norm(text(b))));if(norm(text(options[0]))!==norm(text(options[1])))options.splice(1);}
    // An open menu's option text must not be mistaken for an existing selection.
    if(location.href!==url||!e.isConnected||options.length!==1){if(query&&input.isConnected&&input.value===query&&!/^address line 1\s*\*?$/i.test(f.label.trim()))setQuery('');e.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));e.blur();skipped++;continue;}
    options[0].scrollIntoView?.({block:'nearest'});activate(options[0],true);let accepted=false,leafChosen=false;
    const rootChoice=optionKey(options[0]);
    const branchKind=name=>name===brand||/^(?:company|corporate|our) web ?site$/.test(name)?'company':/^job boards?$/.test(name)?'board':/^recruiting event$/.test(name)?'event':'';
    let sourceBranch=f.sourceTree&&branchKind(rootChoice),tried=new Set([rootChoice]);

    for(let attempt=0;attempt<10;attempt++){await new Promise(r=>setTimeout(r,80));if(location.href!==url||!e.isConnected)break;if(sourceBranch&&!leafChosen){
      const lists=[...document.querySelectorAll(boxSelector)].filter(n=>visible(n)&&(boxes.includes(n)||!before.has(n)));
      const nodes=[...new Set(lists.flatMap(b=>[...b.querySelectorAll(optionSelector)]))].filter(o=>visible(o)&&!disabled(o));
      const names=sourceBranch==='board'?['linkedin','linked in','indeed','indeed com']:sourceBranch==='event'?['career fair','job fair','university career fair']:['job search','company careers website','company career site','careers website','careers site',brand+' career site',brand+' careers site'];
      const matches=nodes.filter(o=>names.includes(optionKey(o))||sourceBranch==='company'&&/\bcareers? (?:web ?site|page|site)$/.test(optionKey(o)));
      const leaf=matches.find(o=>!matches.some(x=>x!==o&&o.contains(x)));
      if(leaf){aliases.push(optionKey(leaf));activate(leaf,true);leafChosen=true;continue;}
      if(f.sourceFallbacks&&attempt>=2&&nodes.length){
       const next=['job board','job boards','recruiting event'].find(name=>!tried.has(name)&&nodes.some(o=>optionKey(o)===name));
       if(next){tried.add(next);sourceBranch=branchKind(next);activate(nodes.find(o=>optionKey(o)===next),true);continue;}
       const back=lists.flatMap(b=>[...b.querySelectorAll('button,[role="button"],[data-automation-id*="Back"],[data-automation-id*="back"]')]).find(n=>visible(n)&&/back/i.test([n.getAttribute('aria-label'),n.getAttribute('data-automation-id'),text(n)].join(' ')));
       if(back)activate(back,true);
      }
      if(lists.length)continue;
     }
     if(!(sourceBranch==='company'&&brand&&rootChoice===brand&&!leafChosen)&&(aliases.includes(norm(valueText(e)))||(f.phoneCountry&&/^\+1$/.test(valueText(e))&&boxes.every(b=>!b.isConnected||!visible(b))))&&e.getAttribute('aria-invalid')!=='true'&&(!query||input.value!==query||e.getAttribute('aria-expanded')!=='true'&&boxes.every(b=>!b.isConnected||!visible(b)))){accepted=true;break;}}
    if(boxes.some(b=>b.isConnected&&visible(b))){e.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));e.blur();}
    if(!accepted&&query&&input.isConnected&&input.value===query&&!/^address line 1$/i.test(f.label.trim()))setQuery('');
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
    if(e.value===fillValue&&/^e ?mail(?: address)?$/.test(norm(f.label))){await pause(80);emailSave(e)?.click();}
    if(!isReply(e))e.dispatchEvent(new Event('blur',{bubbles:true}));await new Promise(r=>setTimeout(r,120));if(e.isConnected&&e.value===fillValue&&(!e.validity||e.validity.valid))filled++;else skipped++;
   }
  }
  return {filled,skipped};
 })();
}
export const scanForm=()=>formBridge({action:'scan'});
export const fillForm=options=>formBridge({...options,action:'fill'});
