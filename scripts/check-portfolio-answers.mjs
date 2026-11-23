import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {preparePortfolio,portfolioAnswer,PORTFOLIO_URL} from '../resume/generator/portfolio-answers.mjs';
import {suggestField} from '../resume/generator/application-autofill.mjs';
import {loadPortfolio} from '../tools/application-helper/portfolio-source.mjs';
const feed=JSON.parse(await readFile(new URL('../data/portfolio.json',import.meta.url))),resume=JSON.parse(await readFile(new URL('../data/resume-match-profile.json',import.meta.url)));
const knowledge=preparePortfolio(feed,resume),profile={confirmed:true,values:{},answers:[]};
const field=(label,type='text',extra={})=>({label,type,...extra});
const suggest=q=>suggestField(field(q),profile,[],'','',knowledge);
for(const q of ['Do you have experience with SolidWorks?','Are you familiar with computer aided design?','Have you used MATLAB?','Do you have any CAD experience?','Do you have project experience with CAD?','Do you have experience with SolidWorks and Onshape?','Do you have project experience with robotics?','Have you worked on electronics?','Do you have experience with engineering simulation?']){
 const a=suggest(q);assert.equal(a?.value,'Yes',q);assert(a.requiresReview);assert(a.sources.length);assert(a.sources.every(s=>s.url.startsWith(PORTFOLIO_URL)));
}
for(const q of ['Do you have experience with ANSYS?','Do you have experience with SolidWorks and ANSYS?','Do you have three years of CAD experience?','Are you certified in SolidWorks?','Do you have professional experience with CAD?','Have you never used MATLAB?','Are you a citizen of the United States?','Do you have a completed engineering degree?','Describe a GD&T project','Describe a project you completed independently','Describe your experience with CATIA','Describe your experience with SolidWorks and ANSYS','Describe a robotics project using CATIA','Describe your greatest engineering failure','Describe your best project','Describe a fully functional robot you built'])assert.equal(suggest(q),null,q);
assert.equal(suggest('Do you have experience with ANSYS or SolidWorks?').value,'Yes');
assert.equal(suggestField(field('Do you have experience with SolidWorks?'),{...profile,confirmed:false},[],'','',knowledge),null);
assert.equal(suggestField(field('Do you have experience with SolidWorks?'),{...profile,answers:[{question:'Do you have experience with SolidWorks?',answer:'No'}]},[],'','',knowledge).value,'No','Explicit answers take priority');
assert.equal(suggestField(field('Do you have experience with SolidWorks?','radio-group',{options:[{label:'Yes',value:'y'},{label:'No',value:'n'}]}),profile,[],'','',knowledge).value,'y');
assert.equal(suggestField(field('Do you have experience with SolidWorks?','select-one',{options:[{label:'No',value:'n'}]}),profile,[],'','',knowledge),null);
const narrative=suggest('Describe your experience with SolidWorks.');assert.match(narrative.value,/Volumetric|SolidWorks/);assert(narrative.sources.length);assert(!/functioning display|walking robot/i.test(narrative.value));
assert.match(suggest('Describe a robotics project you worked on.').value,/Quadruped|Sprocket|Robot/);
assert.match(suggest('Describe your experience with electronics.').value,/Arduino/);
assert.equal(suggestField(field('Describe your experience with SolidWorks.','textarea',{maxLength:20}),profile,[],'','',knowledge),null,'Do not truncate qualifications to fit');
assert.equal(suggest('What are you currently studying?').value,'Mechanical Engineering');
assert.match(suggest('Describe your academic background.').value,/student at Rutgers/);
assert.match(suggest('List your CAD tools.').value,/SolidWorks/);
// Removing evidence removes the claim; a teammate's tool and planned work are not personal achievements.
const altered=structuredClone(feed);altered.projects[0].evidence=[];const clean=preparePortfolio(altered,{...resume,resumeSha256:'0'.repeat(64)});
assert.equal(clean.projects[0].claims.length,0);assert.equal(clean.skills.length,0);
assert(!knowledge.projects.flatMap(p=>p.tools).some(t=>t.name==='Sonar'));
assert(!knowledge.projects.flatMap(p=>p.claims).some(c=>c.state==='planned'));
assert.throws(()=>preparePortfolio({...feed,siteUrl:'https://evil.example/'},resume));
// The loader requests exactly the public feed and current-resume index; no user data.
const stored=new Map(),storage={get:async k=>({[k]:stored.get(k)}),set:async value=>Object.entries(value).forEach(([k,v])=>stored.set(k,v))};let calls=0;
const fetcher=async(url,options)=>{calls++;assert([PORTFOLIO_URL+'data/portfolio.json',PORTFOLIO_URL+'data/resume-match-profile.json'].includes(url));assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert(!options.body);assert(!options.headers);return Response.json(url.endsWith('portfolio.json')?feed:resume);};
const now=Date.now();const first=await loadPortfolio({storage,fetcher,now});assert.equal(first.state,'ready');assert.equal(calls,2);
assert.equal((await loadPortfolio({storage,fetcher,now:now+1000})).state,'ready');assert.equal(calls,2);
const offline=async()=>{throw Error('offline');};assert.equal((await loadPortfolio({storage,fetcher:offline,force:true,now:now+2000})).state,'cached');
const bundled=await loadPortfolio({storage,fetcher:offline,now:now+8*86400000});
assert.equal(bundled.state,'bundled');assert.deepEqual(bundled.knowledge,knowledge);
for(const [question,expected] of [
 ['How have you used CAD on an engineering project?',/Onshape|SolidWorks/],
 ['Tell us about a team project.',/assembly/],
 ['Give an example of testing.',/13.7 seconds/],
 ['Describe a design constraint.',/printable|envelope/],
 ['Describe your technical documentation.',/notebook/i],
 ['What skills would you bring to this internship?',/Arduino/],
 ['What kind of internship are you looking for?',/mechanical engineering/i]
]){const result=suggest(question);assert.match(result?.value||'',expected,question);assert(result.sources.length>0&&result.requiresReview);}
assert.equal(suggest('How have you used CATIA?'),null);
assert.equal(suggest('Describe a team project using CATIA.'),null);
const noResume=await loadPortfolio({storage,force:true,now:now+3000,fetcher:async url=>url.endsWith('portfolio.json')?Response.json(feed):Response.json({}, {status:503})});assert.equal(noResume.knowledge.skills.length,0);assert(noResume.knowledge.projects.length);
console.log('PASS: portfolio-derived skills, cited project drafts, education, explicit-answer precedence, unknown/negated/compound questions, ownership, planned-work exclusion, source validation, bounded caching and offline fallback.');
