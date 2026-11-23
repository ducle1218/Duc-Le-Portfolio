import assert from 'node:assert/strict';
import {formBridge,suggestField} from '../resume/generator/application-autofill.mjs';
import {COMMON_QUESTIONS} from '../resume/generator/common-questions.mjs';
import {makeResumeAttachment,attachResume} from '../resume/generator/resume-attachment.mjs';
let dom;try{dom=await import('linkedom');}catch{dom=await import('../../tmp/job-tests/node_modules/linkedom/esm/index.js');}
const profile={confirmed:true,values:{city:'Sample City',state:'New Jersey',postalCode:'00000',school:'Rutgers University–New Brunswick'},answers:[...COMMON_QUESTIONS.filter(q=>q.defaultAnswer).map(q=>({question:q.question,answer:q.defaultAnswer})),{question:'Address Line',answer:'123 Test Way, Sample City, NJ 08854'},{question:'Are you legally authorized to work in the United States?',answer:'Yes'},{question:'Will you now or in the future require sponsorship for employment visa status?',answer:'No'}]};
const field=(label,extra={})=>({label,type:'text',filled:false,...extra});
const atsProfile={...profile,answers:[...profile.answers,
 {question:'Phone device type',answer:'Mobile'},{question:'Expected graduation date',answer:'2030-05'},
 {question:'Application source fallbacks',answer:'LinkedIn or Indeed, then a career fair'},
 {question:'Languages spoken',answer:'English, Chinese, Vietnamese'}]};
const dropdown=(label,options)=>field(label,{type:'select-one',options:options.map((label,i)=>({label,value:String(i)}))});
assert.equal(suggestField(dropdown('State/Location *',['[ State/Location ]','New Jersey']),atsProfile)?.display,'New Jersey');
assert.equal(suggestField(dropdown('Phone Device Type',['Landline','Mobile']),atsProfile)?.display,'Mobile');
assert.equal(suggestField(dropdown('How did you hear about us?',['Job Board','LinkedIn','Indeed','Recruiting Event']),atsProfile)?.display,'LinkedIn');
assert.equal(suggestField(dropdown('How did you hear about us?',['Recruiting Event','Referral']),atsProfile)?.display,'Recruiting Event');
assert.equal(suggestField(field('What is your expected graduation date?',{type:'month'}),atsProfile)?.value,'2030-05');
assert.deepEqual(suggestField(field('Languages',{type:'language-list',existing:['English']}),atsProfile)?.value,['Chinese','Vietnamese']);
const withSkills={skills:[{name:'CAD'},{name:'C++'}]};
assert.deepEqual(suggestField(field('Skills',{type:'skill-list',existing:['Computer-Aided Design (CAD)','C']}),atsProfile,[],'','',withSkills)?.value,['C++']);
assert.equal(suggestField(field('Address Line 1 *'),profile).value,'123 Test Way');
assert.equal(suggestField(field('Postal Code'),profile).value,'08854');
assert.equal(suggestField(field('Address Line 2'),profile),null);
const incompatible={...profile,values:{...profile.values,city:'Other City'}};
assert.equal(suggestField(field('Address Line 1'),incompatible),null);
const select=(label,options,extra={})=>field(label,{type:'select-one',options:options.map((label,i)=>({label,value:String(i)})),...extra});
assert.equal(suggestField(select('How Did You Hear About Us?',['Please Select','Our Website','University Recruiting']),profile).display,'Our Website');
assert.equal(suggestField(select('Source Details',['Other','Rutgers University','Clemson University'],{parentAnswer:'University Recruiting'}),profile).display,'Rutgers University');
assert.equal(suggestField(select('Source Details',['Other','Clemson University'],{parentAnswer:'University Recruiting'}),profile),null);
assert.equal(suggestField(select('Source Details',['Rutgers University']),profile),null);
const school={educationSchool:profile.values.school};
assert.equal(suggestField(select('Degree',['Bachelors','High School Diploma/GED'],school),profile).display,'Bachelors');
assert.equal(suggestField(select('Degree',['Bachelors','High School Diploma/GED'],{educationSchool:'Atlantic County Institute of Technology'}),profile).display,'High School Diploma/GED');
assert.equal(suggestField(select('Degree',['Bachelors']),profile),null,'Unknown education row is not assumed to be college');
assert.equal(suggestField(field('Overall result (GPA)',school),profile),null,'College GPA is unknown');
assert.equal(suggestField(field('Overall result (GPA)',{educationSchool:'Atlantic County Institute of Technology'}),profile).value,'4.2');
assert.equal(suggestField(select('What is your cumulative GPA based on a 4.0 scale? (DO NOT ROUND)',['3.5','4.0']),profile),null);
assert.equal(suggestField(field('GPA scale',school),profile).value,'4.0');
const standing=select('Please indicate your current academic standing (select one):',['Rising Sophomore (Completed Freshman Year)','Rising Junior (Completed Sophomore Year)','Other (Please specify)']);
assert.equal(suggestField(standing,profile).display,'Other (Please specify)');
assert.equal(suggestField(field('Please specify',{parentAnswer:'Other (Please specify)',parentQuestion:standing.label}),profile).value,'Freshman');
assert.equal(suggestField(field('Please specify'),profile),null);
assert.equal(suggestField({...standing,options:standing.options.slice(0,2)},profile),null);
for(const q of ['Are you currently employed by Spectrum Plastics Group, Arclin, Onity or any of their affiliates?','Have you ever been employed by DuPont or any of its affiliates?','Do you have previous DuPont intern/co-op experience?'])assert.equal(suggestField(select(q,['Yes','No']),profile).display,'No',q);
assert.equal(suggestField(select('Do you have the legal right to work in the U.S.? (Note: New hires must have a valid SSN number prior to hire to obtain employment with DuPont).',['Yes','No']),profile).display,'Yes');
assert.equal(suggestField({...select('Will you now or in the future require sponsorship of a temporary work visa (e.g., F-1 (CPT or OPT), H-1B, O-1, TN, etc.)?',['Yes','No']),jobLocation:'United States'},profile).display,'No');
assert.equal(suggestField(select('Are you available for a Summer Intern/Co-Op? (May - Aug)',['Yes','No']),profile).display,'Yes');
const regions=['Northeast','Mid-Atlantic','Southeast','Mid-West','Gulf Coast','Open/Flexible'];
const {document,window}=dom.parseHTML(`<html><body><div><p>In which of the following U.S. geographic locations are you willing to work? *</p>${regions.map((s,i)=>`<div><label><input name="region-${i}" type="checkbox">${s}</label></div>`).join('')}</div><label><input type="checkbox" name="certify">I certify my application is accurate</label><div id="edu"><div><label>School or University<input type="text" value="Rutgers University–New Brunswick"></label></div><div><label>Degree<input type="text"></label></div></div><button id="submit">Submit</button></body></html>`);
Object.assign(globalThis,{document,location:new URL('https://employer.example/apply'),getComputedStyle:()=>({visibility:'visible'}),Event:window.Event,KeyboardEvent:window.Event,HTMLInputElement:window.HTMLInputElement,HTMLSelectElement:window.HTMLSelectElement,HTMLTextAreaElement:window.HTMLTextAreaElement});
for(const e of document.querySelectorAll('*'))e.getClientRects=()=>[{}];
for(const e of document.querySelectorAll('[type=checkbox]'))e.onclick=()=>{e.checked=!e.checked;};
let submissions=0;document.querySelector('#submit').onclick=()=>submissions++;
const scan=formBridge(),regionField=scan.fields.find(f=>f.label.startsWith('In which'));
assert(regionField);assert.equal(regionField.options.length,6);
assert.equal(scan.fields.find(f=>f.label==='Degree').educationSchool,profile.values.school);
const suggestion=suggestField(regionField,profile);assert.deepEqual(suggestion.selectedLabels,regions.slice(0,3));
assert.equal((await formBridge({action:'fill',url:location.href,fields:[{...regionField,...suggestion}]})).filled,1);
assert.deepEqual([...document.querySelectorAll('[type=checkbox]')].map(e=>!!e.checked),[true,true,true,false,false,false,false]);
assert.equal(formBridge({action:'remember'}).candidates.find(c=>c.question.startsWith('In which')).answer,'Northeast; Mid-Atlantic; Southeast');
assert.equal((await formBridge({action:'fill',url:location.href,fields:[{...regionField,...suggestion}]})).skipped,1);
assert.equal(submissions,0);
document.body.innerHTML='<div>Resume Label</div><section>Make completing your job application easier by uploading your resume or CV. Upload either DOC, DOCX, HTML, PDF, or TXT file types (1MB max)<div><button>Upload CV</button><div><input type="file" hidden accept=".pdf,.doc"></div></div></section>';
const input=document.querySelector('input');input.files=[];
globalThis.DataTransfer=class{constructor(){this.files=[];this.items={add:file=>this.files.push(file)};}};
const pdf=await makeResumeAttachment(new TextEncoder().encode('%PDF-1.4\n'+'fixture '.repeat(40)),'https://employer.example/job/123','Tailored.pdf');
assert.equal((await attachResume({url:location.href,resume:pdf})).attached,true);
input.files=[];const oversized=await makeResumeAttachment(new TextEncoder().encode('%PDF-1.4\n'+'x'.repeat(1000000)),pdf.jobUrl,'Large.pdf');
assert.equal((await attachResume({url:location.href,resume:oversized})).attached,false);assert.equal(input.files.length,0);
console.log('PASS: address splitting, dependent sources, scoped education/GPA, freshman standing, employment aliases, reviewed eligibility, East Coast checkboxes, and DuPont-style hidden CV upload/size limits.');
const prefs={confirmed:true,values:{state:'New Jersey',country:'United States',phone:'(609) 555-0199'},answers:[
 ...profile.answers.filter(a=>a.question!=='Are you legally authorized to work in the United States?'),
 {question:'Citizenships',answer:'United States; Vietnam'},{question:'Are you 18 years or older?',answer:'Yes'},
 {question:'SMS contact about my job application',answer:'Yes'},
 {question:'Can provide a valid US passport, US birth certificate or certificate of naturalization on request',answer:'Yes'}
]};
const probe=(label,more={})=>suggestField({label,type:'combobox',filled:false,...more},prefs);
for(const question of ['Were you ever employed by Oshkosh Corporation or one of its affiliates?','Are you a current employee of Another Company or one of its affiliates (this does NOT include contractor, consultant, or vendor roles)?'])assert.equal(probe(question)?.value,'No',question);
assert.equal(probe('Are you at least 18 years of age?')?.value,'Yes');
assert.equal(probe('Are you authorized to work for any US employer?')?.value,'Yes');
assert.equal(probe('We would like to use SMS communication to contact you with regards to your application. Do you approve?')?.value,'Yes');
assert.equal(probe('Country',{phoneCountry:true})?.value,'United States +1');
assert.equal(probe('Degree',{highestEducation:true,educationSchool:'Rutgers'})?.value,'High school diploma');
assert.match(probe('This position requires access to export-controlled information. For export-control purposes, please select among the following options:')?.value,/US Passport/);
assert.equal(probe('What shift are you available to work?'),null);
assert.equal(probe('State')?.value,'New Jersey');
const updated=structuredClone(prefs);updated.answers.find(a=>a.question==='Employment experience').answer='Internship';
assert.equal(suggestField({label:'Were you ever employed by Example or one of its affiliates?',type:'combobox'},updated),null);
console.log('PASS: employer-specific questions follow updated employment history, phone country, SMS, US authorization, confirmed document availability and highest completed degree.');
{
 const p={confirmed:true,values:{firstName:'Test',lastName:'Applicant'},answers:[{question:'Employment experience',answer:'None'},{question:'Highest completed degree',answer:'High school diploma'}]};
 const ask=(label,type='text')=>suggestField({label,type},p)?.value;
 assert.equal(ask('Are you currently or have you previously worked for Philips, including as a contingent worker/external?'),'No');
 assert.equal(ask("Do you have a completed Bachelor's degree?"),'No');
 p.answers[0].answer='One prior job';
 assert.equal(ask('Are you currently or have you previously worked for Philips, including as a contingent worker/external?'),undefined);
 assert.equal(ask("Hi! I'm Olivia, your job assistant. To get started, can you please provide me with your first and last name?",'chat-reply'),'Test Applicant');
 assert.equal(ask('Can you provide your name? What is your salary expectation?','chat-reply'),undefined);
}
{
 const applicant={...prefs,values:{...prefs.values,lastName:'Tester',email:'tester@example.com'},answers:[...prefs.answers,
  {question:'Personal title',answer:'Mr.'},{question:'Current or past disability',answer:'No'},
  {question:'Preferred last name',answer:'Tester'},{question:'Post-offer federal background check, physical and drug screen',answer:'Yes'}]};
 const answer=(label,more={})=>suggestField({label,type:'text',...more},applicant)?.display;
 assert.equal(answer('Email address (Username) *'),'tester@example.com');
 assert.equal(answer('Preferred last name'),'Tester');
 assert.equal(answer('Title'),undefined);
 assert.equal(answer('Title',{type:'radio-group',options:[{label:'Mr.',value:'1'},{label:'Mrs.',value:'2'}]}),'Mr.');
 const consent='No, I do not have a disability and have not had one in the past';
 assert.equal(answer('Please check one of the boxes below',{type:'radio-group',options:[{label:consent,value:'2'},{label:'Yes, I have a disability, or have had one in the past',value:'1'}]}),consent);
 assert.equal(answer('Are you willing to undergo a background check, in accordance with local law/regulations?'),'Yes');
 assert.equal(answer('If hired can you submit verification of your legal right to work in the US?'),'Yes');
 const visa='Will you require visa assistance now or in the future from our company?';
 assert.equal(answer(visa),undefined);
 assert.equal(answer(visa,{workQuestionCountry:'United States'}),'No');
 assert.equal(answer(visa,{workQuestionCountry:'United States',jobLocation:'Germany'}),undefined);
}
