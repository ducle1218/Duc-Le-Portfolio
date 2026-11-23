import {studioURL,prepareHandoff,originPattern,employerURL} from './handoff-core.mjs';
import {cleanMemory,mergeMemory} from './answer-memory.mjs';
import {PREFERENCE_ANSWERS} from './answer-rules.mjs';
import {loadPortfolio} from './portfolio-source.mjs';
chrome.runtime.onInstalled.addListener(({reason}) => {
  if (reason === 'update') return chrome.storage.local.remove('answerVault');
});
const portfolio=async force=>await chrome.permissions.contains({origins:['https://ducle1218.github.io/*']})?loadPortfolio({force}):{state:'needs-access',knowledge:null,notice:'Allow portfolio access when reloading the updated helper.'};
let memoryWrite=Promise.resolve();
let preferenceSeed;
const readMemory=async()=>{
 // One migration per installation; edits and deletions persist after restart.
 preferenceSeed??=(async()=>{const saved=await chrome.storage.local.get(['answerMemory','preferences160']);if(saved.preferences160)return;const existing=cleanMemory(saved.answerMemory||[]);const additions=PREFERENCE_ANSWERS.filter(p=>!existing.some(a=>a.question===p.question)).map(p=>({...p,scope:'*'}));await chrome.storage.local.set({answerMemory:mergeMemory(existing,additions),preferences160:true});})();
 await preferenceSeed;return cleanMemory((await chrome.storage.local.get('answerMemory')).answerMemory||[]);
};
const writeMemory=fn=>{const task=memoryWrite.then(async()=>{const items=await fn(await readMemory());await chrome.storage.local.set({answerMemory:items});return items;});memoryWrite=task.catch(()=>{});return task;};
const key=id=>'handoff:'+id;
const extensionPage=sender=>sender.id===chrome.runtime.id&&sender.url?.startsWith(chrome.runtime.getURL(''));
async function record(id){const entry=(await chrome.storage.session.get(key(id)))[key(id)];if(!entry||entry.expiresAt<Date.now()){await chrome.storage.session.remove(key(id));return null;}return entry;}
async function clearExpired(){const all=await chrome.storage.session.get(null);await chrome.storage.session.remove(Object.entries(all).filter(([k,v])=>k.startsWith('handoff:')&&v.expiresAt<Date.now()).map(([k])=>k));}
async function launch(entry){
 // Confirmed Studio profiles remain available after the temporary tab session ends.
 await chrome.storage.local.set({profile:entry.profile});
 await clearExpired();const tab=await chrome.tabs.create({url:chrome.runtime.getURL('launch.html')});
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
   if(message.type==='studio-hello')return {ok:true,version:chrome.runtime.getManifest().version};
   if(message.type==='studio-start'){
    const entry=prepareHandoff(message.payload),token=message.payload?.targetToken;
    if(!token)return launch(entry);
    if(!/^[a-f0-9-]{36}$/.test(token)||message.payload.confirmTarget!==true||!entry.resume)throw new Error('Confirm the matching job and prepare its PDF before connecting this application.');
    const targetKey='resume-target:'+token,target=(await chrome.storage.session.get(targetKey))[targetKey];
    if(!target||target.expiresAt<Date.now())throw new Error('The application connection expired. Start from the helper again.');
    const tab=await chrome.tabs.get(target.tabId);
    if(!employerURL(tab?.url)||new URL(tab.url).origin!==target.origin||!await chrome.permissions.contains({origins:[originPattern(tab.url)]}))throw new Error('The application changed or access is missing. Reconnect from its helper.');
    entry.origin=target.origin;await chrome.storage.local.set({profile:entry.profile});await chrome.storage.session.set({[key(tab.id)]:entry});await chrome.storage.session.remove(targetKey);await attach(tab.id,tab);return {ok:true,started:true,connected:true};
   }
  }
  if(message?.type==='resume-attached'){
   const trusted=extensionPage(sender),id=trusted?Number(message.tabId):sender.tab?.id,entry=await record(id);
   if(!entry?.resume||message.sha256!==entry.resume.sha256||(!trusted&&(sender.id!==chrome.runtime.id||sender.frameId!==0||!employerURL(sender.url)||new URL(sender.url).origin!==entry.origin)))throw new Error('Resume confirmation does not match this application.');
   await chrome.storage.session.set({[key(id)]:{...entry,resumeUploaded:true}});return {ok:true};
  }
  if(message?.type==='link-current-application'&&extensionPage(sender)){
   const tab=await chrome.tabs.get(Number(message.tabId));if(!employerURL(tab?.url)||!await chrome.permissions.contains({origins:[originPattern(tab.url)]}))throw new Error('Allow access to this employer before connecting its resume.');
   const token=crypto.randomUUID();await chrome.storage.session.set({['resume-target:'+token]:{tabId:tab.id,origin:new URL(tab.url).origin,expiresAt:Date.now()+30*60*1000}});
   return {ok:true,url:'https://ducle1218.github.io/Duc-Le-Portfolio/applications/?applicationTarget='+token+'&applicationHost='+encodeURIComponent(new URL(tab.url).hostname)};
  }
  if(message?.type==='get-handoff'&&extensionPage(sender)){const id=Number(message.tabId??sender.tab?.id);const entry=await record(id);return {ok:true,entry};}
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
async function attach(id,tab){
 if(injecting.has(id))return;const entry=await record(id);if(!entry)return;
 if(!employerURL(tab.url)||new URL(tab.url).origin!==entry.origin){await chrome.action.setBadgeText({tabId:id,text:'↗'});return;}
 if(!await chrome.permissions.contains({origins:[originPattern(tab.url)]}))return;
 injecting.add(id);try{const memory=(await readMemory()).filter(a=>a.scope==='*'||a.scope===entry.origin);const evidence=await portfolio(false);await chrome.scripting.executeScript({target:{tabId:id},files:['assistant.bundle.js']});await chrome.tabs.sendMessage(id,{type:'application-handoff',entry:{...entry,memory,portfolio:evidence}});await chrome.action.setBadgeText({tabId:id,text:'ON'});}catch{await chrome.action.setBadgeText({tabId:id,text:'!'}).catch(()=>{});}finally{injecting.delete(id);}
}
chrome.tabs.onUpdated.addListener((id,change,tab)=>{if(change.status==='complete')attach(id,tab).catch(()=>{});});
chrome.tabs.onRemoved.addListener(id=>{chrome.storage.session.remove(key(id)).catch(()=>{});});
