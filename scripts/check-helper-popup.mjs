import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let dom;try{dom=await import('linkedom');}catch{dom=await import('../../tmp/job-tests/node_modules/linkedom/esm/index.js');}
const html=await readFile(new URL('../tools/application-helper/popup.html',import.meta.url),'utf8'),local=new Map();
globalThis.chrome={runtime:{getManifest:()=>({version:'1.2.1'}),sendMessage:async message=>message.type==='get-handoff'?{ok:true,entry:null}:{ok:true,items:[{question:'When can you start?',answer:'June 1'}]}},tabs:{query:async()=>[{id:7,url:'https://employer.example/apply'}]},storage:{local:{get:async key=>({[key]:local.get(key)}),set:async values=>Object.entries(values).forEach(([k,v])=>local.set(k,v)),remove:async key=>local.delete(key)}}};
const load=async n=>{const ui=dom.parseHTML(html);globalThis.document=ui.document;await import('../tools/application-helper/popup.mjs?test='+n);await new Promise(r=>setImmediate(r));return id=>document.getElementById(id);};
let $=await load(1);assert.equal($('connect-card').hidden,false);assert.equal($('saved-profile').hidden,true);assert.equal($('profile-settings').open,false);assert.equal($('scan').disabled,true);
$('profile-file').files=[{size:100,text:async()=>JSON.stringify({manifest_version:3})}];await $('profile-file').onchange();assert.match($('status').textContent,/extension manifest/);assert.equal(local.has('profile'),false);
$('profile-file').files=[{size:300,text:async()=>JSON.stringify({format:'duc-application-profile-v1',profile:{confirmed:true,values:{firstName:'Sample',lastName:'Applicant',email:'sample@example.com'}}})}];await $('profile-file').onchange();assert.equal($('scan').disabled,false);assert.equal($('profile-name').textContent,'Sample Applicant');assert.match($('status').textContent,/restarting/);
// A new popup, with no session handoff, recovers the persisted confirmed profile.
$=await load(2);assert.equal($('saved-profile').hidden,false);assert.equal($('connect-card').hidden,true);assert.equal($('profile-name').textContent,'Sample Applicant');assert.equal($('scan').disabled,false);assert.match($('memory-count').textContent,/1 saved/);
await $('forget').onclick();assert.equal(local.has('profile'),false);assert.equal($('connect-card').hidden,false);assert.match($('status').textContent,/saved answers.*unchanged/);
console.log('PASS: compact popup states, manifest rejection with correct-file guidance, profile import, persistence without a session, and explicit profile removal.');
