import {commonQuestion} from './common-questions.mjs?v=20261115.6';
import {formBridge} from './application-autofill.mjs?v=20261115.6';
import {ageThreshold,dateConcept} from './answer-rules.mjs?v=20261115.6';
export const normalizeQuestion=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/\+/g,' plus ').replace(/#/g,' sharp ').replace(/%/g,' percent ').replace(/-(?=\d)/g,' minus ').replace(/(\d)\.(?=\d)/g,'$1 decimal ').replace(/[^a-z0-9]+/g,' ').replace(/\b(required|optional)\b/g,'').replace(/\s+/g,' ').trim();
export const reviewedIdentityQuestion=q=>['Sex','Preferred pronouns','Race / ethnic background','Country of citizenship'].includes(commonQuestion(q)?.question);
export const privateQuestion=q=>!reviewedIdentityQuestion(q)&&/password|passcode|otp|verification code|social security|\bssn\b|passport|bank|credit card|birth|citizen|sponsor|authoriz|eligible|eligibility|veteran|disabil|\bsex\b|gender|race|ethnic|pronoun|consent|agree|certify|signature|salary|compensation|\bgpa\b|reference|emergency|guardian|parent|\breferr|manager|supervisor/.test(normalizeQuestion(q));
// Deliberately small equivalence groups. Do not infer similarity from shared keywords:
// "can travel" and "cannot travel", dates, years, and percentages must not collapse.
const equivalents=[
 ['when can you start','when are you available to start','what is your earliest start date','what is your earliest available start date','earliest start date','available start date','availability to start','when would you be available to start'],
 ['are you willing to relocate','are you open to relocation','would you be willing to relocate','willing to relocate','open to relocation'],
 ['are you willing to travel','are you open to travel','would you be willing to travel','willing to travel'],
 ['what is your preferred name','preferred name','what name do you prefer to go by'],
 ['what is your preferred contact method','preferred contact method','how do you prefer to be contacted'],
];
export function questionConcept(question){if(reviewedIdentityQuestion(question))return 'identity-'+commonQuestion(question).question;const age=ageThreshold(question);if(age!==null)return 'age-'+age;const date=dateConcept(question);if(date)return 'date-'+date;const common=commonQuestion(question);if(common)return 'common-'+common.question;const q=normalizeQuestion(question);const i=equivalents.findIndex(group=>group.includes(q));return i<0?null:'equivalent-'+i;}
export function employerSpecific(question){return /\b(this|our|your) (company|organization|organisation|role|position|team)|why.*(join|work|interested)|how.*hear|job.*(id|reference)|^if\b|please specify|how.*hear/i.test(question);}
export function cleanMemory(input){
 if(!Array.isArray(input))throw new Error('Choose an answer list.');
 if(new TextEncoder().encode(JSON.stringify(input)).length>1000000)throw new Error('The answer library exceeds the 1 MB storage size. Export a backup and shorten long answers.');
 return input.map(item=>{
  let question=String(item.question||'').trim(),answer=String(item.answer||'').trim();
  // Old scans included selected chips in wrapped labels. Only remove a proven
  // trailing duplicate on these known question shapes, never arbitrary words.
  if(/^Please indicate your availability for the internship/i.test(question))answer=answer.replace(/^[×✕]\s*/,'');
  if(/^(Country\/Region|Province\/State|Please indicate your availability for the internship)/i.test(question)&&question.endsWith(' '+answer))question=question.slice(0,-answer.length).trim();
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
 return {value:matches[0].answer,question:matches[0].question,reason:kind,requiresReview:reviewedIdentityQuestion(question)};
}
// Shared control detection keeps remembering and filling in sync.
export const scanAnsweredFields=()=>formBridge({action:'remember'});
