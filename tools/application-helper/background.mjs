import {studioURL,prepareHandoff,originPattern,employerURL} from './handoff-core.mjs';
import {cleanMemory,mergeMemory} from './answer-memory.mjs';
let memoryWrite=Promise.resolve();
const readMemory=async()=>cleanMemory((await chrome.storage.local.get('answerMemory')).answerMemory||[]);
const writeMemory=fn=>{const task=memoryWrite.then(async()=>{const items=await fn(await readMemory());await chrome.storage.local.set({answerMemory:items});return items;});memoryWrite=task.catch(()=>{});return task;};
const key=id=>'handoff:'+id;
const extensionPage=sender=>sender.id===chrome.runtime.id&&sender.url?.startsWith(chrome.runtime.getURL(''));
async function record(id){const entry=(await chrome.storage.session.get(key(id)))[key(id)];if(!entry||entry.expiresAt<Date.now()){await chrome.storage.session.remove(key(id));return null;}return entry;}
async function clearExpired(){const all=await chrome.storage.session.get(null);await chrome.storage.session.remove(Object.entries(all).filter(([k,v])=>k.startsWith('handoff:')&&v.expiresAt<Date.now()).map(([k])=>k));}
async function launch(entry){
 await clearExpired();const tab=await chrome.tabs.create({url:chrome.runtime.getURL('launch.html')});
 await chrome.storage.session.set({[key(tab.id)]:entry});
 // navigate only after the session record exists, avoiding races with the destination load
 if(await chrome.permissions.contains({origins:[originPattern(entry.job.url)]}))await chrome.tabs.update(tab.id,{url:entry.job.url});
 else await chrome.tabs.update(tab.id,{url:chrome.runtime.getURL('launch.html')+'?ready=1'});
 return {ok:true,started:true};
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 (async()=>{
  if(message?.type?.startsWith('studio-')){
   if(sender.id!==chrome.runtime.id||sender.frameId!==0||!studioURL(sender.url))throw new Error('Only Application Studio can start a handoff.');
   if(message.type==='studio-hello')return {ok:true,version:chrome.runtime.getManifest().version};
   if(message.type==='studio-start')return launch(prepareHandoff(message.payload));
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
 injecting.add(id);try{const memory=(await readMemory()).filter(a=>a.scope==='*'||a.scope===entry.origin);await chrome.scripting.executeScript({target:{tabId:id},files:['assistant.bundle.js']});await chrome.tabs.sendMessage(id,{type:'application-handoff',entry:{...entry,memory}});await chrome.action.setBadgeText({tabId:id,text:'ON'});}catch{await chrome.action.setBadgeText({tabId:id,text:'!'}).catch(()=>{});}finally{injecting.delete(id);}
}
chrome.tabs.onUpdated.addListener((id,change,tab)=>{if(change.status==='complete')attach(id,tab).catch(()=>{});});
chrome.tabs.onRemoved.addListener(id=>{chrome.storage.session.remove(key(id)).catch(()=>{});});
