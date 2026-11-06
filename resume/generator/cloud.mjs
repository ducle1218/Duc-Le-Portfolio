let endpoint='',key='';
export const connected=()=>!!endpoint&&!!key;
export async function cloudRequest(path,method='GET',data){
 if(!connected())throw new Error('Unlock the online library first.');
 const response=await fetch(endpoint+path,{method,headers:{Authorization:'Bearer '+key,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,credentials:'omit',signal:AbortSignal.timeout(30000)});
 const result=await response.json();if(!response.ok)throw Object.assign(new Error(result.error||'Online library unavailable.'),{status:response.status});return result;
}
export async function saveJobs(jobs){return cloudRequest('/jobs','PUT',{jobs});}
export function searchQueries(filters){
 const terms=String(filters.include||'engineering').split(',').map(s=>s.trim()).filter(Boolean),role=terms.length>3?'engineering':terms.join(' OR ')||'engineering';
 const locations=String(filters.locations||'United States').split(',').map(s=>s.trim()).filter(Boolean).slice(0,filters.remote?3:4);
 const queries=locations.map(location=>role+' internship '+location);
 if(filters.remote)queries.push(role+' internship remote United States');
 return queries.length?queries:[role+' internship United States'];
}
export async function searchOnline(filters){return cloudRequest('/search','POST',{queries:searchQueries(filters)});}
const statusFields=['closed','availability','statusCheckedAt','statusReason','statusEvidenceUrl'];
// Search results may predate a verified closure. Only a newer server check can replace it.
export function mergeJobState(previous,incoming){
 const merged={...previous,...incoming};
 if(previous?.availability&&(!incoming.statusCheckedAt||(Date.parse(previous.statusCheckedAt)||0)>(Date.parse(incoming.statusCheckedAt)||0))){for(const field of statusFields)merged[field]=previous[field];}
 return merged;
}
const when=value=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString():null;
export function automationSummary(data){
 const discovery=data.lastDiscovery,check=data.lastCheck;
 const parts=[];
 if(discovery)parts.push((discovery.status==='completed'?'Latest discovery':'Discovery '+(discovery.status||'in progress'))+': '+(when(discovery.completedAt||discovery.startedAt)||discovery.day)+'.');
 else parts.push('The first daily discovery has not run yet.');
 if(check?.checkedAt)parts.push('Latest availability batch: '+when(check.checkedAt)+'.');
 if(data.counts)parts.push(data.counts.closed+' inactive · '+data.counts.unknown+' unverified'+(data.counts.due?' · '+data.counts.due+' awaiting a check':'')+'.');
 if(when(data.nextDiscoveryAt))parts.push('Next daily discovery: '+when(data.nextDiscoveryAt)+'.');
 if(when(data.nextRunAt))parts.push('Next background check: '+when(data.nextRunAt)+'.');
 if(Number.isFinite(data.monthlyUsed)&&Number.isFinite(data.monthlyLimit))parts.push(data.monthlyUsed+' / '+data.monthlyLimit+' search requests used this month; up to '+data.searchCallsPerDay+' scheduled per day.');
 if(discovery?.errors?.length)parts.push('Some sources were unavailable during the latest run.');
 return {state:data.enabled?'Scheduled':'Paused',added:discovery?.added??'—',checked:check?.checked??'—',closed:check?.closed??'—',text:parts.join(' ')};
}
async function refreshAutomation(){
 const status=document.getElementById('daily-status');
 try{const summary=automationSummary(await cloudRequest('/automation'));document.getElementById('daily-state').textContent=summary.state;for(const [id,value] of [['daily-added',summary.added],['daily-checked',summary.checked],['daily-closed',summary.closed]])document.getElementById(id).textContent=String(value);document.getElementById('daily-counts').hidden=false;status.textContent=summary.text;}
 catch{document.getElementById('daily-state').textContent='Status unavailable';status.textContent='Daily-run status could not be loaded. Your library remains available; use Refresh library to try again.';}
}
export async function setupCloud(onLoad){
 const status=document.getElementById('cloud-status'),unlock=document.getElementById('cloud-unlock'),refresh=document.getElementById('cloud-refresh');
 try{const config=await fetch('./cloud-config.json',{cache:'no-cache'}).then(r=>r.json());const url=new URL(config.endpoint);if(url.protocol!=='https:'||!url.hostname.endsWith('.workers.dev'))throw new Error();endpoint=url.origin;}catch{status.textContent='Online library setup is pending. Current imports are session-only.';unlock.disabled=true;return;}
 let loading=false;
 const loadLibrary=async()=>{
  if(loading)return;loading=true;unlock.disabled=true;refresh.disabled=true;status.textContent='Opening your online library…';
  const jobs=[],cursors=new Set();let cursor='',searchEnabled=false;
  try{
   do{const data=await cloudRequest('/jobs'+(cursor?'?cursor='+encodeURIComponent(cursor):''));jobs.push(...data.jobs);searchEnabled=data.searchEnabled;cursor=data.nextCursor||'';if(cursor&&cursors.has(cursor))throw new Error('Library pagination could not finish. Refresh to try again.');cursors.add(cursor);status.textContent='Loading '+jobs.length+' saved jobs…';}while(cursor);
   onLoad(jobs);document.getElementById('cloud-save-current').disabled=false;document.getElementById('online-search').disabled=!searchEnabled;
   const inactive=jobs.filter(job=>job.closed===true||job.availability==='closed').length;
   status.textContent=jobs.length+' saved jobs loaded'+(inactive?' · '+inactive+' inactive, hidden from the default list':'')+'. New imports save automatically.'+(!searchEnabled?' Wider search awaits a search-provider connection.':'');
   await refreshAutomation();
  }catch(error){if(error.status===401){key='';document.getElementById('cloud-save-current').disabled=true;document.getElementById('online-search').disabled=true;}status.textContent=error.message;}
  finally{loading=false;unlock.disabled=false;refresh.disabled=!connected();}
 };
 unlock.onclick=async()=>{key=document.getElementById('cloud-key').value.trim();document.getElementById('cloud-key').value='';document.getElementById('cloud-save-current').disabled=true;document.getElementById('online-search').disabled=true;await loadLibrary();};
 refresh.onclick=loadLibrary;
 status.textContent='Unlock to load your saved jobs. Clearing browser data does not delete the online library.';
}
