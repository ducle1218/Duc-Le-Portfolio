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

const question='Please indicate if you belong to one of the categories above:';
document.body.innerHTML='<ul><li>U.S. Citizen</li><li>U.S. National</li></ul><div><label for="categories"></label><button id="categories" role="combobox">Select</button></div>';
document.querySelector('label').textContent=question;
for(const e of document.querySelectorAll('*'))e.getClientRects=()=>[{}];
const application={confirmed:true,values:{},answers:Object.entries({
 'Citizenships':'United States; Canada','Previous security clearance':'No','Active security clearance':'No',
 'Government employment':'No','Military service':'No','Employment experience':'None',
 'Are you legally authorized to work in the United States?':'Yes',
 'Will you now or in the future require sponsorship for employment visa status?':'No',
 'Protected veteran status':'I am not a protected veteran','Race / ethnic background':'Asian (not Hispanic or Latino)',
 'I have read and understand and I agree to the above':'Yes'
}).map(([question,answer])=>({question,answer}))};
const categories=formBridge().fields[0];
assert.equal(suggestField(categories,application)?.value,'Yes');
document.querySelector('li').textContent='U.S. National';
assert.equal(suggestField(formBridge().fields[0],application),null);
const pick=(label,options,extra={})=>suggestField({label,type:'select-one',options:options.map(label=>({value:label,label})),...extra},application)?.value;
const yn=['Yes','No'];
for(const label of ['Security Clearance - Active','Security Clearance - inactive within 2 years'])
 assert.equal(pick(label,['Secret','Top Secret','None of the Above']),'None of the Above');
assert.equal(suggestField({label:'Date Granted',parentQuestion:'Security Clearance - Active',type:'date'},{
 ...application,answers:[...application.answers,{question:'Date Granted',answer:'2025-01-01'}]}),null);
for(const label of ['Including your current position, have you ever served as a U.S. government employee in the Legislative branch?',
 'Including your current position, have you ever been a U.S. Government employee in either the Executive Branch (e.g., Department of Defense, General Services Administration) or in the Judicial Branch?',
 'Including your current position, have you ever served in the U.S. military?'])assert.equal(pick(label,yn),'No');
const employer='Have you ever worked for Lockheed Martin - either as a direct employee (including any mergers, acquisitions or subsidiary companies) or as a contractor/vendor that provided services to us?';
assert.equal(pick(employer,yn),'No');
const follow={label:'If you answered "Yes" and are a former LM employee: Enter the LM Person/Employee ID. If you answered "No", enter N/A.',type:'text',parentQuestion:employer,parentAnswer:'No'};
assert.equal(suggestField(follow,application)?.value,'N/A');
assert.equal(suggestField({...follow,parentAnswer:'Yes'},application),null);
const auth='Are you legally authorized to work in the country of the job for which you are applying?';
assert.equal(pick(auth,yn,{jobLocation:'Moorestown, NJ, US'}),'Yes');
for(const jobLocation of ['London, UK','Remote',''])assert.equal(pick(auth,yn,{jobLocation}),undefined);
assert.equal(pick('Will you require sponsorship for an employment Visa?',yn,{jobLocation:'United States'}),'No');
assert.equal(pick('Please select your Protected Veteran Status. (A definition of each group is provided above.)',['I identify as one or more of the Classifications of Protected Veteran Listed above','I am not a protected Veteran / I prefer not to answer']),'I am not a protected Veteran / I prefer not to answer');
assert.equal(pick('Please indicate the ethnic group with which you identify. (A definition of each ethnic group is provided above.)',['Asian (Not Hispanic/Latino)','Hispanic or Latino']),'Asian (Not Hispanic/Latino)');
assert.equal(pick('I have read and understand and I agree to the above',yn),'Yes');
assert.equal(pick('I agree to relocate',yn),undefined);
console.log('PASS: contextual citizenship list, clearance dates, employer follow-ups, specific acknowledgments and country-scoped work authorization.');

document.body.innerHTML='<form><div><strong>Have you previously worked here?</strong><button type="button" aria-label="Select" role="combobox">× No</button></div><div><label for="employee">If yes, enter your employee ID. If you answered No, enter N/A.</label><input id="employee" type="text"></div><div><label for="source">How did you hear about this position?</label><button id="source" type="button" role="combobox">× Company Website</button></div><div><strong>Details *</strong><button id="detail" type="button" role="combobox" aria-controls="career-sites" aria-expanded="false">Select</button></div><div role="listbox" id="career-sites" hidden><button type="button" role="option">Lockheed Martin Career Site</button></div></form>';
const detail=document.querySelector('#detail'),list=document.querySelector('#career-sites');
for(const elem of document.querySelectorAll('*'))elem.getClientRects=()=>elem.closest('[hidden]')?[]:[{}];
detail.onclick=()=>{list.hidden=false;detail.setAttribute('aria-expanded','true');};
list.firstElementChild.onclick=()=>{detail.textContent=list.firstElementChild.textContent;list.hidden=true;detail.setAttribute('aria-expanded','false');};
const reviewed=formBridge().fields.flatMap(f=>{const answer=suggestField(f,application);return answer?[{...f,...answer}]:[];});
assert.deepEqual(reviewed.map(f=>f.id),['employee','detail']);
assert.equal((await formBridge({action:'fill',url:location.href,fields:reviewed})).filled,2);
assert.equal(document.querySelector('#employee').value,'N/A');
assert.equal(detail.textContent,'Lockheed Martin Career Site');
const militaryOptions=['Army','Navy','N/A'];
for(const label of ['Military Branch','Military Status'])assert.equal(pick(label,militaryOptions),'N/A');
assert.equal(pick('Military Branch',['Army','Navy']),undefined);
const outside={question:'Do you require employment visa sponsorship for jobs outside the United States?',answer:'Yes'};
application.answers.push(outside);
const sponsorship='Will you require sponsorship for an employment Visa?';
for(const location of ['Berlin, Germany','Toronto, Canada','Tokyo, Japan'])assert.equal(pick(sponsorship,yn,{jobLocation:location}),'Yes');
assert.equal(pick(sponsorship,yn,{jobLocation:'Fort Worth, TX'}),'No');
assert.equal(pick(sponsorship,yn,{jobLocation:'Remote'}),undefined);
assert.equal(pick('If yes, please indicate Visa status',['A citizen of the U.S.','None of the Above'],{jobLocation:'USA',required:true,parentQuestion:sponsorship,parentAnswer:'No'}),'A citizen of the U.S.');
console.log('PASS: read completed parent dropdowns, filled the N/A text field, opened and selected the company career site, and checked domestic and foreign sponsorship.');

const {fillWithFollowups}=await import('../tools/application-helper/fill-sequence.mjs');
const confirmLabel='Please review the question again to confirm your response is correct.';
const confirmation='Confirming my response to the US Persons question is correct.';
const prescreenLabel='If you are applying for a position that requires U.S. Government Security Clearance, are you willing to complete a Security Prescreen Questionnaire? Your No answer has no bearing on whether or not you will be considered for other positions.';
application.answers.push({question:'Willing to complete a U.S. Government Security Prescreen Questionnaire',answer:'Yes'});
assert.equal(pick(prescreenLabel,yn),'Yes');
document.body.innerHTML='<form><section><ul><li>U.S. Citizen</li><li>U.S. National</li></ul><input type="hidden"><button type="button">Read more</button></section><div><label for="membership">'+question+' *</label><button type="button" id="membership" role="combobox" aria-controls="members">Select</button></div><div id="members" role="listbox" hidden><span role="option">Yes</span><span role="option">No</span></div><p>It is common for applicants to answer the previous US Persons question incorrectly.</p><div><label for="confirmation">'+confirmLabel+' *</label><input type="hidden"><button type="button" id="confirmation" role="combobox" aria-controls="acks">Select</button></div><div role="listbox" id="acks" hidden><span role="option">'+confirmation+'</span></div></form>';
for(const elem of document.querySelectorAll('*'))elem.getClientRects=()=>elem.closest('[hidden]')||elem.type==='hidden'?[]:[{}];
for(const box of document.querySelectorAll('[role="combobox"]')){
 const options=document.getElementById(box.getAttribute('aria-controls'));
 box.onclick=()=>{options.hidden=false;box.setAttribute('aria-expanded','true');};
 for(const option of options.children)option.onclick=()=>{box.textContent='× '+option.textContent;options.hidden=true;box.setAttribute('aria-expanded','false');};
}
const suggest=f=>suggestField(f,application);
const reviewedMembership=formBridge().fields.flatMap(f=>{const ans=suggest(f);return ans?[{...f,...ans}]:[];});
assert.deepEqual(reviewedMembership.map(f=>f.id),['membership']);
const cascade=await fillWithFollowups({url:location.href,reviewed:reviewedMembership,selected:reviewedMembership,scan:()=>formBridge(),fill:data=>formBridge({action:'fill',...data}),suggest});
assert.equal(cascade.filled,2);
assert.equal(document.querySelector('#membership').textContent,'× Yes');
assert.equal(document.querySelector('#confirmation').textContent,'× '+confirmation);
console.log('PASS: a single fill selected US citizen category Yes and then the dependent confirmation option.');
