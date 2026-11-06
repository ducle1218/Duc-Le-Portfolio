import {list} from './job-core.mjs?v=20261105.4';
const DAY=86400000;
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const contains=(text,word)=>new RegExp('(^|[^a-z0-9])'+escape(word)+'(?=$|[^a-z0-9])','i').test(text);
// The same concept counts once, regardless of keyword repetition or synonyms.
export const CONCEPTS={
 'CAD':['CAD','computer-aided design'], 'SolidWorks':['SolidWorks','Solid Works'], 'Onshape':['Onshape'],
 'AutoCAD':['AutoCAD'], 'FEA':['FEA','finite element analysis'], 'MATLAB':['MATLAB'], 'Python':['Python'],
 'C++':['C++'], 'Excel':['Excel','spreadsheets'], '3D printing':['3D printing','additive manufacturing','FDM'],
 'Mechanical design':['mechanical design','mechanism design'], 'Assembly':['assembly','assemblies'],
 'Prototyping':['prototyping','prototypes','prototype'], 'Structural analysis':['structural analysis','stress analysis'],
 'Documentation':['technical documentation','engineering documentation','technical reports'],
 'GD&T':['GD&T','geometric dimensioning'], 'Revit':['Revit'], 'HVAC':['HVAC'], 'ANSYS':['ANSYS'],
 'CFD':['CFD','computational fluid dynamics'], 'CATIA':['CATIA'], 'NX':['Siemens NX','NX CAD'],
 'Creo':['Creo'], 'Civil 3D':['Civil 3D'], 'PLC':['PLC','programmable logic controllers'],
 'CNC':['CNC','computer numerical control'], 'Machining':['machining'], 'Welding':['welding'],
 'Java':['Java'], 'SQL':['SQL'], 'ROS':['ROS','Robot Operating System'], 'PCB':['PCB','printed circuit board'],
 'LabVIEW':['LabVIEW'], 'Revit MEP':['Revit MEP'], 'Thermal analysis':['thermal analysis','heat transfer'],
 'Tolerance analysis':['tolerance analysis','tolerance stack'], 'DFM':['DFM','design for manufacturing']
};
export function matchResume(job,profile){
 const text=job.description||'',sentences=text.replace(/\bU\.S\./g,'US').split(/\n|(?<=[.!?])\s+/);
 const matched=[],missing=[];let covered=0,total=0;
 for(const [name,aliases] of Object.entries(CONCEPTS)){
  const references=sentences.filter(s=>aliases.some(a=>contains(s,a))&&!/\b(no|not)\b.{0,12}(required|necessary)/i.test(s));
  if(!references.length)continue;
  const required=references.some(s=>/\b(required|must|minimum|proficien(?:t|cy))\b/i.test(s)&&!/\b(preferred|plus|bonus|not required)\b/i.test(s));
  const weight=required?2:1,evidence=profile?.skills?.find(s=>s.name===name);
  total+=weight;const entry={name,required,quote:references[0].trim().slice(0,350),evidence:evidence?.evidence,qualifier:evidence?.qualifier};
  if(evidence){covered+=weight;matched.push(entry);}else missing.push(entry);
 }
 const checks=[];
 const add=(pattern,label)=>{const quote=sentences.find(s=>pattern.test(s));if(quote)checks.push({label,quote:quote.trim().slice(0,350)});};
 add(/\b(GPA|grade point average)\b/i,'College GPA is not documented in your resume');
 add(/\b(citizenship|U\.?S\.? citizen|U\.?S\.? person|security clearance|work authorization|authorized to work|sponsorship|ITAR)\b/i,'Confirm work authorization / citizenship requirements');
 add(/\b(juniors?|seniors?|sophomores?|second.year|third.year|fourth.year)\b/i,'Check required academic year against your first-year status');
 add(/\b(master'?s|Ph\.?D|doctorate|completed bachelor|bachelor.{0,15}completed)\b/i,'Check degree requirements; your B.S. is in progress');
 add(/\b\d+\+?\s*(?:years|yrs)\b.{0,40}\bexperience\b/i,'Check experience minimum; project work is not professional tenure');
 add(/\bgraduat(?:ing|ion|e)\b.{0,35}\b20(?:2\d|3\d)\b/i,'Check graduation window against May 2030');
 const count=matched.length+missing.length;
 return {score:profile&&count>=3?Math.round(covered/total*100):null,matched,missing,checks,count,
  explanation:profile?(count<3?'Too few recognizable skills for a useful percentage.':'Weighted overlap of recognized skills: required mentions count twice. Unrecognized requirements are not scored.'):'Resume evidence is unavailable or changed; refresh the scoring profile.',
  scope:'Skills match, not hiring probability. Academic, eligibility, interview, and applicant-pool factors are not included.'};
}
export function freshness(job,now=Date.now()){
 const expires=Date.parse(job.validThrough?.length===10?job.validThrough+'T23:59:59Z':job.validThrough);
 if(job.closed===true||Number.isFinite(expires)&&expires<now)return {tier:4,closed:true,label:'Closed / deadline passed',detail:'The source indicates a closure or a passed application deadline.'};
 const checked=Date.parse(job.checkedAt),posted=Date.parse(job.datePosted),age=Number.isFinite(posted)?Math.floor((now-posted)/DAY):null;
 if(!Number.isFinite(checked)||now-checked>36*3600000)return {tier:3,label:'Needs a fresh check',detail:'This posting has not been checked in the last 36 hours.'};
 if(age!==null&&age>=60)return {tier:2,label:age+' days old · verify',detail:'Older listing; it may still be open. A recent feed check does not reset its posting age.'};
 if(age===null||age<0)return {tier:1,label:'Posting age unknown',detail:'No reliable original posting date was supplied.'};
 return {tier:0,label:(job.dateApproximate?'About ':'')+(age===0?'Posted today':age+' day'+(age===1?'':'s')+' old'),detail:'Source checked recently. Verify availability before applying.'};
}
export function payDetails(job){
 const salary=job.salary?{...job.salary,unit:job.salary.unit||job.salary.interval}:null;
 if(salary&&Number.isFinite(Number(salary.min))&&salary.min!==null&&salary.currency&&salary.unit){
  const amount=n=>Number(n).toLocaleString('en-US'),range=amount(salary.min)+(salary.max!=null&&Number(salary.max)!==Number(salary.min)?'–'+amount(salary.max):'');
  return {label:salary.currency+' '+range+' / '+salary.unit.toLowerCase(),quotes:[salary.quote||'Employer-provided salary range'],known:true};
 }
 const lines=(job.description||'').split(/\n/),quotes=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();if(!/[$£€]\s*\d/.test(line))continue;
  const context=lines.slice(Math.max(0,i-2),i+2).join(' ');
  if(/\b(salary|compensation|pay range|hourly|per hour|per year|USD|CAD|GBP|EUR)\b|\/hour|\/hr\b/i.test(context)&&!/\b(revenue|funding|valuation|billion)\b/i.test(line))quotes.push(line);
 }
 if(!quotes.length)return {label:/\bunpaid\b/i.test(job.description||'')?'Unpaid (source states)':'Pay not listed',quotes:[],known:false};
 const first=quotes[0],number='[0-9]+(?:,[0-9]{3})*(?:\\.[0-9]+)?';
 const range=first.match(new RegExp('([$£€])\\s*('+number+')(?:\\s*(?:\\/(?:hr|hour|year)|per hour|per year)?\\s*(?:[–—-]|to)\\s*[$£€]?\\s*('+number+'))?','i'));
 const unit=/\/h(?:ou)?r|\bper hour\b|\bhourly\b/i.test(first)?' / hour':/\bper year\b|\bannually\b|\/year/i.test(first)?' / year':' · period unspecified';
 const unique=[...new Set(quotes)];
 return {label:(range?range[1]+range[2]+(range[3]?'–'+range[3]:''):first.slice(0,65))+unit+(unique.length>1?' · '+unique.length+' pay entries':''),quotes:unique.slice(0,8),known:true};
}
const companyKey=value=>String(value).toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\b(inc|incorporated|corp|corporation|llc|ltd)\b/g,'').replace(/\s+/g,' ').trim();
export function companyDetails(job,registry,priorities){
 const key=companyKey(job.company),entry=registry?.companies?.find(c=>[c.name,...(c.aliases||[])].some(a=>companyKey(a)===key));
 return {priority:list(priorities).some(p=>companyKey(p)===key),rank:entry?.rank||null,source:entry?.source,year:registry?.year};
}
export function sortJobs(entries,mode='recommended'){
 return [...entries].sort((a,b)=>{
  const closed=Number(!!a.fresh.closed)-Number(!!b.fresh.closed);if(closed)return closed;
  const freshnessOrder=a.fresh.tier-b.fresh.tier;
  if(mode==='newest')return (Date.parse(b.job.datePosted)||0)-(Date.parse(a.job.datePosted)||0)||freshnessOrder;
  if(freshnessOrder)return freshnessOrder;
  if(mode==='match')return (b.fit.score??-1)-(a.fit.score??-1)||a.job.title.localeCompare(b.job.title);
  return Number(b.company.priority)-Number(a.company.priority)||(a.company.rank??1001)-(b.company.rank??1001)||(b.fit.score??-1)-(a.fit.score??-1)||a.job.company.localeCompare(b.job.company);
 });
}
