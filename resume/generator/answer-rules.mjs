import {questionKey} from './common-questions.mjs?v=20261115.6';

// Editable memories, seeded once by the helper. Dates are for summer 2027 only.
// Rutgers New Brunswick: final exams end May 12; fall begins September 1.
export const PREFERENCE_ANSWERS=[
 {question:'Summer internship start date',answer:'2027-05-13'},
 {question:'Summer internship end date',answer:'2027-08-31'},
 {question:'Full-time internship availability',answer:'Summer only; not fall or winter'},
 {question:'Preferred application source',answer:'Company website or university'},
];
export function ageThreshold(q){
 const s=questionKey(q);
 const m=s.match(/^are you (?:at least )?(\d{1,2})(?: years)?(?: of age| old)?(?: or (?:older|over|above))?$/)||s.match(/^are you (\d{1,2}) years old or older$/);
 return m?Number(m[1]):null;
}
export function dateConcept(q){
 const s=questionKey(String(q||'').split('?')[0]).replace(/ date year month day$| date year month$| yyyy mm dd$| yyyy mm$/,'');
 if(/^(what is your |when is your )?(expected |anticipated )?graduation (date|day month year)$/.test(s))return 'graduation';
 if(/^(summer internship start date|when (can|could) you start|when are you available to start|(?:what is your |please (?:provide|indicate) your )?(earliest (?:(?:available|possible) )?(?:internship )?start date|(?:internship )?start date|availability to start))( for an internship)?$/.test(s))return 'start';
 if(/^(summer internship end date|(?:what is your |please (?:provide|indicate) your )?(latest (?:(?:available|possible) )?(?:internship )?end date|(?:internship )?end date))( for an internship)?$/.test(s))return 'end';
 return null;
}
export const fullTimeQuestion=q=>/^are you (able|available) to work full time\b/.test(questionKey(q));
export function applicationSeason(title=''){
 const s=questionKey(title);const seasons=['summer','fall','autumn','winter','spring'].filter(x=>new RegExp('\\b'+x+'\\b').test(s));
 if(seasons.length!==1)return '';
 if(seasons[0]==='summer'){const years=s.match(/\b20\d{2}\b/g)||[];return years.length===1?'summer-'+years[0]:'';}
 return seasons[0];
}
export function answerRule(field,profile,memory=[],origin='',context='',now=new Date()){
 const entries=[...(profile.answers||[]),...memory.filter(a=>a.scope==='*'||a.scope===origin&&a.context===context)];
 const unique=q=>{const values=entries.filter(a=>questionKey(a.question)===questionKey(q)).map(a=>a.answer.trim());return new Set(values).size===1?values[0]:null;};
 const result=(value,reason,aliases)=>({value,display:value,reason,sourceQuestion:'Saved preferences',requiresReview:false,...(aliases?{aliases}:{} )});
 if(/please indicate your availability for the internship.*select multiple/i.test(field.label)&&unique('Summer internship end date'))return {blocked:true};
 const threshold=ageThreshold(field.label);
 if(threshold!==null){
  const proofs=entries.map(a=>({n:ageThreshold(a.question),yes:questionKey(a.answer)==='yes',no:questionKey(a.answer)==='no'})).filter(a=>a.n!==null);
  if(proofs.some(a=>a.no&&a.n<=threshold)&&proofs.some(a=>a.yes&&a.n>=threshold))return {blocked:true};
  if(proofs.some(a=>a.yes&&a.n>=threshold))return result('Yes','Confirmed age meets this lower or equal threshold',['yes']);
 }
 if(fullTimeQuestion(field.label)&&unique('Full-time internship availability')==='Summer only; not fall or winter'){
  const season=field.applicationSeason||applicationSeason(field.label);
  if(season==='summer-2027')return {...result('Yes','Full-time during summer only'),requiresReview:true};
  if(['fall','autumn','winter'].includes(season))return result('No','Not available full-time in fall or winter');
  return {blocked:true}; // Do not reuse an unconditional old Yes/No for an unknown season.
 }
 if(/^how (did|do) you (hear|learn|find out) about (this (position|job|role)|us)$/.test(questionKey(field.label))&&unique('Preferred application source')==='Company website or university')return result('Company Website','Your preferred application source',['company website','company careers website','company career site','employer website','amazon career site','amazon jobs','university college','university','university career center','college university']);
 const date=dateConcept(field.label);
 if(date==='start'||date==='end'){
  if(field.applicationSeason&&field.applicationSeason!=='summer-2027')return {blocked:true};
  const value=unique(date==='start'?'Summer internship start date':'Summer internship end date');
  if(!value)return null;
  if(!/^2027-\d{2}-\d{2}$/.test(value)||now.toISOString().slice(0,10)>value)return {blocked:true};
  return {...result(value,'Summer 2027 availability · review dates for this role'),requiresReview:true};
 }
 if(date==='graduation'){
  const values=entries.filter(a=>dateConcept(a.question)==='graduation').map(a=>a.answer.trim());
  // Never invent a graduation day from a known month or year.
  const months=values.filter(v=>/^\d{4}-\d{2}(?:-\d{2})?$/.test(v)).map(v=>v.slice(0,7));
  if(new Set(months).size===1&&(field.type==='month'||/^YYYY-MM$/i.test(field.placeholder||'')))return {...result(months[0],'Expected graduation month'),requiresReview:true};
 }
 return null;
}
