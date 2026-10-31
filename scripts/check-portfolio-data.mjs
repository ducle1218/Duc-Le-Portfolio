import assert from 'node:assert/strict';
import vm from 'node:vm';
import {loadRecords,read,json,feedFor,markdownFor,validate,sourceSchema,feedSchema,validateReferences,checkLock,lockFor,catalogFor,spotlightFor,plain} from './portfolio-data.mjs';

const records=await loadRecords();
const lock=JSON.parse(await read('src/content/evidence-lock.json'));
checkLock(records,lock);
const {feed,resume}=feedFor(records);
validate(feed,feedSchema);
assert.equal(await read('data/portfolio.json'),json(feed),'Public feed is stale');
assert.equal(await read('data/portfolio.md'),markdownFor(feed),'Readable facts are stale');
assert.equal(await read('data/resume-manifest.json'),json(resume),'Resume fingerprint is stale');
assert.equal(await read('data/portfolio.schema.json'),json(feedSchema),'Public schema is stale');
assert.equal(await read('data/project-source.schema.json'),json(sourceSchema),'Editable source schema is stale');
const catalog=await read('src/scripts/project-catalog.generated.js');
assert.equal(JSON.stringify(vm.runInNewContext(catalog+';TIMELINE_ITEMS')),JSON.stringify(catalogFor(records)),'Website cards differ from facts');
assert.equal(JSON.stringify(vm.runInNewContext(catalog+';SPOTLIGHT_PROJECTS')),JSON.stringify(spotlightFor(records)),'Spotlight differs from facts');
const first=feed.projects.find(p=>p.id==='box-12');
assert(plain(await read('index.html')).includes(first.summary),'Initial spotlight differs from facts');
assert(Buffer.byteLength(await read('src/scripts/site.bundle.js'))<100000,'Fact feed must not inflate startup JavaScript');

const clone = value => JSON.parse(JSON.stringify(value));
const badOwner=clone(records.facts);badOwner.projects[0].claims[0].owner='expert';
assert.throws(()=>validate(badOwner,sourceSchema),/invalid enum/,'Unknown ownership must fail');
const badRef=clone(records.facts.projects[0]);badRef.claims[0].evidenceIds=['missing'];
assert.throws(()=>validateReferences(badRef),/Unknown evidence/,'Unsourced claims must fail');
const duplicate=clone(records.facts.projects[0]);duplicate.claims.push(clone(duplicate.claims[0]));
assert.throws(()=>validateReferences(duplicate),/Duplicate claim/);
const privateField=clone(feed);privateField.workAuthorization='invented answer';
assert.throws(()=>validate(privateField,feedSchema),/unknown field/,'Private application fields are not public feed fields');
const falseApproval=clone(feed);falseApproval.verification.ownerApprovedForApplications=true;
assert.throws(()=>validate(falseApproval,feedSchema),/invalid constant/,'Source audit must not impersonate owner approval');
const changed=clone(records);changed.hashes['src/content/projects/box-12.html']='changed';
assert.throws(()=>checkLock(changed,lock),/Sources changed/,'Changed evidence must trigger another audit');
const newPdf=clone(records);newPdf.pdf.sha256='f'.repeat(64);newPdf.hashes[newPdf.pdf.path]=newPdf.pdf.sha256;
assert.deepEqual(lockFor(newPdf),lock,'PDF replacement must not block the existing replacement workflow');
assert.notEqual(feedFor(newPdf).feed.snapshotId,feed.snapshotId,'PDF replacement must change the dataset snapshot');
assert.equal(feedFor(newPdf).resume.sha256,newPdf.pdf.sha256,'New PDF must have a new manifest fingerprint');

// Regression checks for the known misattribution/unit traps in this portfolio.
const highStakes=feed.projects.find(p=>p.id==='box-1');
assert(!highStakes.tools.some(t=>t.name==='C++'&&t.owner==='individual'),'Do not claim teammate controls work');
const boat=feed.projects.find(p=>p.id==='box-10');
assert(!/58(?:\.\d+)?%\s+faster/i.test(JSON.stringify(boat.claims)),'Time reduction is not speed increase');
assert(!/58% faster/i.test(await read('src/content/projects/box-10.html')),'Visible boat wording must match');
const linkScript=await read('src/scripts/project-links.js');
for(const [search,expected] of [['?project=box-6',['box-6']],['?project=box-999',[]],['',[]],['?project=%3Cscript%3E',[]]]){
  const opened=[];
  vm.runInNewContext(catalog+';'+linkScript,{window:{},location:{search},URLSearchParams,showProjectDetail:id=>opened.push(id)});
  assert.deepEqual(opened,expected,'Only known project deep links may open a detail page');
}
const linkContext={window:{},location:{href:'https://example.test/portfolio/?project=box-6&lang=en',search:''},URL,URLSearchParams,history:{replaceState:(_state,_title,url)=>{linkContext.location.href=String(url);}},showProjectDetail:()=>{}};
vm.runInNewContext(catalog+';'+linkScript,linkContext);
linkContext.window.updateProjectUrl(null);
assert.equal(linkContext.location.href,'https://example.test/portfolio/?lang=en','Leaving project detail clears its deep link');
linkContext.window.updateProjectUrl('box-12');
assert.equal(new URL(linkContext.location.href).searchParams.get('project'),'box-12');
console.log('PASS: 12 sourced project records; schema, evidence, freshness, shared cards/spotlight, resume fingerprint, and unsafe-claim regressions.');
