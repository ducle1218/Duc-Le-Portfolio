import {sourceDetails,DEFAULT_PRIORITIES} from './job-source.mjs?v=20261114.4';
import {DEFAULTS,filterJob,canonical,filename,validateJob,postingDate} from './job-core.mjs?v=20261114.4';
import {importJob} from './job-api.mjs?v=20261114.4';
import {buildResume,lockStudio,previewJob} from './studio.mjs?v=20261114.4';
import {makeZip} from './zip.mjs?v=20261114.4';
import {matchResume,freshness,payDetails,companyDetails,sortJobs} from './job-insights.mjs?v=20261114.4';
import {setupCloud,connected,saveJobs,searchOnline,mergeJobState} from './cloud.mjs?v=20261114.4';
const $=id=>document.getElementById(id),key='resume-studio-filters-v1';
let all=[],visible=[],selected=new Set(),imported=new Set(),running=false,cancelled=false,zipURL=null,profile=null,registry=null;
const insightCache=new WeakMap();
function insights(job){let cached=insightCache.get(job);if(!cached||cached.profile!==profile){cached={profile,fit:matchResume(job,profile),pay:payDetails(job)};insightCache.set(job,cached);}return {fit:cached.fit,pay:cached.pay};}
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const date=value=>{if(/^\d{4}-\d{2}-\d{2}$/.test(value||''))return postingDate(value);const parsed=Date.parse(value);return Number.isFinite(parsed)?new Date(parsed).toLocaleString(): 'Unknown';};
function readFilters(){return {...DEFAULTS,include:$('roles').value,locations:$('locations').value,exclude:$('exclude').value,companies:$('companies').value,terms:$('terms').value,remote:$('remote').checked,days:Number($('days').value),priorities:$('priorities').value};}
function fillFilters(f){for(const [id,name] of [['roles','include'],['locations','locations'],['exclude','exclude'],['companies','companies'],['terms','terms'],['days','days']])$(id).value=f[name];$('remote').checked=f.remote;$('priorities').value=f.priorities??DEFAULT_PRIORITIES;}
let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch{}if(!saved.priorities||saved.priorities==='SpaceX')saved.priorities=DEFAULT_PRIORITIES;fillFilters({...DEFAULTS,...saved});
function selection(){
 $('selection-count').textContent=selected.size+' selected';$('batch').disabled=running||!selected.size;
 for(const input of $('jobs').querySelectorAll('input[type=checkbox]'))input.checked=selected.has(input.value);
}
function showJobs(){
 selected.clear();const filters=readFilters();try{localStorage.setItem(key,JSON.stringify(filters));}catch{}
 const isImported=$('result-scope').value==='imported',isEmployer=$('result-scope').value==='employer';
 const classified=all.filter(job=>(!isImported||imported.has(job.url))&&(!isEmployer||!sourceDetails(job).board)&&sourceDetails(job).allowed).map(job=>({job,...filterJob(job,filters),fresh:freshness(job)})).filter(entry=>$('show-closed').checked||!entry.fresh.closed);
 const ready=classified.filter(j=>j.status==='ready'),review=classified.filter(j=>j.status==='review');
 visible=sortJobs([...ready,...($('show-review').checked?review:[])].map(entry=>({...entry,...insights(entry.job),company:companyDetails(entry.job,registry,filters.priorities)})),$('sort-jobs').value);
 $('match-count').textContent=ready.length+(isImported?' saved / imported jobs':isEmployer?' employer-site matches':' matches')+(review.length?' · '+review.length+' need a check':'');
 $('sort-note').textContent=$('sort-jobs').value==='newest-priority'?'Newest posting week first, then your priority companies and published company rank.':$('sort-jobs').value==='company'?'Priority employers first, then published Fortune 500 rank. Unknown rank is not low prestige.':$('sort-jobs').value==='newest'?'Newest publication dates first; closed postings stay last.':$('sort-jobs').value==='match'?'Freshness first, then documented skill overlap.':'Freshness first, then your favorites and verified Fortune 500 rank.';
 $('jobs').replaceChildren();
 if(!visible.length)$('jobs').append(node('p',all.length?'No matches in the connected feeds. Try broader keywords or locations, or import a posting below.':'No postings loaded yet. You can still paste a job description below.','muted'));
 for(const {job,status,reason,fresh,fit,company,pay} of visible){
  const row=node('article',undefined,'job-row');
  const check=node('input');check.type='checkbox';check.value=job.url;check.setAttribute('aria-label','Select '+job.title+' at '+job.company);check.disabled=!!fresh.closed;check.dataset.inactive=String(!!fresh.closed);
  check.onchange=()=>{if(check.checked&&selected.size>=15){check.checked=false;$('batch-status').textContent='Select up to 15 jobs per batch.';return;}if(check.checked)selected.add(job.url);else selected.delete(job.url);selection();};
  const content=node('div',undefined,'job-content');content.append(node('p',job.company,'eyebrow'),node('h4',job.title),node('p',job.location||'Location not provided','muted'));
  if(status==='review')content.append(node('p',reason+' — select only after checking the source.','review-note'));
  const chips=node('div',undefined,'job-chips');
  chips.append(node('span',sourceDetails(job).label,'source-chip'),node('span',job.datePosted?(job.dateApproximate?'Approx. posted ':'Posted ')+postingDate(job.datePosted):'Posting date unavailable','date-chip'));
  chips.append(node('span',pay.label,'pay-chip'),node('span',fresh.label,fresh.tier>=2?'age-chip needs-check':'age-chip'));
  if(company.priority)chips.append(node('span','★ Your priority','priority-chip'));
  const rank=node(company.rank?'a':'span',company.rank?'Fortune 500 · #'+company.rank:'Rank not reviewed');
  if(company.rank){rank.href=company.source;rank.target='_blank';rank.rel='noreferrer';rank.title=(job.company.toLowerCase().includes('google')?'Parent company Alphabet · ':'')+company.year+' Fortune 500 US revenue ranking — source';}chips.append(rank);content.append(chips);
  const meta=node('p',(job.statusCheckedAt?'Availability check attempted '+date(job.statusCheckedAt):'Source observed '+date(job.checkedAt))+(job.datePosted?' · '+(job.dateApproximate?'Approx. posted ':'Posted ')+date(job.datePosted):' · Original date unavailable'),'job-meta');
  const source=node('a','Source posting ↗');source.href=job.url;source.target='_blank';source.rel='noreferrer';
  const preview=node('button',fresh.closed?'Inactive posting':'Preview resume','quiet');preview.type='button';preview.disabled=!!fresh.closed;preview.dataset.inactive=String(!!fresh.closed);if(fresh.closed)preview.title='Archived for reference; this posting is excluded from resume generation.';preview.onclick=async()=>{if(running||fresh.closed)return;preview.disabled=true;try{await previewJob(job);}catch(error){$('batch-status').textContent=error.message;}finally{preview.disabled=false;}};
  const detail=node('details'),summary=node('summary','Fit & details'+(fit.checks.length?' · '+fit.checks.length+' checks':''));detail.append(summary);
  const fitGrid=node('div',undefined,'fit-grid');
  for(const [heading,entries,kind] of [['Documented in your resume',fit.matched,'matched'],['Not documented',fit.missing,'missing']]){
   const col=node('div',undefined,'fit-group '+kind);col.append(node('h5',(kind==='matched'?'✓ Matches · ':'− Gaps · ')+entries.length));
   if(!entries.length)col.append(node('p',kind==='matched'?'No documented matches identified':'No recognized gaps identified','hint'));
   for(const entry of entries){const p=node('details',undefined,'fit-evidence');p.append(node('summary',entry.name+(entry.required?' · required':''),'fit-pill '+kind),node('p',(kind==='matched'?entry.evidence:entry.quote)+(entry.qualifier?' — '+entry.qualifier:''),'hint'));col.append(p);}fitGrid.append(col);
  }detail.append(node('p',fit.explanation,'hint'),fitGrid);
  if(fit.checks.length){const checks=node('div',undefined,'eligibility');checks.append(node('h5','! Verify eligibility · '+fit.checks.length));for(const item of fit.checks){const p=node('p');p.className='check-pill';p.append(node('strong',item.label),node('small',item.quote));checks.append(p);}detail.append(checks);}
  detail.append(node('p',fit.scope,'hint'),node('p',fresh.detail,'hint'),meta);
  if(job.statusReason&&job.statusReason!==fresh.detail)detail.append(node('p','Last availability result: '+job.statusReason,'hint'));
  const evidenceUrl=canonical(job.statusEvidenceUrl);if(evidenceUrl){const evidence=node('a','Availability evidence ↗');evidence.href=evidenceUrl;evidence.target='_blank';evidence.rel='noreferrer';detail.append(evidence);}
  if(job.employmentType)detail.append(node('p',job.employmentType,'hint'));
  if(pay.quotes.length){detail.append(node('h5','Pay as listed by the employer'));for(const quote of pay.quotes)detail.append(node('p',quote,'salary-quote'));}
  const description=node('button','Read posting','quiet');description.type='button';description.onclick=()=>openPosting(job);detail.append(description);
  content.append(detail);const actions=node('div',undefined,'job-actions');
  const score=node('button',undefined,'fit-score');score.type='button';score.append(node('strong',fit.score===null?'—':fit.score+'%'),node('span','Skills match'),node('small',fit.count+' skills assessed'));score.setAttribute('aria-label','Skills match '+(fit.score??'unavailable')+'. Show evidence');score.onclick=()=>{detail.open=!detail.open;};
  actions.append(score,preview,source);row.append(check,content,actions);$('jobs').append(row);
 }
 selection();
}
$('filters').onsubmit=e=>{e.preventDefault();if(!running)showJobs();};
$('reset-filters').onclick=()=>{if(running)return;fillFilters(DEFAULTS);$('show-review').checked=false;$('show-closed').checked=false;showJobs();};
$('show-review').onchange=()=>{if(!running)showJobs();};
$('show-closed').onchange=$('sort-jobs').onchange=$('result-scope').onchange=()=>{if(!running)showJobs();};
$('select-matches').onclick=()=>{if(running)return;selected=new Set(visible.filter(j=>j.status==='ready'&&!j.fresh.closed).slice(0,15).map(j=>j.job.url));selection();};
function lock(value){running=value;for(const e of document.querySelectorAll('#filters input,#filters select,#filters button,#jobs input,#jobs button,#import-links,#job-links,#select-matches,#sort-jobs,#result-scope'))e.disabled=value||e.dataset.inactive==='true';selection();}
async function load(){
 try{
  const metadata=await Promise.allSettled(['resume-match-profile.json','resume-manifest.json','company-rankings.json'].map(async file=>{const r=await fetch('../../data/'+file,{cache:'no-cache',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Metadata unavailable');return r.json();}));
  const [evidence,resume,ranks]=metadata.map(r=>r.status==='fulfilled'?r.value:null);
  if(evidence&&resume&&evidence.resumeSha256===resume.sha256)profile=evidence;
  registry=ranks;
  $('profile-status').textContent=profile?'Scores use the canonical resume, reviewed '+profile.reviewedOn+'. Planned GD&T work is not credited as completed experience.':'Match scoring is paused because the reviewed evidence does not match the current resume.';
  const response=await fetch('../../data/jobs.json',{cache:'no-cache',signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('The employer index could not load. Try refreshing, or paste a job description below.');
  const index=await response.json();if(index.version!==1||!Array.isArray(index.jobs)||!Array.isArray(index.sources))throw new Error('The employer index format is unavailable.');
  const dedup=new Map();for(const job of [...all,...index.jobs]){try{const valid=validateJob(job);dedup.set(valid.url,{...job,...valid});}catch{}}
  all=[...dedup.values()];const unavailable=index.sources.filter(s=>s.status!=='ok');
  const stale=!Number.isFinite(Date.parse(index.checkedAt))||Date.now()-Date.parse(index.checkedAt)>36*3600000;
  $('feed-status').textContent=(stale?'Index may be out of date. ':'')+'Last checked '+date(index.checkedAt)+' · '+all.length+' internships across '+index.sources.length+' employer feeds'+(unavailable.length?' · '+unavailable.length+' incomplete or unavailable feeds':'')+'.';
  for(const s of index.sources)$('sources').append(node('p',s.company+' — '+(s.status==='ok'?s.count+' internships':s.status==='partial'?s.count+' internships; '+s.omitted+' unreadable'+(s.truncated?'; listing limit reached':''):'unavailable')));
  showJobs();
 }catch(error){$('feed-status').textContent=error.message;}
}
$('import-links').onclick=async()=>{
 if(running)return;const urls=$('job-links').value.split(/\s+/).filter(Boolean);
 if(!urls.length||urls.length>20){$('import-status').textContent='Add between 1 and 20 links.';return;}
 lock(true);const errors=[];let added=0;
 try{for(const [i,url] of [...new Set(urls)].entries()){
  $('import-status').textContent='Reading link '+(i+1)+' of '+new Set(urls).size+'…';
  try{const job=await importJob(url,all);if(!all.some(j=>canonical(j.url)===canonical(job.url))){all.push({...job,url:canonical(job.url)});}imported.add(canonical(job.url));added++;if(connected()){try{await saveJobs([job]);}catch(error){errors.push('Imported, but not saved online: '+job.title+' — '+error.message);}}}
  catch(error){errors.push(url+' — '+error.message);}
 }}finally{lock(false);if(added)$('result-scope').value='imported';showJobs();$('import-status').textContent=added+' postings ready in Saved / imported.'+(!connected()?' Session only: unlock the online library to save them.':'')+(errors.length?'\n'+errors.join('\n'):'');}
};
$('cancel-batch').onclick=()=>{cancelled=true;$('cancel-batch').disabled=true;$('batch-status').textContent='Stopping after the current PDF…';};
$('batch').onclick=async()=>{
 if(running||!selected.size)return;
 try{lockStudio(true);}catch(error){$('batch-status').textContent=error.message;return;}
 const jobs=visible.filter(entry=>selected.has(entry.job.url)&&!entry.fresh.closed).map(entry=>entry.job).slice(0,15),files=[],report=[];cancelled=false;lock(true);
 $('cancel-batch').hidden=false;$('cancel-batch').disabled=false;$('batch-download').hidden=true;
 if(zipURL){URL.revokeObjectURL(zipURL);zipURL=null;}
 try{
  for(const [i,job] of jobs.entries()){
   if(cancelled)break;$('batch-status').textContent='Preparing '+(i+1)+' of '+jobs.length+' · '+job.company+' — '+job.title;
   try{
    const result=await buildResume(job.description),name=filename(job);files.push({name,data:result.output});
    report.push({company:job.company,title:job.title,location:job.location,url:job.url,checkedAt:job.checkedAt,filename:name,baselineSha256:result.baselineSha256,status:'review selected projects and wording',changes:result.edits.map(s=>({projectId:s.id,title:s.title,reason:s.reason,before:s.before,after:s.choice.text,sources:s.choice.sources}))});
   }catch(error){report.push({company:job.company,title:job.title,url:job.url,error:error.message});}
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(!files.length)throw new Error(report.find(r=>r.error)?.error||'Stopped before any PDFs were created.');
  const count=files.length;files.push({name:'job-report.json',data:JSON.stringify({generatedAt:new Date().toISOString(),cancelled,requested:jobs.length,completed:count,postings:report},null,2)});
  zipURL=URL.createObjectURL(new Blob([makeZip(files)],{type:'application/zip'}));
  const link=$('batch-download');link.href=zipURL;link.download='Duc_Le_Resumes_'+new Date().toISOString().slice(0,10)+'.zip';link.hidden=false;link.click();
  $('batch-status').textContent=count+' PDFs ready'+(cancelled?' (stopped early)':'')+(report.some(r=>r.error)?' · Some jobs failed; see job-report.json':'')+'. Review the wording and source requirements before applying. If your browser did not save the ZIP, use the download button.';
 }catch(error){$('batch-status').textContent=error.message;}
 finally{lockStudio(false);lock(false);$('cancel-batch').hidden=true;}
};
await load();
const mergeJobs=jobs=>{for(const job of jobs){try{const valid=validateJob(job),entry={...job,...valid},existing=all.findIndex(j=>j.url===valid.url);if(existing<0)all.push(entry);else all[existing]=mergeJobState(all[existing],entry);imported.add(valid.url);}catch{}}showJobs();};
await setupCloud(mergeJobs);
$('cloud-save-current').onclick=async()=>{const jobs=all.filter(j=>imported.has(j.url));try{for(let i=0;i<jobs.length;i+=20)await saveJobs(jobs.slice(i,i+20));$('cloud-status').textContent=jobs.length+' imported jobs saved online.';}catch(error){$('cloud-status').textContent=error.message;}};
$('online-search').onclick=async()=>{if(running)return;lock(true);$('cloud-status').textContent='Searching job boards…';try{const result=await searchOnline(readFilters());mergeJobs(result.jobs);$('result-scope').value='discovered';showJobs();for(let i=0;i<result.jobs.length;i+=20)await saveJobs(result.jobs.slice(i,i+20));$('cloud-status').textContent=result.jobs.length+' search results saved online. Active filters apply to the combined results below. '+result.coverage;}catch(error){$('cloud-status').textContent=error.message;}finally{lock(false);}};

function openPosting(job){
 const dialog=node('dialog',undefined,'posting-dialog');const bar=node('div',undefined,'posting-toolbar');
 const close=node('button','Close ×','quiet');close.type='button';close.onclick=()=>dialog.close();
 const original=node('a','Open original ↗','quiet');original.href=job.url;original.target='_blank';original.rel='noopener noreferrer';
 const embed=node('button','Try embedded page','quiet');embed.type='button';
 bar.append(close,original,embed);dialog.append(bar,node('h2',job.title),node('p',job.company+' · '+sourceDetails(job).label,'muted'));
 const reader=node('div',undefined,'posting-reader');for(const paragraph of job.description.split(/\n+/).map(t=>t.trim()).filter(Boolean))reader.append(node('p',paragraph));
 dialog.append(node('p','Saved posting text. Some job sites block embedded browsing; the readable copy remains available below.','hint'),reader);
 embed.onclick=()=>{if(dialog.querySelector('iframe'))return;const frame=node('iframe');frame.title='Original job posting';frame.src=job.url;frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups');dialog.insertBefore(frame,reader);embed.disabled=true;};
 dialog.addEventListener('close',()=>dialog.remove());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});document.body.append(dialog);dialog.showModal();close.focus();
}
