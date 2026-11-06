let endpoint='',key='';
export const connected=()=>!!endpoint&&!!key;
export async function cloudRequest(path,method='GET',data){
 if(!connected())throw new Error('Unlock the online library first.');
 const response=await fetch(endpoint+path,{method,headers:{Authorization:'Bearer '+key,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,credentials:'omit',signal:AbortSignal.timeout(30000)});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Online library unavailable.');return result;
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
export async function setupCloud(onLoad){
 const status=document.getElementById('cloud-status'),unlock=document.getElementById('cloud-unlock');
 try{const config=await fetch('./cloud-config.json',{cache:'no-cache'}).then(r=>r.json());const url=new URL(config.endpoint);if(url.protocol!=='https:'||!url.hostname.endsWith('.workers.dev'))throw new Error();endpoint=url.origin;}catch{status.textContent='Online library setup is pending. Current imports are session-only.';unlock.disabled=true;return;}
 unlock.onclick=async()=>{key=document.getElementById('cloud-key').value.trim();document.getElementById('cloud-key').value='';status.textContent='Opening your online library…';try{const data=await cloudRequest('/jobs');onLoad(data.jobs);document.getElementById('cloud-save-current').disabled=false;document.getElementById('online-search').disabled=!data.searchEnabled;status.textContent=data.jobs.length+' saved jobs loaded. New imports will save automatically.'+(!data.searchEnabled?' Wider search awaits a search-provider connection.':'');}catch(error){key='';document.getElementById('cloud-save-current').disabled=true;document.getElementById('online-search').disabled=true;status.textContent=error.message;}};
 status.textContent='Unlock to load your saved jobs. Clearing browser data does not delete the online library.';
}
