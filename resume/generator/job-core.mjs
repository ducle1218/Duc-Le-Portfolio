export const STUDIO='https://ducle1218.github.io/Duc-Le-Portfolio/generator/';
export const DEFAULTS={locations:'New Jersey, New York, Pennsylvania',remote:true,internships:true,include:'mechanical, CAD, robotics, manufacturing, engineering, engineer',exclude:'senior, principal, director, manager',companies:'',terms:'',days:0,limit:15};
export const list=s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean);
export function safeUrl(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[)|\.(local|internal)$/i.test(u.hostname)||!u.hostname.includes('.'))return null;return u;}catch{return null;}}
export function canonical(value){const u=safeUrl(value);if(!u)return null;const linked=/(^|\.)linkedin\.com$/.test(u.hostname)&&u.pathname.match(/\/jobs\/view\/(?:.*-)?(\d+)\/?$/);if(linked)return 'https://www.linkedin.com/jobs/view/'+linked[1]+'/';if(/(^|\.)indeed\.com$/.test(u.hostname)&&u.searchParams.get('jk'))return 'https://www.indeed.com/viewjob?jk='+encodeURIComponent(u.searchParams.get('jk'));for(const key of [...u.searchParams.keys()])if(/^(utm_|trk|tracking|ref|source|gh_src)/i.test(key))u.searchParams.delete(key);u.hash='';return u.href.replace(/\/$/,'');}
export function validateJob(job){if(!job||typeof job!=='object'||typeof job.description!=='string'||job.description.trim().length<80||job.description.length>65000)throw new Error('A complete job description is required (80–65,000 characters).');const url=canonical(job.url);if(!url)throw new Error('A public HTTPS job link is required.');return {url,title:String(job.title||'Job posting').slice(0,220),company:String(job.company||'Company').slice(0,160),location:String(job.location||'').slice(0,300),description:job.description.trim(),datePosted:String(job.datePosted||'').slice(0,30),remote:job.remote===true,capturedAt:new Date().toISOString()};}
const has=(text,term)=>new RegExp('(^|[^a-z0-9])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])','i').test(text);
export function filterJob(job,f,now=Date.now()){
 const title=job.title||'',body=job.description||'',location=job.location||'';
 const skipped=[];const review=[];
 if(list(f.exclude).some(t=>has(title,t)))skipped.push('Excluded title keyword');
 if(list(f.companies).some(t=>(job.company||'').toLowerCase().includes(t.toLowerCase())))skipped.push('Excluded company');
 if(list(f.terms).some(t=>has(body,t)))skipped.push('Excluded description keyword');
 if(f.internships&&!/\bintern(?:ship)?s?\b|co[ -]?op/i.test(title))skipped.push('Title is not an internship or co-op');
 if(list(f.include).length&&!list(f.include).some(t=>has(title,t)))skipped.push('No requested title keywords');
 const aliases={'New Jersey':['NJ'],'New York':['NY'],'Pennsylvania':['PA']};
 const local=list(f.locations).some(t=>[t,...(Object.entries(aliases).find(([name])=>name.toLowerCase()===t.toLowerCase())?.[1]||[])].some(w=>has(location,w)));
 const remote=job.remote||/\bremote\b/i.test(location);
 const us=/\b(US|USA|United States)\b/i.test(location);
 if(list(f.locations).length&&!local&&!(f.remote&&remote&&us)){
   if(!location||(f.remote&&remote&&!us&&!/\b(Canada|Mexico|UK|Europe|India|Germany|Australia)\b/i.test(location)))review.push('Confirm location or US remote eligibility');else skipped.push('Outside preferred locations');
 }
 if(f.days>0){const posted=Date.parse(job.datePosted);if(!Number.isFinite(posted)||posted>now+86400000)review.push('Posting date unavailable');else if(now-posted>f.days*86400000)skipped.push('Older than posting-age filter');}
 return {status:skipped.length?'skipped':review.length?'review':'ready',reason:[...skipped,...review].join(' · ')};
}
export function filename(job){const clean=s=>String(s).normalize('NFKD').replace(/[^a-zA-Z0-9 -]/g,'').trim().replace(/\s+/g,'_').slice(0,65)||'Job';let hash=2166136261;for(const c of job.url||'')hash=Math.imul(hash^c.charCodeAt(0),16777619);return 'Duc_Le_'+clean(job.company)+'_'+clean(job.title)+'_'+(hash>>>0).toString(16)+'.pdf';}
