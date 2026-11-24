import assert from 'node:assert/strict';
import {suggestField} from '../resume/generator/application-autofill.mjs';
const profile={confirmed:true,values:{},answers:Object.entries({
 'Employment experience':'None','Government employment':'No','Military service':'No',
 'Citizenships':'Canada; Mexico','Previous security clearance':'No','Polygraph history':'None',
 'Phone device type':'Mobile','Race / ethnic background':'Asian (not Hispanic or Latino)',
 'Consideration for other domestic positions':'Yes','Hispanic or Latino identification':'No'
}).map(([question,answer])=>({question,answer}))};
const check=(label,want,type='combobox',choices=[])=>{
 const options=choices.map(label=>({label,value:label}));
 assert.equal(suggestField({label,type,options},profile)?.display,want,label);
};
check('Protected Veteran','I Am Not A Veteran','select-one',['I Identify As A Veteran, Just Not A Protected Veteran','I Am Not A Veteran']);
const exportQuestion='For purposes of complying with Federal Export Control laws, please select one of the following:';
const citizenOnly={...profile,answers:[{question:'Citizenships',answer:'United States; Vietnam'}]};
assert.equal(suggestField({type:'select-one',label:exportQuestion,options:['A citizen of the U.S.','A U.S. refugee'].map(label=>({label,value:label}))},citizenOnly)?.display,'A citizen of the U.S.');
profile.answers.push({question:'Sex',answer:'Male'});
check('Please select the gender which most accurately describes how you identify yourself.','Male','select-one',['Female','Male','Other']);
check('Please select the ethnicity which most accurately describes how you identify yourself.','5 - Asian (Not Hispanic or Latino) (United States of America)','select-one',['2 - White (Not Hispanic or Latino) (United States of America)','5 - Asian (Not Hispanic or Latino) (United States of America)']);
check('Please select the veteran status which mostly accurately describes how you identify yourself.','I AM NOT A VETERAN','select-one',['I IDENTIFY AS A VETERAN, JUST NOT A PROTECTED VETERAN','I AM NOT A VETERAN']);
const visaLabel='Will you now or in the future require sponsorship of a temporary work visa (e.g., F-1 (CPT or OPT), H-1B, O-1, TN, etc.)?';
const citizenProfile={...profile,answers:[{question:'Citizenships',answer:'United States; Vietnam'}]};
for(const [jobLocation,expected] of [['United States','No'],['France',undefined],['','No']]){
 assert.equal(suggestField({label:visaLabel,jobLocation,type:'select-one',options:['No','Yes'].map(label=>({label,value:label}))},citizenProfile)?.display,expected);
}
check('Are you also a citizen of another country?','Yes');
check('Have you ever held a security clearance?','No');
check('Which type(s) of polygraph have you had?','None');
check('Hispanic or Latino?','No');
check('Current Military Status','N/A');
check('Current Government Civilian Status','N/A');
check('Government Civilian Start Date',undefined);
check('In the past three years from today’s date, have you been employed by a private sector organization/company & personally participated in a bid, proposal, capture, or competition for any program(s) in which Example may be/has been a competitor?','No');
check('Are you currently employed or have you been employed in the past five years by a state or local government entity (other than temporary summer or part-time positions)?','No');
check('Phone Device Type','Personal Mobile','select-one',['Business Mobile','Personal Mobile']);
check('Ethnicity','Asian (United States of America)','checkbox-group',['White (United States of America)','Asian (United States of America)']);
check('I understand that I may be considered for other open positions in my country, in addition to the role(s) to which I apply','on','radio-group',['on']);
check('Do you have relatives employed by a private sector organization?',undefined);
check('Have you been employed by a private sector organization or volunteered for one?',undefined);
profile.answers=profile.answers.filter(a=>!['Employment experience','Hispanic or Latino identification','Polygraph history'].includes(a.question));
check('Have you been employed by a private sector company?',undefined);
check('Hispanic or Latino?',undefined);
check('Which types of polygraph have you had?',undefined);
console.log('Profile reasoning regression checks passed.');

function infer(facts,label,context={}){
 const answers=Object.entries(facts).map(([question,answer])=>({question,answer}));
 return suggestField({label,type:'combobox',...context},{confirmed:true,values:{},answers});
}
const noWork={'Employment experience':'None'};
const currentGovernment='Do you currently work for the government?';
assert.equal(infer(noWork,currentGovernment)?.display,'No');
assert.equal(infer(noWork,currentGovernment)?.sourceQuestion,'Employment experience');
assert.equal(infer({'Government employment':'Yes'},currentGovernment),null);
assert.equal(infer({'Active security clearance':'Yes'},'Have you been granted a security clearance?')?.display,'Yes');
assert.equal(infer({'Active security clearance':'No'},'Have you been granted a security clearance?'),null);
assert.equal(infer({'Previous security clearance':'No'},'Do you possess a valid security clearance?')?.display,'No');
assert.equal(infer({'Previous security clearance':'No','Active security clearance':'Yes'},'Do you possess a valid security clearance?'),null);
assert.equal(infer({'Military service':'No'},'Which kind of polygraph did you take?'),null);
assert.equal(infer(noWork,'Has your spouse worked for the government?'),null);
assert.equal(infer(noWork,'Do you currently work for the government and have you undergone a polygraph?')?.display,'No');
const either='Do you currently work for the government or have you undergone a polygraph?';
assert.equal(infer(noWork,either),null);
assert.equal(infer({...noWork,'Polygraph history':'None'},either)?.display,'No');
assert.equal(infer({'Have you undergone a polygraph?':'Yes'},either)?.display,'Yes');
assert.equal(infer({},'Branch of service',{parentQuestion:'Have you served in the armed forces?',parentAnswer:'No'})?.display,'N/A');
assert.equal(infer({'Military service':'No'},'Branch of service',{parentQuestion:'Have you served in the armed forces?',parentAnswer:'Yes'}),null);
console.log('Multi-step entailment, direction, provenance, conflicts, conjunctions, disjunctions and contextual evidence passed.');

const educationProfile={confirmed:true,values:{school:'Example University–City Campus',major:'Engineering'},answers:Object.entries({
 'High school name':'Example Academy','University location':'University Town','High school location':'Academy Town',
 'University start month':'2026-08','Expected graduation date':'2030-05','High school graduation month':'2026-06',
 'Full-time student enrollment':'Yes','Day for month-only school dates':'First of the month',
 'Degree being pursued':'Bachelor of Science','Summer internship start date':'2027-05-13'
}).map(([question,answer])=>({question,answer}))};
function study(school,label,type='text'){
 return suggestField({educationEntry:true,educationSchool:school,label,type},educationProfile)?.value;
}
assert.equal(study('Example University','Degree'),'Bachelor of Science');
assert.equal(study('Example University','Start Date','date'),'2026-08-01');
assert.equal(study('Example University','End Date','date'),'2030-05-01');
assert.equal(study('Example University','Location'),'University Town');
assert.equal(study('Example University','Is current study?','combobox'),'Yes');
assert.equal(study('Example Academy','Is current study?','combobox'),'No');
assert.equal(study('Example Academy','End Date','month'),'2026-06');
assert.equal(study('Example Academy','Location'),'Academy Town');
assert.equal(study('Example Academy','Start Date','date'),undefined);
assert.equal(study('Different School','Start Date','date'),undefined);
assert.equal(study('Example Academy','Major'),undefined);
console.log('School-specific enrollment, qualifications, locations and date precision passed.');

const serviceHistory={'Government employment':'No','Military service':'No'};
const certification='Various laws restrict the post-government employment activities of former military personnel and federal government employees. Which statement applies?';
assert.equal(infer(serviceHistory,certification)?.value,'I have never been employed by the U.S. government or the U.S. Armed Forces.');
assert.equal(infer({'Employment experience':'None'},certification),null);
assert.equal(infer(serviceHistory,'Section 847 concerns employment restrictions. Do you now, or did you at any time in the past 24 months, serve as an official or employee of the DoD? For more information, see National Defense Authorization Act (Section 847).')?.value,'No');
assert.equal(infer({'Protected veteran status':'I am not a protected veteran'},'Are you a protected veteran?')?.value,'No');
const visibility='Only recruiters managing jobs I apply to';
assert.equal(infer({'Recruiter profile visibility':visibility},'Make My Profile Visible to',{type:'radio-group',options:[{value:'restricted',label:visibility}]})?.value,'restricted');
assert.equal(suggestField({label:'Retype Email Address',type:'text'},{confirmed:true,values:{email:'sample@example.com'},answers:[]})?.value,'sample@example.com');
assert.equal(suggestField({label:'Primary Phone',type:'tel',filled:true,digitsPhone:true,phoneBefore:'(202) 555-0101'},{confirmed:true,values:{phone:'2025550101'},answers:[]})?.value,'2025550101');
console.log('Disclosure choices, private visibility, email confirmation and telephone formatting passed.');
const facts={
 'Citizenships':'United States; Vietnam','Highest completed degree':'High school diploma',
 'Full-time student enrollment':'Yes','Degree being pursued':'Bachelor of Science in Mechanical Engineering',
 'Can provide a valid US passport, US birth certificate or certificate of naturalization on request':'Yes',
 'SMS employer policy':'Tech or major defense only; exclude Leidos','SMS contact about my job application':'Yes','Email recruiting contact':'Yes',
 'Current or previous non-US government official':'No','Family or close relationship with a non-US government official':'No',
 'Family military service':'No','Current or former military spouse':'No','Relocation states':'NY, PA, NJ, CT, MA, VT, DE, MD, WV, OH'
};
const answer=(q,extra={})=>infer(facts,q,extra)?.value;
assert.equal(answer('3. Are you legally eligible for employment in the United States? (Proof of identity and employment eligibility will be required within 3 days of hire.)'),'Yes');
assert.equal(answer('Can you provide proof of employment eligibility?',{jobLocation:'Albany, NY'}),'Yes');
assert.equal(answer("If hired by Example, we will verify your most recent graduation date and the highest degree or diploma received. What is the highest level of education you’ve received?"),'High school diploma');
assert.equal(answer('Are you currently working towards a Bachelors or Master’s Degree?'),'Yes');
assert.equal(answer('Are you currently or have you previously been a “non-US government official”? See disclosure for definitions.'),'No');
assert.equal(answer('Are you an immediate family member of, or do you hold a close personal relationship with, a non-US government official?'),'No');
assert.equal(answer('Are you a current or former military spouse? (See definition.)'),'No');
const relocate='Are you willing to relocate if required by the position?';
for(const [location,value] of [['Albany, NY','Yes'],['Ohio, United States','Yes'],['Austin, TX','No'],['United States',undefined]])assert.equal(answer(relocate,{jobLocation:location}),value);
const consent=email=>'Do you consent to being contacted by '+email+' about this or other opportunities? Click here for more information.';
const options=['Yes I consent','No I do not consent'].map(label=>({label,value:label}));
for(const [channel,employer,industry,expected] of [['email','Example','','Yes I consent'],['text/SMS','Example','','No I do not consent'],['text/SMS','Leidos','Software development','No I do not consent'],['SMS','Example','Defense contracting','No I do not consent'],['SMS','Lockheed Martin','','Yes I consent'],['SMS','Example','Software development','Yes I consent'],['SMS','Google','','Yes I consent'],['SMS','Googleton','','No I do not consent']]){
 assert.equal(answer(consent(channel),{type:'select-one',jobEmployer:employer,jobIndustry:industry,options}),expected);
}
const educationFacts={'Highest completed degree':'High school diploma','Citizenships':'United States; Vietnam','Relatives working for the prospective employer':'No'};
const yesNo={type:'select-one',options:['Yes','No'].map(label=>({label,value:label}))};
assert.equal(infer(educationFacts,'Do you have a High School Diploma or GED?',yesNo)?.value,'Yes');
assert.equal(infer(educationFacts,'Do you have a High School Diploma and GED?',yesNo)?.value,undefined);
assert.equal(infer(educationFacts,'Are you a US citizen or national, lawful permanent resident, asylee, or refugee?',yesNo)?.value,'Yes');
assert.equal(infer(educationFacts,'Are you a US citizen and lawful permanent resident?',yesNo)?.value,undefined);
assert.equal(infer(educationFacts,'Do you have relatives who work for our company?',yesNo)?.value,'No');
assert.equal(infer({...educationFacts,'Example relatives':'Yes'},'Do you have relatives who work for Example?',{...yesNo,jobEmployer:'Example'})?.value,'Yes');
const pickOption=(facts,prompt,labels,type='select-one')=>infer(facts,prompt,{type,options:labels.map((label,i)=>({label,value:'option'+i}))});
const choices=['I am currently employed','I have been employed before but I am currently unemployed','I have never held a job'];
for(const type of ['select-one','radio-group','combobox']){
 for(const order of [choices,[...choices].reverse()]){
  const choice=pickOption(noWork,'Which of these statements best describes you?',order,type);
  assert.equal(choice?.display,'I have never held a job');
  assert.equal(choice?.sourceQuestion,'Employment experience');
 }
}
assert.equal(pickOption(noWork,'Which statement best describes your employment history?',[...choices,'I am currently unemployed']),null);
assert.equal(pickOption(noWork,'Which statement best describes your spouse?',choices),null);
assert.equal(pickOption({},'Select one statement',choices),null);
assert.equal(pickOption(noWork,'Select one statement',[...choices,'I am currently a licensed contractor']),null);
assert.equal(pickOption({'Employment experience':'Yes'},'Select one statement',choices),null);
assert.equal(pickOption({'Expected graduation date':'2030-05'},'In which year do you expect to graduate?',['Before 2029','2029–2031','2032 or later'])?.display,'2029–2031');
assert.equal(pickOption({'Expected graduation date':'2030-05'},'Projected graduation year',['Before 2030','2030+','2030–2032']),null);
assert.equal(pickOption(noWork,'How many years of paid work experience do you have?',['5+ years','1–4 years','Less than 1 year'])?.display,'Less than 1 year');
assert.equal(pickOption(noWork,'How many years of CAD experience do you have?',['0','1–4','5+']),null);
assert.equal(pickOption({'Preferred interview language':'English'},'Which interview language do you prefer?',['Vietnamese','English'])?.display,'English');
assert.equal(pickOption({'Preferred interview language':'English'},'Which programming language do you prefer?',['English','Python']),null);
assert.equal(pickOption({'Preferred interview language':'English','What interview language do you prefer?':'Vietnamese'},'Which interview language do you prefer?',['English','Vietnamese']),null);
console.log('Option evidence, conjunctions, subject boundaries, ambiguous alternatives and numeric ranges passed.');
console.log('Employment eligibility, earned and pursued degrees, disclosure subjects, relocation and contextual contact consent passed.');
