import {canonical,safeUrl,validateJob} from './job-core.mjs?v=20261106.1';
const BOARDS=['linkedin.com','indeed.com','glassdoor.com','ziprecruiter.com','myworkdayjobs.com','myworkdaysite.com','smartrecruiters.com','workable.com','icims.com','usajobs.gov','amazon.jobs','jobs.ashbyhq.com','jobs.jobvite.com','careers.microsoft.com','jobs.apple.com','careers.google.com','careers.spacex.com','careers.boeing.com'];
export function readerUrl(value){
 const u=safeUrl(value);if(!u||!BOARDS.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return null;
 if([...u.searchParams.keys()].some(k=>/token|password|session|secret|auth|email/i.test(k)))return null;
 return canonical(value);
}
export function plain(value){
 const doc=new DOMParser().parseFromString('<html><body>'+String(value||'')+'</body></html>','text/html');
 doc.querySelectorAll('script,style,noscript,button,svg').forEach(n=>n.remove());
 doc.querySelectorAll('p,div,li,br,h1,h2,h3,h4,section').forEach(n=>n.append('\n'));
 return (doc.body.textContent||'').split('\n').map(s=>s.trim()).filter(Boolean).join('\n');
}
function jobObjects(value,result=[]){
 if(Array.isArray(value))value.forEach(v=>jobObjects(v,result));
 else if(value&&typeof value==='object'){
  if([value['@type']].flat().includes('JobPosting'))result.push(value);
  else for(const item of Object.values(value))if(item&&typeof item==='object')jobObjects(item,result);
 }return result;
}
const text=(doc,selector)=>doc.querySelector(selector)?.textContent?.trim()||'';
function relativeDate(value,now){
 const m=value.match(/(\d+)\s+(day|week|month|hour|minute)/i);if(!m)return '';
 const duration={day:86400000,week:604800000,month:2592000000,hour:3600000,minute:60000}[m[2].toLowerCase()];
 return new Date(now-Number(m[1])*duration).toISOString();
}
export function parseJobHtml(html,url,now=Date.now()){
 if(typeof html!=='string'||html.length>6000000)throw new Error('The job page is too large or unreadable. Paste its description instead.');
 const doc=new DOMParser().parseFromString(html,'text/html'),host=new URL(url).hostname;
 const structured=[];for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){try{jobObjects(JSON.parse(script.textContent),structured);}catch{}}
 const exact=structured.filter(j=>canonical(j.url||j.mainEntityOfPage?.['@id'])===canonical(url));
 const data=exact.length===1?exact[0]:structured.length===1?structured[0]:null;
 let job={url,checkedAt:new Date(now).toISOString(),source:host,reader:'Public page via Jina'};
 if(data){
  const places=[data.jobLocation].flat().filter(Boolean).map(p=>{const a=p.address||{};return [a.addressLocality,a.addressRegion,typeof a.addressCountry==='object'?a.addressCountry.name:a.addressCountry].filter(Boolean).join(', ');});
  const remote=data.jobLocationType==='TELECOMMUTE';
  if(remote)places.push('Remote',...[data.applicantLocationRequirements].flat().filter(Boolean).map(p=>p.name||''));
  const pay=data.baseSalary,value=pay?.value;
  job={...job,title:data.title,company:data.hiringOrganization?.name,location:places.join(' · '),description:plain(data.description),datePosted:data.datePosted,validThrough:data.validThrough,remote,employmentType:[data.employmentType].flat().filter(Boolean).join(', '),salary:pay&&typeof value==='object'?{currency:pay.currency,min:value.minValue??value.value,max:value.maxValue,unit:value.unitText}:null};
 }else if(/(^|\.)linkedin\.com$/.test(host)){
  const section=doc.querySelector('.description__text');
  if(!section)throw new Error('LinkedIn did not expose a full public description. Paste the text or a screenshot below.');
  const posted=text(doc,'.posted-time-ago__text'),criteria=[...doc.querySelectorAll('.description__job-criteria-item')].map(n=>n.textContent.trim().replace(/\s+/g,' '));
  job={...job,title:text(doc,'.topcard__title'),company:text(doc,'.topcard__org-name-link'),location:text(doc,'.topcard__flavor--bullet'),description:plain(section.innerHTML),datePosted:relativeDate(posted,now),dateApproximate:true,dateLabel:posted,employmentType:criteria.join(' · '),closed:!!doc.querySelector('.closed-job__flavor')||/no longer accepting applications/i.test(text(doc,'.topcard'))};
 }else{
  // Only a job-description element is accepted, never the whole page or related-job cards.
  const selector=/indeed\.com$/.test(host)?'#jobDescriptionText':/myworkday/.test(host)?'[data-automation-id="jobPostingDescription"]':/glassdoor\.com$/.test(host)?'[data-test="description"]':null;
  const section=selector&&doc.querySelector(selector);
  if(!section)throw new Error('This site did not expose a single full public job description. Paste the text or a screenshot below.');
  job={...job,title:text(doc,'h1'),company:text(doc,'[data-testid="inlineHeader-companyName"], [data-test="employerName"]'),location:text(doc,'[data-testid="inlineHeader-companyLocation"]'),description:plain(section.innerHTML)};
 }
 if(!job.title||/sign in|access denied|captcha/i.test(job.title)||!job.description||job.description.length<80)throw new Error('A complete public job posting was not available. Paste the description or a screenshot instead.');
 return {...job,...validateJob(job)};
}
let lastRead=0;
export async function readPublicJob(value){
 const url=readerUrl(value);if(!url)throw new Error('Use a public LinkedIn, Indeed, Glassdoor, Workday, or supported job-board link. Other postings can be pasted below.');
 const wait=Math.max(0,3100-(Date.now()-lastRead));if(wait)await new Promise(r=>setTimeout(r,wait));lastRead=Date.now();
 let response;
 try{response=await fetch('https://r.jina.ai/'+url,{headers:{Accept:'application/json','X-Respond-With':'html'},credentials:'omit',signal:AbortSignal.timeout(45000)});}catch{throw new Error('The public-page reader could not respond. Try again, or paste the description below.');}
 if(!response.ok)throw new Error(response.status===429?'The free reader is busy. Wait a minute and retry.':'The site or reader could not provide this page. Paste its description or a screenshot instead.');
 const result=await response.json(),data=result.data;
 if(!data?.html||data.httpStatus>=400)throw new Error('This page is blocked, closed, or requires sign-in. Paste the description if you have it.');
 return parseJobHtml(data.html,url);
}
