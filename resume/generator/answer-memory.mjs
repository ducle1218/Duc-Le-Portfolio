export const normalizeQuestion=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/\+/g,' plus ').replace(/#/g,' sharp ').replace(/%/g,' percent ').replace(/-(?=\d)/g,' minus ').replace(/(\d)\.(?=\d)/g,'$1 decimal ').replace(/[^a-z0-9]+/g,' ').replace(/\b(required|optional)\b/g,'').replace(/\s+/g,' ').trim();
export const privateQuestion=q=>/password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(normalizeQuestion(q));
// Deliberately small equivalence groups. Do not infer similarity from shared keywords:
// "can travel" and "cannot travel", dates, years, and percentages must not collapse.
const equivalents=[
 ['when can you start','when are you available to start','what is your earliest start date','what is your earliest available start date','earliest start date','available start date','availability to start','when would you be available to start'],
 ['are you willing to relocate','are you open to relocation','would you be willing to relocate','willing to relocate','open to relocation'],
 ['are you willing to travel','are you open to travel','would you be willing to travel','willing to travel'],
 ['what is your preferred name','preferred name','what name do you prefer to go by'],
 ['what is your preferred contact method','preferred contact method','how do you prefer to be contacted'],
];
export function questionConcept(question){const q=normalizeQuestion(question);const i=equivalents.findIndex(group=>group.includes(q));return i<0?null:'equivalent-'+i;}
export function employerSpecific(question){return /\b(this|our|your) (company|organization|organisation|role|position|team)|why.*(join|work|interested)|how.*hear|job.*(id|reference)/i.test(question);}
export function cleanMemory(input){
 if(!Array.isArray(input)||input.length>200)throw new Error('Keep up to 200 saved answers.');
 return input.map(item=>{
  const question=String(item.question||'').trim(),answer=String(item.answer||'').trim();
  if(!question||question.length>250||!answer||answer.length>1500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(question+answer)||privateQuestion(question))throw new Error('Choose a supported question and an answer under 1,500 characters. Sensitive and legal questions stay manual.');
  const origin=value=>{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.origin!==value)throw new Error('Invalid employer origin.');return u.origin;};
  const scope=item.scope==='*'?'*':origin(item.scope);const sourceOrigin=item.sourceOrigin?origin(item.sourceOrigin):'';const sourceContext=String(item.sourceContext||item.context||'').trim().slice(0,400),context=scope==='*'?'':String(item.context||sourceContext).trim().slice(0,400);
  if(scope!=='*'&&!context)throw new Error('Employer-specific answers need a connected company or page. Choose All employers only if the answer applies everywhere.');
  return {id:scope+'\n'+context+'\n'+normalizeQuestion(question),question,answer,scope,context,sourceContext,sourceOrigin,updatedAt:Number.isFinite(Date.parse(item.updatedAt))?new Date(item.updatedAt).toISOString():new Date().toISOString()};
 });
}
export function mergeMemory(current,incoming){const map=new Map(cleanMemory(current).map(item=>[item.id,item]));for(const item of cleanMemory(incoming))map.set(item.id,{...item,updatedAt:new Date().toISOString()});return cleanMemory([...map.values()]);}
export function memoryMatch(question,entries,origin,context=''){
 if(privateQuestion(question))return null;
 const q=normalizeQuestion(question),concept=questionConcept(question);
 const available=entries.filter(a=>a.scope==='*'||(a.scope===origin&&a.context&&a.context===context));
 let matches=available.filter(a=>normalizeQuestion(a.question)===q),kind='Saved answer · same question';
 if(!matches.length&&concept){matches=available.filter(a=>questionConcept(a.question)===concept);kind='Saved answer · equivalent wording';}
 const scoped=matches.filter(a=>a.scope===origin);if(scoped.length)matches=scoped;
 // Conflicting answers are never silently resolved by choosing the first one.
 if(!matches.length||new Set(matches.map(a=>a.answer.trim())).size!==1)return null;
 return {value:matches[0].answer,question:matches[0].question,reason:kind};
}
// This function is injected alone by the popup: keep dependencies inside it.
export function scanAnsweredFields(){
 const blocked=/password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/i;
 const candidates=[];
 for(const e of document.querySelectorAll('input,textarea,select')){
  const type=e.type||e.tagName.toLowerCase();if(!['text','email','tel','url','textarea','select-one','number'].includes(type)||e.disabled||e.readOnly||!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')continue;
  const question=([...(e.labels||[])].map(l=>l.innerText).join(' ')||e.getAttribute('aria-label')||(e.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.innerText||'').join(' ')||e.placeholder||'').trim();
  if(!question||question.length>250||blocked.test(question+' '+e.name+' '+e.id)||/one-time-code|cc-|current-password|new-password/.test(e.autocomplete||''))continue;
  const answer=(e.tagName==='SELECT'?e.selectedOptions[0]?.textContent:e.value||'')?.trim();
  if(!answer||answer.length>1500||(e.tagName==='SELECT'&&(!e.value||/^(select|choose|please select)/i.test(answer))))continue;
  candidates.push({question,answer});if(candidates.length>=100)break;
 }
 return {url:location.href,origin:location.origin,candidates};
}
