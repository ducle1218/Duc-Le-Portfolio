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
assert([...$('suggestions').querySelectorAll('input')].every(c=>!c.checked),'Portfolio drafts require review');
await $('fill').onclick();assert.equal(filled.length,0,'Unreviewed drafts do not fill');
$('suggestions').querySelector('input').setAttribute('checked','');await $('fill').onclick();assert.equal(filled.length,1);assert.equal(filled[0].value,'Yes');
const {addPortfolioEvidence}=await import('../tools/application-helper/portfolio-ui.mjs');
addPortfolioEvidence($('suggestions'),{portfolioDerived:true,sources:[{title:'<img src=x>',quote:'<script>bad()</script>',url:'https://ducle1218.github.io/Duc-Le-Portfolio/?project=box-12'}]});
assert.equal($('suggestions').querySelector('script'),null);assert.equal($('suggestions').querySelector('img'),null);
console.log('PASS: empty-bank portfolio inference reaches popup, citations are escaped, drafts start unchecked and only explicitly selected suggestions fill.');
