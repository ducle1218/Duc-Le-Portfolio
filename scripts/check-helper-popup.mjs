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

// Exercise the popup with no saved Q&A and real public project evidence.
const {preparePortfolio}=await import('../resume/generator/portfolio-answers.mjs');
const knowledge=preparePortfolio(JSON.parse(await readFile(new URL('../data/portfolio.json',import.meta.url))),JSON.parse(await readFile(new URL('../data/resume-match-profile.json',import.meta.url))));
local.set('profile',{confirmed:true,values:{firstName:'Sample',lastName:'Applicant'},answers:[]});
chrome.runtime.sendMessage=async message=>message.type==='portfolio-read'?{ok:true,portfolio:{state:'ready',knowledge,fetchedAt:Date.now()}}:message.type==='get-handoff'?{ok:true,entry:null}:{ok:true,items:[]};
let filled=[];
chrome.scripting={executeScript:async ({args})=>args[0].action==='scan'?[{result:{url:'https://employer.example/apply',fields:[{id:'cad',type:'text',label:'Do you have experience with SolidWorks?'},{id:'project',type:'textarea',label:'Describe a robotics project you worked on.'}]}}]:(filled=args[0].fields,[{result:{filled:filled.length,skipped:0}}])};
$=await load(3);await $('scan').onclick();
assert.equal($('suggestions').querySelectorAll('.answer').length,2);assert.equal($('suggestions').querySelectorAll('.portfolio-evidence').length,2);
const checks=[...$('suggestions').querySelectorAll('input')];
assert(checks.every(c=>c.checked),'All available answers start selected');
checks[1].checked=false;await $('fill').onclick();assert.equal(filled.length,1);assert.equal(filled[0].value,'Yes');
const {addPortfolioEvidence}=await import('../tools/application-helper/portfolio-ui.mjs');
addPortfolioEvidence($('suggestions'),{portfolioDerived:true,sources:[{title:'<img src=x>',quote:'<script>bad()</script>',url:'https://ducle1218.github.io/Duc-Le-Portfolio/?project=box-12'}]});
assert.equal($('suggestions').querySelector('script'),null);assert.equal($('suggestions').querySelector('img'),null);
console.log('PASS: empty-bank portfolio inference reaches popup, citations are escaped, suggestions start selected and only explicitly selected suggestions fill.');
const {accountCredential}=await import('../tools/application-helper/account-vault.mjs');
const origin='https://careers.example',email='candidate@example.com',phrase='sample vault passphrase',sitePassword='Fixture-only-42!';
const credentials={origin,email,employer:'First employer',phrase,repeat:phrase,sitePassword,signup:true};
assert.equal(await accountCredential(chrome.storage.local,credentials),sitePassword);
const other={...credentials,origin:'https://second.example',employer:'Second employer',sitePassword:''};
assert.equal(await accountCredential(chrome.storage.local,other),sitePassword);
for(const record of [credentials,other]){
 assert.equal(await accountCredential(chrome.storage.local,{...record,signup:false}),sitePassword);
}
assert(!JSON.stringify(local.get('employer-vault-v1')).includes(sitePassword));
await assert.rejects(accountCredential(chrome.storage.local,{...credentials,phrase:'wrong passphrase',signup:false}),/unlock/);
await assert.rejects(accountCredential(chrome.storage.local,{...credentials,origin:'https://third.example',signup:false}),/No saved login/);
await assert.rejects(accountCredential(chrome.storage.local,{...credentials,employer:'Another tenant',signup:false}),/No saved login/);

const {employerAccountForm}=await import('../tools/application-helper/account-form.mjs');
const formDOM=dom.parseHTML('<html><body><form><input type="email"><input type="password"><input type="password"><button type="submit">Create account</button></form></body></html>');
Object.assign(globalThis,{document:formDOM.document,location:new URL(origin+'/signup'),getComputedStyle:()=>({visibility:'visible'}),HTMLInputElement:formDOM.window.HTMLInputElement,Event:formDOM.window.Event});
const form=document.querySelector('form'),button=form.querySelector('button'),inputs=[...form.querySelectorAll('input')];
for(const el of [...inputs,button]){el.getClientRects=()=>[{}];Object.defineProperty(el,'form',{value:form});}
let registrations=0;button.onclick=()=>registrations++;form.checkValidity=()=>true;
const action={url:location.href,email,signup:true,password:sitePassword};
assert.equal(employerAccountForm({...action,inspectOnly:true}),true);
assert(inputs.every(el=>!el.value));assert.equal(registrations,0);
assert.match(employerAccountForm(action),/Registration requested/);
assert.deepEqual(inputs.map(el=>el.value),[email,sitePassword,sitePassword]);assert.equal(registrations,1);
button.textContent='Submit application';employerAccountForm(action);assert.equal(registrations,1);
inputs[2].remove();assert.match(employerAccountForm({...action,signup:false}),/Saved login filled/);assert.equal(registrations,1);
assert.match(employerAccountForm({...action,url:other.origin}).error,/page changed/);
console.log('PASS: shared encrypted employer password, origin and employer matching, registration, confirmation field and returning sign-in.');
const {scanCredential}=await import('../tools/application-helper/account-vault.mjs');
let rememberedKey;
const keys=async value=>{if(value)rememberedKey=structuredClone(value);return rememberedKey;};
await assert.rejects(scanCredential(chrome.storage.local,{...credentials,phrase:''},keys),/existing vault passphrase/);
assert.equal(await scanCredential(chrome.storage.local,credentials,keys),sitePassword);
assert.equal(await scanCredential(chrome.storage.local,{...credentials,signup:false,phrase:''},keys),sitePassword);
local.delete('employer-vault-v1');rememberedKey=null;
const shared=await scanCredential(chrome.storage.local,{...credentials,min:8,max:16},keys);
assert.equal(shared.length,16);assert.equal(rememberedKey.extractable,false);
assert.match(shared,/[A-Z]/);assert.match(shared,/[a-z]/);assert.match(shared,/\d/);assert.match(shared,/[^A-Za-z0-9]/);
assert(!JSON.stringify(local.get('employer-vault-v1')).includes(shared));
assert.equal(await scanCredential(chrome.storage.local,other,keys),shared);
assert.equal(await scanCredential(chrome.storage.local,{...credentials,signup:false},keys),shared);
await assert.rejects(scanCredential(chrome.storage.local,{...credentials,signup:false,email:'different@example.com'},keys),/No saved login/);

const auto={url:location.href,email,automatic:true};
button.textContent='Sign In';inputs[1].value='';
assert.equal(employerAccountForm(auto).signup,false);
assert.match(employerAccountForm({...auto,signup:false,password:shared}),/Sign-in requested/);
assert.equal(registrations,2);
button.textContent='Create Account';form.append(inputs[2]);inputs[2].value='';
assert.equal(employerAccountForm(auto).signup,true);
assert.match(employerAccountForm({...auto,signup:true,password:shared}),/Registration requested/);
assert.equal(inputs[2].value,shared);assert.equal(registrations,3);
button.textContent='Reset password';assert.equal(employerAccountForm(auto),null);
button.textContent='Submit application';assert.equal(employerAccountForm(auto),null);
assert.equal(registrations,3);
console.log('PASS: automatic account recognition, generated shared password, remembered key, repeat sign-in and existing vault migration.');
