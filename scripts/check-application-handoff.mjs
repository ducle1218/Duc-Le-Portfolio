import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {prepareHandoff,studioURL,employerURL} from '../tools/application-helper/handoff-core.mjs';
const payload={job:{url:'https://careers.example.com/apply/123',title:'Engineering Intern',company:'Example Engineering'},profile:{confirmed:true,values:{firstName:'Sample',lastName:'Applicant',email:'sample@example.com'}}};
const studio={id:'helper',frameId:0,url:'https://ducle1218.github.io/Duc-Le-Portfolio/applications/',tab:{id:1}};
assert(studioURL(studio.url));assert(!studioURL('https://ducle1218.github.io/another-project/applications/'));assert(!studioURL('https://ducle1218.github.io.attacker.com/Duc-Le-Portfolio/applications/'));
for(const url of ['http://careers.example.com','https://user:pass@careers.example.com','https://localhost','https://127.0.0.1','https://[::1]','file:///tmp/a','javascript:alert(1)'])assert.equal(employerURL(url),null,url);
assert.throws(()=>prepareHandoff({...payload,profile:{confirmed:false}}));
const stored=new Map(),tabs=new Map(),grants=new Set(),injections=[],deliveries=[],badges=[];let messageListener,updateListener,removeListener,nextId=2;
globalThis.chrome={runtime:{id:'helper',getURL:path=>'chrome-extension://helper/'+path,getManifest:()=>({version:'1.1.0'}),onMessage:{addListener:cb=>messageListener=cb}},storage:{session:{get:async key=>key===null?Object.fromEntries(stored):{[key]:stored.get(key)},set:async data=>Object.entries(data).forEach(([k,v])=>stored.set(k,v)),remove:async keys=>{for(const k of Array.isArray(keys)?keys:[keys])stored.delete(k);}}},permissions:{contains:async ({origins})=>origins.every(o=>grants.has(o))},tabs:{create:async data=>{const tab={id:nextId++,...data};tabs.set(tab.id,tab);return tab;},update:async(id,data)=>Object.assign(tabs.get(id),data),sendMessage:async(id,data)=>deliveries.push({id,data}),onUpdated:{addListener:cb=>updateListener=cb},onRemoved:{addListener:cb=>removeListener=cb}},scripting:{executeScript:async data=>injections.push(data)},action:{setBadgeText:async data=>badges.push(data)}};
await import('../tools/application-helper/background.mjs');
const send=(message,sender=studio)=>new Promise(resolve=>messageListener(message,sender,resolve));
assert.equal((await send({type:'studio-hello'})).version,'1.1.0');
for(const sender of [{...studio,url:'https://evil.example/'},{...studio,frameId:1},{...studio,id:'other'}])assert.equal((await send({type:'studio-start',payload},sender)).ok,false);
assert.equal(tabs.size,0);assert.equal((await send({type:'studio-start',payload:{...payload,profile:{confirmed:false}}})).ok,false);
assert.equal((await send({type:'studio-start',payload})).ok,true);assert.equal(tabs.get(2).url,'chrome-extension://helper/launch.html?ready=1');assert.equal(stored.get('handoff:2').profile.values.firstName,'Sample');assert(!JSON.stringify([...tabs.values()]).includes('sample@example.com'));
const extension={id:'helper',url:'chrome-extension://helper/launch.html'};
assert.equal((await send({type:'get-handoff',tabId:2},studio)).ok,false);
assert.equal((await send({type:'open-handoff',tabId:2},extension)).ok,false);assert(tabs.get(2).url.startsWith('chrome-extension:'));
grants.add('https://careers.example.com/*');assert.equal((await send({type:'open-handoff',tabId:2},extension)).ok,true);assert.equal(tabs.get(2).url,payload.job.url);
updateListener(2,{status:'complete'},tabs.get(2));await new Promise(r=>setTimeout(r,20));assert.equal(injections.length,1);assert.equal(deliveries[0].data.entry.profile.values.email,'sample@example.com');
updateListener(2,{status:'complete'},{url:'https://different.example.com/form'});await new Promise(r=>setTimeout(r,20));assert.equal(injections.length,1);assert.equal(deliveries.length,1);
stored.get('handoff:2').expiresAt=Date.now()-1;assert.equal((await send({type:'get-handoff',tabId:2},extension)).entry,null);assert(!stored.has('handoff:2'));
await send({type:'studio-start',payload});assert.equal(tabs.get(3).url,payload.job.url);removeListener(3);await new Promise(r=>setImmediate(r));assert(!stored.has('handoff:3'));
await send({type:'studio-start',payload});await send({type:'stop-handoff',tabId:4},extension);assert(!stored.has('handoff:4'));
// Exercise the real bridge in a fake page. Only same-window, exact-origin messages pass.
const calls=[],replies=[];let receive;const win={addEventListener:(name,cb)=>receive=cb,postMessage:(data,origin)=>replies.push({data,origin})};
const context={window:win,location:new URL(studio.url),chrome:{runtime:{sendMessage:async m=>{calls.push(m);return {ok:true,version:'1.1.0'};}}}};
vm.runInNewContext(await readFile(new URL('../tools/application-helper/bridge.js',import.meta.url),'utf8'),context);
const event={source:win,origin:'https://ducle1218.github.io',data:{channel:'duc-application-studio-v1',action:'hello',id:'test'}};
await receive({...event,source:{}});await receive({...event,origin:'https://evil.example'});assert.equal(calls.length,0);
await receive(event);assert.equal(calls[0].type,'studio-hello');assert.equal(replies[0].data.id,'test');assert.equal(replies[0].origin,event.origin);
// Exercise the actual injected panel: suggestions appear, nothing fills before explicit review.
let dom;try{dom=await import('linkedom');}catch{dom=await import('../../tmp/job-tests/node_modules/linkedom/esm/index.js');}
const {document,window}=dom.parseHTML('<html><body><input aria-label="First name" type="text"><input aria-label="Last name" type="text"><input aria-label="GPA" type="text"><button type="submit">Submit</button></body></html>');let shadow;
const attach=window.Element.prototype.attachShadow;window.Element.prototype.attachShadow=function(options){shadow=attach.call(this,options);return shadow;};
Object.assign(globalThis,{document,location:new URL(payload.job.url),MutationObserver:window.MutationObserver,HTMLInputElement:window.HTMLInputElement,HTMLTextAreaElement:window.HTMLTextAreaElement,HTMLSelectElement:window.HTMLSelectElement,Event:window.Event,getComputedStyle:()=>({visibility:'visible'})});
for(const e of document.querySelectorAll('input'))e.getClientRects=()=>[{}];let submitted=0;document.querySelector('button').onclick=()=>submitted++;chrome.runtime.sendMessage=async()=>({ok:true});
await import('../tools/application-helper/assistant.mjs');messageListener({type:'application-handoff',entry:prepareHandoff(payload)},{id:'helper'});
assert.equal(document.querySelector('input').value,'');assert.equal(shadow.querySelectorAll('.answer').length,2);assert.equal(document.querySelectorAll('input').length,3);
// linkedom does not mirror the checked property into its :checked selector.
for(const check of shadow.querySelectorAll('input'))check.setAttribute('checked','');
document.querySelector('input[aria-label="Last name"]').value='User edit';shadow.querySelector('.fill').click();assert.equal(document.querySelector('input').value,'Sample');assert.equal(document.querySelector('input[aria-label="Last name"]').value,'User edit');assert.equal(document.querySelector('input[aria-label="GPA"]').value,'');assert.equal(submitted,0);
shadow.querySelector('button[aria-label="End application helper"]').click();
console.log('PASS: trusted website bridge, confirmed profile handoff, per-origin permission gate, tab sessions/expiry, redirect isolation, panel review, preserved user edits, and no submission.');
