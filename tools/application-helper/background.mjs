import {savedEmployerSites} from './account-vault.mjs';
import {studioURL,prepareHandoff,originPattern,employerURL} from './handoff-core.mjs';
import {cleanProfile,employerSites} from './application-core.mjs';
import {cleanMemory,mergeMemory} from './answer-memory.mjs';
import {PREFERENCE_ANSWERS} from './answer-rules.mjs';
import {loadPortfolio,includedPortfolio} from './portfolio-source.mjs';
chrome.runtime.onInstalled.addListener(async ({reason}) => {
  if(reason==='update')await chrome.storage.local.remove('answerVault');
  await loadDeviceProfile();
  const tabs=await chrome.tabs.query({url:'https://ducle1218.github.io/Duc-Le-Portfolio/*'});
  await Promise.allSettled(tabs.filter(t=>studioURL(t.url)).map(t=>chrome.scripting.executeScript({target:{tabId:t.id},files:['bridge.js']})));
});
// Optional owner-provisioned file in this device's unpacked folder. Never part of a release ZIP.
async function loadDeviceProfile(){
 let data;
 try{
  const response=await fetch(chrome.runtime.getURL('device-profile.json'));
  if(!response.ok)return;
  data=await response.json();
 }catch{return;}
 if(data.format!=='duc-application-profile-v1'||!Number.isFinite(Date.parse(data.exportedAt)))return;
 const {deviceProfileRevision,studioProfile,employerSites:knownSites}=await chrome.storage.local.get(['deviceProfileRevision','studioProfile','employerSites']);
 if(deviceProfileRevision===data.exportedAt)return;
 const profile={...cleanProfile(data.profile),confirmedAt:data.profile.confirmedAt};
 if(studioProfile&&Date.parse(studioProfile.confirmedAt)>Date.parse(profile.confirmedAt))return;
 await chrome.storage.local.set({profile,studioProfile:profile,employerSites:employerSites(knownSites,data.employerAccounts),deviceProfileRevision:data.exportedAt});
}
const portfolio=async force=>await chrome.permissions.contains({origins:['https://ducle1218.github.io/*']})?loadPortfolio({force}):includedPortfolio();
let memoryWrite=Promise.resolve();
let preferenceSeed;
const readMemory=async()=>{
 // One migration per installation; edits and deletions persist after restart.
 preferenceSeed??=(async()=>{const saved=await chrome.storage.local.get(['answerMemory','preferences160']);if(saved.preferences160)return;const existing=cleanMemory(saved.answerMemory||[]);const additions=PREFERENCE_ANSWERS.filter(p=>!existing.some(a=>a.question===p.question)).map(p=>({...p,scope:'*'}));await chrome.storage.local.set({answerMemory:mergeMemory(existing,additions),preferences160:true});})();
 await preferenceSeed;return cleanMemory((await chrome.storage.local.get('answerMemory')).answerMemory||[]);
};
const writeMemory=fn=>{const task=memoryWrite.then(async()=>{const items=await fn(await readMemory());await chrome.storage.local.set({answerMemory:items});return items;});memoryWrite=task.catch(()=>{});return task;};
const uploadLocks=new Set(),preparations=new Map();
function oncePerJob(key,work){
 if(!preparations.has(key))preparations.set(key,Promise.resolve().then(work).finally(()=>preparations.delete(key)));
 return preparations.get(key);
}
const key=id=>'handoff:'+id;
const extensionPage=sender=>sender.id===chrome.runtime.id&&sender.url?.startsWith(chrome.runtime.getURL(''));
async function record(id){const entry=(await chrome.storage.session.get(key(id)))[key(id)];if(!entry||entry.expiresAt<Date.now()){await chrome.storage.session.remove(key(id));return null;}return entry;}
// Match only explicit posting IDs on the same employer origin. Locale and campaign parameters can change between steps.
function samePosting(a,b){
 try{
  const left=new URL(a),right=new URL(b);
  if(left.protocol!=='https:'||left.origin!==right.origin)return false;
  for(const key of ['jobSeqNo','jobId','pid','gh_jid']){
   const id=left.searchParams.get(key);
   if(id&&right.searchParams.get(key)===id)return true;
  }
  return left.pathname===right.pathname&&/\/(?:job|jobs)\/(?:\d{3,}|[^/]*[_-]R?\d{4,})(?:\/|$)/i.test(left.pathname)&&left.search===right.search&&left.hash===right.hash;
 }catch{return false;}
}
async function reconnectResume(id){
 const tab=await chrome.tabs.get(id);
 if(!employerURL(tab?.url))return null;
 const records=await chrome.storage.session.get(null);
 const matches=Object.entries(records).filter(([k,e])=>k.startsWith('handoff:')&&e.expiresAt>Date.now()&&e.autoResume&&e.resume&&e.origin===new URL(tab.url).origin&&samePosting(e.job.url,tab.url)).map(([,e])=>e);
 if(!matches.length||new Set(matches.map(e=>e.resume.sha256)).size!==1)return null;
 const entry={...matches[0],resumeUploaded:false};
 await chrome.storage.session.set({[key(id)]:entry});
 return entry;
}
async function clearExpired(){const all=await chrome.storage.session.get(null);await chrome.storage.session.remove(Object.entries(all).filter(([k,v])=>k.startsWith('handoff:')&&v.expiresAt<Date.now()).map(([k])=>k));}
// Read only public posting metadata. Application answers and sign-in URLs never enter Studio.
async function readPosting(){
 const clean=value=>{const u=new URL(value,location.href);if(u.origin!==location.origin||u.protocol!=='https:')return '';const safe=new URL(u.pathname,u.origin);for(const k of ['pid','jobId','jobSeqNo','gh_jid'])if(/^[\w-]+$/.test(u.searchParams.get(k)||''))safe.searchParams.set(k,u.searchParams.get(k));return safe.href;};
 const extract=(doc,url)=>{
  const postings=[];
  for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){
   try{const visit=x=>{if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object'){if([x['@type']].flat().includes('JobPosting'))postings.push(x);if(x['@graph'])visit(x['@graph']);}};visit(JSON.parse(script.textContent));}catch{}
  }
  const job=postings.length===1?postings[0]:null;
  if(postings.length>1)return null;
  const desc=job?.description?new DOMParser().parseFromString(job.description,'text/html').body.textContent:doc.querySelector('[itemprop=description],[data-automation-id=jobPostingDescription]')?.textContent;
  const title=job?.title||doc.querySelector('[itemprop=title],[data-automation-id=jobPostingHeader],h1')?.textContent;
  if(!title||!desc||desc.trim().length<100)return null;
  return {url,title:title.trim().slice(0,220),company:String(job?.hiringOrganization?.name||location.hostname).slice(0,160),description:desc.trim().slice(0,50000)};
 };
 const current=clean(location.href),job=extract(document,current);if(job)return job;
 const links=[...new Set([...document.querySelectorAll('a[href]')].filter(a=>/^(?:view |see |back to )?(?:the )?(?:job (?:posting|description|details)|position details)$/i.test(a.textContent.trim())).map(a=>clean(a.href)).filter(Boolean))];
 const currentURL=new URL(current),pid=currentURL.searchParams.get('pid');
 if(!links.length&&pid&&/^\d+$/.test(pid)){
  const sameJob=[...document.querySelectorAll('a[href]')].map(a=>clean(a.href)).filter(h=>h&&new URL(h).pathname.split('/').includes(pid)&&/\/jobs?\//i.test(new URL(h).pathname));
  links.push(...new Set(sameJob));
 }
 if(!links.length&&/\/jobs?\//i.test(currentURL.pathname)&&/\/apply(?:\/.*)?$/i.test(currentURL.pathname))links.push(current.replace(/\/apply(?:\/[^?]*)?(?=\?|$)/i,''));
 if(links.length===1&&links[0]!==current){
  const response=await fetch(links[0],{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(7000)});
  if(response.ok){const posting=extract(new DOMParser().parseFromString(await response.text(),'text/html'),links[0]);if(posting)return posting;}
  return {url:links[0]};
 }
 if(/\/(?:job|jobs)\/[^/]+/i.test(new URL(current).pathname)||['pid','jobSeqNo','jobId','gh_jid'].some(key=>new URL(current).searchParams.has(key)))return {url:current};
 return null;
}
async function launch(entry){
 // Confirmed Studio profiles remain available after the temporary tab session ends.
 await chrome.storage.local.set({profile:entry.profile});
 await clearExpired();
 const sessions=await chrome.storage.session.get(null);
 for(const [name,previous] of Object.entries(sessions)){
  if(!name.startsWith('handoff:')||previous.origin!==entry.origin||!(samePosting(previous.job.url,entry.job.url)||(previous.job.url===entry.job.url&&previous.job.title===entry.job.title&&previous.job.company===entry.job.company)))continue;
  const existing=await chrome.tabs.get(Number(name.slice(8))).catch(()=>null);
  if(existing&&employerURL(existing.url)&&new URL(existing.url).origin===entry.origin){
   await chrome.tabs.update(existing.id,{active:true});return {ok:true,started:true};
  }
 }
 const tab=await chrome.tabs.create({url:chrome.runtime.getURL('launch.html')});
 await chrome.storage.session.set({[key(tab.id)]:entry});
 // navigate only after the session record exists, avoiding races with the destination load
 if(await chrome.permissions.contains({origins:[originPattern(entry.job.url)]}))await chrome.tabs.update(tab.id,{url:entry.job.url});
 else await chrome.tabs.update(tab.id,{url:chrome.runtime.getURL('launch.html')+'?ready=1'});
 return {ok:true,started:true};
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 (async()=>{
  if(message?.type==='portfolio-read'&&extensionPage(sender))return {ok:true,portfolio:await portfolio(message.force===true)};
  if(message?.type?.startsWith('studio-')){
   if(sender.id!==chrome.runtime.id||sender.frameId!==0||!studioURL(sender.url))throw new Error('Only Application Studio can start a handoff.');
   if(message.type==='studio-auto-posting-failed'){
    const key='resume-target:'+message.payload?.token,target=(await chrome.storage.session.get(key))[key];
    if(target?.autoJob&&target.workerId===sender.tab.id){await chrome.storage.session.set({[key]:{...target,failed:true}});await chrome.tabs.remove(target.workerId);}
    return {ok:true};
   }
   if(message.type==='studio-auto-posting'){
    const token=message.payload?.token,key='resume-target:'+token,target=(await chrome.storage.session.get(key))[key];
    if(!target?.autoJob||target.expiresAt<Date.now()||target.workerId!==sender.tab?.id)throw Error('Posting preparation expired.');
    const {profile}=await chrome.storage.local.get('profile');return {ok:true,job:target.autoJob,profile};
   }
   if(message.type==='studio-hello')return {ok:true,version:chrome.runtime.getManifest().version};
   if(message.type==='studio-employer-sites')return {ok:true,sites:await savedEmployerSites(chrome.storage.local)};
   if(message.type==='studio-read-profile'){
    await loadDeviceProfile();
    const {studioProfile}=await chrome.storage.local.get('studioProfile');
    return {ok:true,profile:studioProfile||null};
   }
   if(message.type==='studio-sync-profile'){
    const profile=cleanProfile(message.payload);
    await chrome.storage.local.set({profile,studioProfile:{...profile,confirmedAt:message.payload.confirmedAt||profile.confirmedAt}});
    return {ok:true,count:profile.answers.length};
   }
   if(message.type==='studio-start'){
    const entry=prepareHandoff(message.payload),token=message.payload?.targetToken;
    if(!token)return oncePerJob('launch:'+entry.job.url,()=>launch(entry));
    if(!/^[a-f0-9-]{36}$/.test(token)||message.payload.confirmTarget!==true||!entry.resume)throw new Error('Confirm the matching job and prepare its PDF before connecting this application.');
    const targetKey='resume-target:'+token,target=(await chrome.storage.session.get(targetKey))[targetKey];
    if(!target||target.expiresAt<Date.now())throw new Error('The application connection expired. Start from the helper again.');
    const tab=await chrome.tabs.get(target.tabId);
    if(!employerURL(tab?.url)||new URL(tab.url).origin!==target.origin||(!target.autoJob&&!await chrome.permissions.contains({origins:[originPattern(tab.url)]})))throw new Error('The application changed or access is missing. Reconnect from its helper.');
    if(target.autoJob&&(target.workerId!==sender.tab?.id||entry.job.url!==target.autoJob.url||tab.url!==target.original&&!samePosting(tab.url,target.original)))throw Error('The open posting changed.');
    entry.origin=target.origin;await chrome.storage.local.set({profile:entry.profile});await chrome.storage.session.set({[key(tab.id)]:entry});await chrome.storage.session.remove(targetKey);await attach(tab.id,tab,target.autoJob!=null);if(target.autoJob)await chrome.tabs.remove(target.workerId).catch(()=>{});return {ok:true,started:true,connected:true};
   }
  }
  if(['claim-resume','open-resume-preview','full-helper'].includes(message?.type)){
   const id=extensionPage(sender)?Number(message.tabId):sender.tab?.id;
   const entry=await record(id);
   if(!entry||(!extensionPage(sender)&&(sender.id!==chrome.runtime.id||!employerURL(sender.url)||new URL(sender.url).origin!==entry.origin)))return {ok:false};
   if(message.type==='full-helper'){if(message.scan)await chrome.storage.session.set({panelScan:{id,time:Date.now()}});await chrome.action.openPopup();return {ok:true};}
   if(!entry.resume)return {ok:false};
   if(message.type==='open-resume-preview'){await chrome.tabs.create({url:chrome.runtime.getURL('preview.html')+'?tab='+id});return {ok:true};}
   if(entry.resume.sha256!==message.sha256||entry.resumeUploaded||uploadLocks.has(id))return {ok:false};
   uploadLocks.add(id);
   try{
    const receiptKey='resume-receipt:'+id,previous=(await chrome.storage.session.get(receiptKey))[receiptKey];
    if(previous&&previous.origin===entry.origin&&(previous.jobUrl===entry.job.url||samePosting(previous.jobUrl,entry.job.url)))return {ok:false};
    await chrome.storage.session.set({[receiptKey]:{origin:entry.origin,jobUrl:entry.job.url,resume:entry.resume}});
    return {ok:true};
   }finally{uploadLocks.delete(id);}
  }
  if(message?.type==='preview-pdf'&&extensionPage(sender)){
   const id=Number(message.tabId),receipt=(await chrome.storage.session.get('resume-receipt:'+id))['resume-receipt:'+id],entry=await record(id);
   const belongs=receipt&&(!entry||(entry.origin===receipt.origin&&(entry.job.url===receipt.jobUrl||samePosting(entry.job.url,receipt.jobUrl))));
   return {ok:true,resume:(belongs?receipt.resume:entry?.resume)||null};
  }
  if(message?.type==='resume-attached'){
   const trusted=extensionPage(sender),id=trusted?Number(message.tabId):sender.tab?.id,entry=await record(id);
   if(!entry?.resume||message.sha256!==entry.resume.sha256||(!trusted&&(sender.id!==chrome.runtime.id||sender.frameId!==0||!employerURL(sender.url)||new URL(sender.url).origin!==entry.origin)))throw new Error('Resume confirmation does not match this application.');
   await chrome.storage.session.set({[key(id)]:{...entry,resumeUploaded:true}});return {ok:true};
  }
  if(message?.type==='auto-prepare-resume'&&extensionPage(sender)){
   return oncePerJob('prepare:'+message.tabId,async()=>{
   const tab=await chrome.tabs.get(Number(message.tabId));if(!employerURL(tab.url)||(await record(tab.id))?.resume)return {ok:true};
   const jobs=await chrome.storage.session.get(null);
   const recent=Object.entries(jobs).find(([k,t])=>k.startsWith('resume-target:')&&t.autoJob&&t.original===tab.url&&t.tabId===tab.id&&t.expiresAt>Date.now());
   if(recent)return {ok:true,pending:!recent[1].failed};
   const job=(await chrome.scripting.executeScript({target:{tabId:tab.id},func:readPosting}))[0]?.result;
   if(!job)return {ok:true,pending:false};
   const token=crypto.randomUUID(),worker=await chrome.tabs.create({url:'about:blank',active:false});
   await chrome.storage.session.set({['resume-target:'+token]:{origin:new URL(tab.url).origin,original:tab.url,tabId:tab.id,workerId:worker.id,autoJob:job,expiresAt:Date.now()+120000}});
   await chrome.tabs.update(worker.id,{url:'https://ducle1218.github.io/Duc-Le-Portfolio/applications/?autoPosting='+token});
   return {ok:true,pending:true};
   });
  }
  if(message?.type==='link-current-application'&&extensionPage(sender)){
   const tab=await chrome.tabs.get(Number(message.tabId));if(!employerURL(tab?.url)||!await chrome.permissions.contains({origins:[originPattern(tab.url)]}))throw new Error('Allow access to this employer before connecting its resume.');
   const token=crypto.randomUUID();await chrome.storage.session.set({['resume-target:'+token]:{tabId:tab.id,origin:new URL(tab.url).origin,expiresAt:Date.now()+30*60*1000}});
   return {ok:true,url:'https://ducle1218.github.io/Duc-Le-Portfolio/applications/?applicationTarget='+token+'&applicationHost='+encodeURIComponent(new URL(tab.url).hostname)};
  }
  if(message?.type==='get-handoff'&&extensionPage(sender)){const id=Number(message.tabId??sender.tab?.id);const entry=await record(id)||await reconnectResume(id);return {ok:true,entry};}
  if(['memory-list','memory-save','memory-delete'].includes(message?.type)){
   const trusted=extensionPage(sender);let origin='',context='';
   if(!trusted){const entry=await record(sender.tab?.id);if(sender.id!==chrome.runtime.id||sender.frameId!==0||!entry||!employerURL(sender.url)||new URL(sender.url).origin!==entry.origin)throw new Error('Start this application from Studio before saving answers.');origin=entry.origin;context=entry.job.company.trim().toLowerCase();}
   let items;
   if(message.type==='memory-save'){const incoming=cleanMemory(message.items);if(!trusted&&incoming.some(a=>a.sourceOrigin!==origin||(a.scope!=='*'&&(a.scope!==origin||a.context!==context))))throw new Error('Answers must belong to the current employer.');items=await writeMemory(current=>mergeMemory(current,incoming));}
   else if(message.type==='memory-delete'){if(!trusted)throw new Error('Manage answers in the extension.');items=await writeMemory(current=>current.filter(a=>a.id!==message.id));}
   else items=await readMemory();
   return {ok:true,items:trusted?items:items.filter(a=>a.scope==='*'||(a.scope===origin&&a.context===context))};
  }
  if(message?.type==='open-handoff'&&extensionPage(sender)){
   const id=Number(message.tabId??sender.tab?.id),entry=await record(id);if(!entry)throw new Error('This application handoff expired. Start again from Application Studio.');
   if(!await chrome.permissions.contains({origins:[originPattern(entry.job.url)]}))throw new Error('Permission was not granted.');
   await chrome.tabs.update(id,{url:entry.job.url});return {ok:true};
  }
  if(message?.type==='stop-handoff'&&(extensionPage(sender)||sender.tab)){
   const id=extensionPage(sender)?Number(message.tabId??sender.tab?.id):sender.tab.id;await chrome.storage.session.remove(key(id));await chrome.action.setBadgeText({tabId:id,text:''});return {ok:true};
  }
  throw new Error('Unsupported extension request.');
 })().then(respond,error=>respond({ok:false,error:error.message}));return true;
});
const injecting=new Set();
async function attach(id,tab,activeScan=false){
 if(injecting.has(id))return;const entry=await record(id);if(!entry)return;
 if(!employerURL(tab.url)||new URL(tab.url).origin!==entry.origin){await chrome.action.setBadgeText({tabId:id,text:'↗'});return;}
 if(!activeScan&&!await chrome.permissions.contains({origins:[originPattern(tab.url)]}))return;
 injecting.add(id);try{const memory=(await readMemory()).filter(a=>a.scope==='*'||a.scope===entry.origin);const evidence=await portfolio(false);await chrome.scripting.executeScript({target:{tabId:id},files:['assistant.bundle.js']});await chrome.tabs.sendMessage(id,{type:'application-handoff',entry:{...entry,memory,portfolio:evidence}});await chrome.action.setBadgeText({tabId:id,text:'ON'});}catch{await chrome.action.setBadgeText({tabId:id,text:'!'}).catch(()=>{});}finally{injecting.delete(id);}
}
chrome.tabs.onUpdated.addListener((id,change,tab)=>{if(change.status==='complete')attach(id,tab).catch(()=>{});});
chrome.tabs.onRemoved.addListener(id=>{chrome.storage.session.remove([key(id),'resume-receipt:'+id]).catch(()=>{});});
