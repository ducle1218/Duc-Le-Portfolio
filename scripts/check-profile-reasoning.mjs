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
