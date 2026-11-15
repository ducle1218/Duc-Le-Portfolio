import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cleanMemory,mergeMemory,memoryMatch,scanAnsweredFields} from '../resume/generator/answer-memory.mjs';
import {suggestField} from '../resume/generator/application-autofill.mjs';
import {validateUpdate,readUpdateZip,applyUpdate,compareVersions} from '../tools/application-helper/update-core.mjs';
const sourceOrigin='https://boards.example.com',entry={question:'When can you start?',answer:'June 1, 2027',scope:'*',sourceOrigin};
const saved=cleanMemory([entry]);assert.equal(memoryMatch('What is your earliest available start date?',saved,sourceOrigin).value,entry.answer);
for(const q of ['When can you not start?','When can you start in 2028?','When can you start working 40 hours?','When can your reference start?'])assert.equal(memoryMatch(q,saved,sourceOrigin),null,q);
const scoped=cleanMemory([{question:'Why this company?',answer:'Company A has the laboratory I want to work in.',scope:sourceOrigin,sourceOrigin,context:'company a'}]);
assert(memoryMatch('Why this company?',scoped,sourceOrigin,'company a'));assert.equal(memoryMatch('Why this company?',scoped,sourceOrigin,'company b'),null);assert.equal(memoryMatch('Why this company?',scoped,'https://different.example.com','company a'),null);
assert.equal(memoryMatch(entry.question,mergeMemory(saved,[{...entry,question:'Earliest start date',answer:'July 1, 2027'}]),sourceOrigin).value,entry.answer);
assert.equal(memoryMatch('When are you available to start?',mergeMemory(saved,[{...entry,question:'Earliest start date',answer:'July 1, 2027'}]),sourceOrigin),null);
assert.equal(mergeMemory(saved,[{...entry,answer:'July 1, 2027'}]).length,1);
const cpp=cleanMemory([{...entry,question:'Do you know C++?',answer:'Yes'}]);assert.equal(memoryMatch('Do you know C?',cpp,sourceOrigin),null);assert.equal(memoryMatch('Do you know C#?',cpp,sourceOrigin),null);
assert.equal(memoryMatch('Can you travel 50 percent of the time?',cleanMemory([{...entry,question:'Can you travel 5.0 percent of the time?',answer:'Yes'}]),sourceOrigin),null);
for(const question of ['Password','Social security number','Do you certify this?','Country of citizenship','GPA'])assert.throws(()=>cleanMemory([{...entry,question}]));
assert.throws(()=>cleanMemory([{...entry,scope:'javascript:alert(1)'}]));assert.throws(()=>cleanMemory(Array.from({length:201},()=>entry)));
const profile={confirmed:true,values:{firstName:'Sample'},answers:[]};const field={label:'What is your earliest available start date?',type:'text',filled:false};
assert.equal(suggestField(field,profile,saved,sourceOrigin).value,entry.answer);assert.equal(suggestField({...field,filled:true},profile,saved,sourceOrigin),null);
assert.equal(suggestField({label:'Preferred contact method',type:'select-one',options:[{value:'email',label:'Email'}]},profile,cleanMemory([{...entry,question:'How do you prefer to be contacted?',answer:'Email'}]),sourceOrigin).value,'email');
let dom;try{dom=await import('linkedom');}catch{dom=await import('../../tmp/job-tests/node_modules/linkedom/esm/index.js');}
const {document,window}=dom.parseHTML('<html><body><input type="text" aria-label="When can you start?" value="June 1, 2027"><input type="password" aria-label="Answer" value="secret"><input type="text" name="ssn" aria-label="Number" value="private"><input type="text" aria-label="GPA" value="4.0"><input type="hidden" aria-label="Project" value="hidden"><input type="text" aria-label="Why this company?" value="Their lab"></body></html>');Object.assign(globalThis,{document,location:{href:sourceOrigin+'/form',origin:sourceOrigin},getComputedStyle:()=>({visibility:'visible'})});for(const input of document.querySelectorAll('input'))input.getClientRects=()=>[{}];assert.deepEqual(scanAnsweredFields().candidates.map(c=>c.question),['When can you start?','Why this company?']);
const zip=new Uint8Array(await readFile(new URL('../resume/generator/downloads/Application-Helper.zip',import.meta.url))),release=JSON.parse(await readFile(new URL('../resume/generator/downloads/helper-release.json',import.meta.url)));
const valid=await validateUpdate(zip,release,'1.1.0');assert.equal(valid.manifest.version,release.version);assert.equal(compareVersions('1.10.0','1.2.0'),1);assert.equal(compareVersions('1.2','1.2.0'),0);
await assert.rejects(()=>validateUpdate(zip,{...release,sha256:'0'.repeat(64)},'1.1.0'));await assert.rejects(()=>validateUpdate(zip,release,'9.0.0'));await assert.rejects(()=>validateUpdate(zip,{...release,files:[]},'1.1.0'));
const damaged=zip.slice();damaged[0]=0;assert.throws(()=>readUpdateZip(damaged));
// Filesystem adapter verifies replacement, rollback, no directory traversal, and no storage writes.
function fakeDirectory(failName){const data=new Map([['popup.html',new Blob(['old popup'])],['manifest.json',new Blob(['old manifest'])],['private-note.txt',new Blob(['keep'])]]);let failed=false;return {data,async getFileHandle(name,options={}){if(!data.has(name)&&!options.create)throw Object.assign(new Error('missing'),{name:'NotFoundError'});return {getFile:async()=>data.get(name),createWritable:async()=>{let staged;return {write:async bytes=>{if(name===failName&&!failed){failed=true;throw new Error('disk full');}staged=bytes instanceof Blob?bytes:new Blob([bytes]);},close:async()=>data.set(name,staged),abort:async()=>{}};}};},async removeEntry(name){data.delete(name);}};}
const files=new Map([['popup.html',new TextEncoder().encode('new popup')],['extra.mjs',new TextEncoder().encode('new file')],['manifest.json',new TextEncoder().encode('new manifest')]]);
const good=fakeDirectory();await applyUpdate(good,files);assert.equal(await good.data.get('popup.html').text(),'new popup');assert.equal(await good.data.get('private-note.txt').text(),'keep');
const broken=fakeDirectory('manifest.json');await assert.rejects(()=>applyUpdate(broken,files),/previous files were restored/);assert.equal(await broken.data.get('popup.html').text(),'old popup');assert(!broken.data.has('extra.mjs'));assert.equal(await broken.data.get('manifest.json').text(),'old manifest');
await assert.rejects(()=>applyUpdate(good,new Map([['../escape.js',new Uint8Array()]])),/Unsafe/);
console.log('PASS: equivalent question matching, negation/date differences, conflicting answers, employer isolation, sensitive-field exclusion, ZIP integrity, version checks, safe file replacement and rollback.');
