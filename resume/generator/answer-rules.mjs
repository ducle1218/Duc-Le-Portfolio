import {questionKey,commonQuestion} from './common-questions.mjs?v=20261115.13';

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
 const q=questionKey(field.label),fact=name=>{const values=entries.filter(a=>commonQuestion(a.question)?.question===name).map(a=>a.answer.trim());return new Set(values).size===1?values[0]:null;};
 // Full addresses may have been saved in a question rather than a profile field.
 // Split only a confirmed city/state/ZIP suffix; never guess a missing street.
 const address=fact('Street address'),city=profile.values?.city||'',state=profile.values?.state||'';
 let street=address,zip='';
 if(address&&city&&state){
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const stateNames=questionKey(state)==='new jersey'?'(?:NJ|New Jersey)':escape(state);
  const suffix=new RegExp('[,\\s]+'+escape(city)+'[,\\s]+'+stateNames+'[,\\s]+(\\d{5}(?:-\\d{4})?)$','i');
  const match=address.match(suffix);if(match){street=address.slice(0,match.index).replace(/[,\s]+$/,'');zip=match[1];}
 }
 if(commonQuestion(field.label)?.question==='Street address'&&address){
  if(/\b\d{5}(?:-\d{4})?$/.test(address)&&!zip)return {blocked:true};
  return result(street,'Street from your saved address');
 }
 if(/^(zip|postal|zip postal)( code)?$/.test(q)&&zip)return result(zip,'ZIP from your saved address');
 const pursued=fact('Degree being pursued'),school=questionKey(field.educationSchool),college=school&&school===questionKey(profile.values?.school),highSchool=school&&school===questionKey(fact('High school name'));
 if(q==='degree'||q==='degree type'||commonQuestion(field.label)?.question==='Degree being pursued'){
  if(highSchool)return result(fact('Highest completed degree'),'Completed high-school education',['high school diploma ged','high school diploma','full high school education']);
  if(pursued&&(college||commonQuestion(field.label)?.question==='Degree being pursued'))return result(pursued,'Degree in progress, not a completed degree',['bachelors','bachelor','bachelor s','bachelor degree','bachelor s degree','bachelor of science','b s','bs']);
  return {blocked:true};
 }
 if(/gpa|grade point average|overall result/.test(q)){
  if(/^(what is your )?(college |university )?gpa scale$/.test(q)&&(college||/college|university/.test(q)))return result(fact('College GPA scale'),'University GPA scale');
  if(highSchool&&fact('High school GPA')&&!/4 0 scale/.test(q))return result(fact('High school GPA'),'High-school GPA only');
  // The resume has no college GPA yet. Never reuse high-school GPA in a college field.
  const gpa=fact('College GPA');if(college&&/^\d(?:\.\d+)?$/.test(gpa||'')&&Number(gpa)<=4)return result(gpa,'Confirmed college GPA');
  if(gpa==='Not available yet'&&(college||/college|university|cumulative/.test(q))&&['select-one','combobox'].includes(field.type))return {...result(gpa,'No college GPA yet; high-school GPA is separate',['not available yet','not available','n a','no gpa yet','not applicable']),requiresReview:true};
  return {blocked:true};
 }
 if(commonQuestion(field.label)?.question==='Current academic standing'&&fact('Current academic standing')==='Freshman')return result('Freshman','Current standing; freshman year is not yet completed',['freshman','first year','first year undergraduate','freshman first year','other please specify','other']);
 if(/^(academic standing details|please specify|other please specify)$/.test(q)&&commonQuestion(field.parentQuestion)?.question==='Current academic standing'&&/other/.test(questionKey(field.parentAnswer))&&fact('Current academic standing'))return result(fact('Current academic standing'),'Current academic standing');
 if(commonQuestion(field.label)?.question==='Preferred work regions'&&fact('Preferred work regions'))return result(fact('Preferred work regions'),'Your preferred work regions');
 if(/^are you available for a summer intern co op may aug$/.test(q)&&unique('Full-time internship availability')==='Summer only; not fall or winter')return {...result('Yes','Available during summer break; check exact start/end dates'),requiresReview:true};
 if(/^source details?$|^if .+ please specify$/.test(q)&&unique('Preferred application source')==='Company website or university'){
  const parent=questionKey(field.parentAnswer);
  if(/university|college/.test(parent)&&profile.values?.school)return result(profile.values.school,'Your university for the selected university source',[questionKey(profile.values.school),'rutgers university new brunswick','rutgers university','rutgers']);
  if(/website|career site|amazon career/.test(parent))return result('Company Website','Details for the selected company source',['company website','our website','company careers website','careers website','amazon jobs']);
  return {blocked:true};
 }
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
 if(/^how (did|do) you (hear|learn|find out) about (this (position|job|role)|us)$/.test(questionKey(field.label))&&unique('Preferred application source')==='Company website or university')return result('Company Website','Your preferred application source',['company website','our website','company careers website','company career site','employer website','amazon career site','amazon jobs','university college','university recruiting','university','university career center','college university']);
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
