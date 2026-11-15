import assert from 'node:assert/strict';
import {formBridge,suggestField} from '../resume/generator/application-autofill.mjs';
import {cleanMemory,scanAnsweredFields} from '../resume/generator/answer-memory.mjs';
import {makeResumeAttachment,attachResume} from '../resume/generator/resume-attachment.mjs';
let dom;try{dom=await import('linkedom');}catch{dom=await import('../../tmp/job-tests/node_modules/linkedom/esm/index.js');}
const html=`<html><body><div><p>What is your gender? *</p><div><label><input type="radio" name="gender">Female</label></div><div><label><input type="radio" name="gender">Male</label></div><div><label><input type="radio" name="gender">I choose not to self-identify</label></div></div><div><p>What is your Race/Ethnic background? *</p><div><label><input type="radio" name="race">Asian (not Hispanic or Latino)<p>Persons having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian Subcontinent.</p></label></div><div><label><input type="radio" name="race">White (not Hispanic or Latino)<p>Persons having origins in Europe.</p></label></div></div><div><label>In which country/region do you have citizenship?</label><button class="dropdown-toggle" aria-haspopup="true">Viet Nam</button></div><div><label>in what country/region?</label><input type="text" value="United States of America"></div></body></html>`;
const {document,window}=dom.parseHTML(html);Object.assign(globalThis,{document,location:new URL('https://employer.example/application'),getComputedStyle:()=>({visibility:'visible'}),Event:window.Event,KeyboardEvent:window.Event,HTMLInputElement:window.HTMLInputElement,HTMLTextAreaElement:window.HTMLTextAreaElement,HTMLSelectElement:window.HTMLSelectElement});
for(const e of document.querySelectorAll('*'))e.getClientRects=()=>[{}];
for(const r of document.querySelectorAll('[type=radio]'))r.onclick=()=>{for(const other of document.querySelectorAll('[type=radio]'))if(other.name===r.name)other.checked=other===r;};
const scan=formBridge(),gender=scan.fields.find(f=>f.label.startsWith('What is your gender')),race=scan.fields.find(f=>f.label.startsWith('What is your Race'));
assert(gender);assert(race);assert.equal(gender.type,'radio-group');assert.equal(race.options[0].label,'Asian (not Hispanic or Latino)');
const profile={confirmed:true,values:{country:'United States'},answers:[{question:'Sex',answer:'Male'}]};
const answer=suggestField(gender,profile);assert.equal(answer.display,'Male');assert.equal(answer.requiresReview,false,'Confirmed Male answer is selected for filling as requested');assert.equal(suggestField(race,profile),null,'No race inferred');
assert.equal((await formBridge({action:'fill',url:scan.url,fields:[{...gender,...answer}]})).filled,1);
document.querySelector('[name=race]').checked=true;
const remembered=scanAnsweredFields().candidates;assert.deepEqual(remembered.map(c=>c.answer),['Male','Asian (not Hispanic or Latino)','Viet Nam']);assert(!remembered.some(c=>c.question==='in what country/region?'));
const memory=cleanMemory(remembered.map(a=>({...a,scope:'*'})));assert.equal(suggestField({...race,filled:false},profile,memory).display,'Asian (not Hispanic or Latino)');assert(suggestField({...race,filled:false},profile,memory).requiresReview);assert.equal(suggestField({...race,label:'What is your ethnicity?',filled:false},profile,memory).display,'Asian (not Hispanic or Latino)');
const citizen={label:'In which country/region do you have citizenship?',type:'combobox',filled:false};assert.equal(suggestField(citizen,profile),null,'Residence is not citizenship');assert.equal(suggestField(citizen,profile,memory).value,'Viet Nam');
assert.equal(suggestField({label:'in what country/region?',type:'text',filled:false},profile,cleanMemory([{question:'in what country/region?',answer:'United States',scope:'*'}])),null,'Old ambiguous memories are not reused');
// Hidden upload widgets can be identified by the page's upload heading.
document.body.innerHTML='<h1>Upload your resume</h1><div><button>Browse device</button><input type="file" accept=".pdf,.doc,.docx" hidden></div>';
const input=document.querySelector('input');input.files=[];let changes=0;input.onchange=()=>changes++;
globalThis.DataTransfer=class{constructor(){this.files=[];this.items={add:file=>this.files.push(file)};}};
const resume=await makeResumeAttachment(new TextEncoder().encode('%PDF-1.4\n'+'fixture '.repeat(40)),'https://employer.example/jobs/1','Tailored_Intern.pdf');
assert.equal((await attachResume({url:location.href,resume})).attached,true);assert.equal(input.files[0].name,'Tailored_Intern.pdf');assert.equal(changes,1);assert.equal((await attachResume({url:location.href,resume})).attached,false);
console.log('PASS: paragraph-led gender/race groups, option descriptions, explicit identity memory, citizenship/residence separation, ambiguous-country protection, and hidden resume upload attachment.');
