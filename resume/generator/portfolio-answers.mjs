// Local inference over cited portfolio facts. No remote model, code execution,
// employer-page instructions, or question-bank entry is needed.
export const PORTFOLIO_URL='https://ducle1218.github.io/Duc-Le-Portfolio/';
const key=s=>String(s||'').toLowerCase().replace(/c\+\+/g,'cplusplus').replace(/c#/g,'csharp').replace(/[^a-z0-9]+/g,' ').trim();
const str=(v,max=2000)=>typeof v==='string'&&v.length<=max?v.trim():'';
const aliases={cad:['cad','computer aided design','computer aided drafting'],solidworks:['solidworks','solid works'],onshape:['onshape'],autocad:['autocad','auto cad'],fea:['fea','finite element analysis'],matlab:['matlab'],python:['python'],cplusplus:['cplusplus'],excel:['excel','microsoft excel'], '3d printing':['3d printing','additive manufacturing','fdm'], 'mechanical design':['mechanical design'],assembly:['assembly','mechanical assembly'], 'structural analysis':['structural analysis'],documentation:['documentation','technical documentation'], 'arduino uno':['arduino','arduino uno'],pneumatics:['pneumatics','pneumatic systems'], 'hand fabrication':['hand fabrication']};
Object.assign(aliases,{robotics:['robotics','robotics projects'],electronics:['electronics','electronic circuits'],simulation:['simulation','engineering simulation'],prototyping:['prototyping','physical prototyping']});
const skillKey=s=>Object.entries(aliases).find(([,names])=>names.includes(key(s)))?.[0]||key(s);
const source=(title,url,quote)=>({title,url,quote});
export function preparePortfolio(feed,resume){
 if(feed?.schemaVersion!=='1.0.0'||feed.siteUrl!==PORTFOLIO_URL||!Array.isArray(feed.projects)||feed.projects.length>40||!str(feed.snapshotId,100))throw Error('Portfolio data format is unavailable.');
 const projects=feed.projects.flatMap(p=>{
  if(!/^box-\d+$/.test(p.id)||!str(p.title,180))return [];
  const evidence=new Map((Array.isArray(p.evidence)?p.evidence:[]).slice(0,60).filter(e=>str(e.id,100)&&str(e.quote)).map(e=>[e.id,e]));
  const supported=x=>Array.isArray(x.evidenceIds)&&x.evidenceIds.length>0&&x.evidenceIds.every(id=>evidence.has(id));
  const url=PORTFOLIO_URL+'?project='+p.id;
  const citations=x=>x.evidenceIds.slice(0,3).map(id=>source(p.title,url,evidence.get(id).quote));
  const claims=(Array.isArray(p.claims)?p.claims:[]).slice(0,40).filter(c=>c.owner==='individual'&&['modeled','built','simulated','tested','documented'].includes(c.state)&&str(c.text)&&supported(c)).map(c=>({text:c.text,state:c.state,sources:citations(c),evidenceIds:c.evidenceIds}));
  const tools=(Array.isArray(p.tools)?p.tools:[]).slice(0,30).filter(t=>t.owner==='individual'&&str(t.name,80)&&str(t.usage)&&supported(t)).map(t=>({name:t.name,key:skillKey(t.name),usage:t.usage,sources:citations(t),evidenceIds:t.evidenceIds}));
  return [{id:p.id,title:p.title,url,completionState:str(p.completionState,100),claims,tools}];
 });
 const resumeMatches=resume?.resumeSha256===feed.resume?.sha256&&/^[a-f0-9]{64}$/.test(resume?.resumeSha256||'');
 const skills=resumeMatches&&(Array.isArray(resume.skills))?resume.skills.slice(0,60).filter(s=>str(s.name,80)&&str(s.evidence)).map(s=>({name:s.name,key:skillKey(s.name),qualifier:str(s.qualifier,300),sources:[source('Published resume',PORTFOLIO_URL+'src/assets/resume/Duc_Le_Resume.pdf',s.evidence)]})):[];
 const education=(feed.profile?.facts||[]).find(f=>f.id==='education-current');
 return {format:'duc-portfolio-knowledge-v1',snapshotId:feed.snapshotId,reviewedOn:str(feed.sourceReviewedOn,20),projects,skills,education:str(education?.text),educationSources:education?.evidence?.quote?[source('Portfolio · education',PORTFOLIO_URL,str(education.evidence.quote))]:[]};
}
const uniqueSources=items=>[...new Map(items.map(s=>[s.url+'\n'+s.quote,s])).values()].slice(0,4);
export function portfolioAnswer(field,knowledge){
 if(knowledge?.format!=='duc-portfolio-knowledge-v1')return null;
 const q=key(field.label).replace(/\b(required|optional)\b/g,'').trim();
 // Unknown is not No. These require explicit personal facts or quantified proof.
 if(/\b(not|never|without|lack|professional|professionally|commercial|industry|industrial|paid|employed|employment|years|months|year|month|expert|expertise|proficient|advanced|certified|certification|license|licensed|citizen|citizenship|visa|sponsor|authorized|authorization|gpa|salary|gender|race|ethnicity|disability|veteran|birth|age|agree|certify|completed|successful|successfully|production|productionized|fluent|fully|functional|deployed|operational|independently|alone|sole)\b/.test(q)||/\d/.test(q.replace(/3d/g,'')))return null;
 const answer=(value,sources,reason='Draft from documented portfolio evidence')=>sources.length&&(!field.maxLength||field.maxLength<0||value.length<=field.maxLength)?{value,display:value,requiresReview:true,reason,sourceQuestion:'Portfolio · '+knowledge.reviewedOn,sources:uniqueSources(sources),portfolioDerived:true}:null;
 const allSkills=new Map();
 if(/^(summary|professional summary|cover letter)( required)?$/.test(q)){
  const project=knowledge.projects.find(p=>p.claims.length);
  if(!project)return null;
  const claim=project.claims[0];
  const intro='I am studying mechanical engineering at Rutgers University.';
  const experience='My project experience includes '+project.title+'. '+claim.text;
  const draft=q.startsWith('cover letter')?'Dear Hiring Team,\n\n'+intro+' I am applying for your internship. '+experience+'\n\nThank you for considering my application.':intro+' '+experience;
  return answer(draft,[...knowledge.educationSources,...claim.sources],'Portfolio draft for your review');
 }
 for(const s of knowledge.skills)allSkills.set(s.key,{...s,project:false});
 for(const p of knowledge.projects)for(const t of p.tools){const previous=allSkills.get(t.key);allSkills.set(t.key,{...t,project:true,sources:uniqueSources([...(previous?.sources||[]),...t.sources])});}
 // CAD is a broader skill supported by actual use of a CAD tool.
 {const cad=[...allSkills.values()].filter(s=>['solidworks','onshape','autocad'].includes(s.key));if(cad.length)allSkills.set('cad',{name:'CAD',key:'cad',project:cad.some(s=>s.project),sources:cad.flatMap(s=>s.sources)});}
 const domainRules=[
  ['robotics','Robotics project work',p=>/\brobot\b|\brobotics\b/.test(key(p.title)),c=>true],
  ['electronics','Electronics projects',p=>/\belectronics\b|\barduino\b/.test(key(p.title)),c=>c.state==='built'],
  ['simulation','Engineering simulation',p=>true,c=>c.state==='simulated'],
  ['prototyping','Physical prototyping',p=>true,c=>c.state==='built'],
 ];
 for(const [name,label,projectTest,claimTest] of domainRules){const claims=knowledge.projects.filter(projectTest).flatMap(p=>p.claims.filter(claimTest));if(claims.length&&!allSkills.has(name))allSkills.set(name,{key:name,name:label,project:true,sources:claims.flatMap(c=>c.sources)});}
 const rearranged=q.replace(/^do you have (any )?(.+) experience$/, 'do you have experience with $2');
 const yes=rearranged.match(/^(?:do you have (?:any |hands on |project )?(?:experience|knowledge|working knowledge) (?:with|in|of|using)|have you (?:ever )?(?:used|worked with|worked on)|are you familiar with) (.+)$/);
 if(yes){
  let subject=yes[1].replace(/\s+(software|tools|tool)$/,'');
  const either=subject.includes(' or ');if(either&&subject.includes(' and '))return null;
  const terms=subject.split(either?/\s+or\s+/:/\s+and\s+|\s*,\s*/).map(s=>skillKey(s)).filter(Boolean);
  const found=terms.map(t=>allSkills.get(t));const valid=s=>s&&(!q.includes('project experience')||s.project);
  if(!terms.length||terms.length>5||(either?!found.some(valid):!found.every(valid)))return null;
  return answer('Yes',found.filter(valid).flatMap(s=>s.sources),'Supported skill overlap · confirm the employer’s wording');
 }
 if(/^(?:what (?:are|is)|list|which) (?:your )?(?:technical skills|engineering skills|cad tools|cad software|design software)(?: do you (?:use|know|have experience with))?$/.test(q)){
  const chosen=[...allSkills.values()].filter(s=>!/cad tools|cad software|design software/.test(q)||['solidworks','onshape','autocad'].includes(s.key));
  return chosen.length?answer(chosen.map(s=>s.name).join(', '),chosen.flatMap(s=>s.sources),'Skills documented in the portfolio or current resume'):null;
 }
 const edu=knowledge.education.match(/^Mechanical engineering student at (Rutgers University)/i);
 if(edu&&knowledge.educationSources.length){
  if(/^(what are you (currently )?studying|what is your (major|field of study)|field of study)$/.test(q))return answer('Mechanical Engineering',knowledge.educationSources);
  if(/^(which university are you currently attending|what university do you (currently )?attend)$/.test(q))return answer(edu[1],knowledge.educationSources);
  if(/^(describe|summarize|tell us about) your (education|educational background|academic background)$/.test(q))return answer('I am a mechanical engineering student at '+edu[1]+'.',knowledge.educationSources);
 }
 const narrative=/^(?:please )?(describe|summarize|tell us about|tell me about|give (?:us )?an example of|provide an example of)\b/.test(q)&&/\b(project|projects|experience|work|design|designing|built|building)\b/.test(q);
 if(!narrative||/\b(why|failure|failed|conflict|difficult|challenge|challenging|proud|leadership|led|lead|managed|manage|greatest|best|favorite|budget|deadline|overcame)\b/.test(q))return null;
 const requestedSkills=[...Object.entries(aliases)].filter(([,names])=>names.some(n=>(' '+q+' ').includes(' '+n+' '))).map(([k])=>k);
 // An unknown specific tool cannot be answered with an unrelated project.
 const specific=q.match(/(?:experience|work) (?:with|using|in) (.+)$/);
 if(specific&&!specific[1].split(/\s+and\s+|\s*,\s*/).every(t=>Object.hasOwn(aliases,skillKey(t))))return null;
 const using=q.match(/\busing (.+)$/);if(using&&!using[1].split(/\s+and\s+|\s*,\s*/).every(t=>Object.hasOwn(aliases,skillKey(t))))return null;
 const themes=['robot','robotics','electronics','turbine','boat','tower','launch','display','structural','prototyping','fabrication'];
 const terms=[...requestedSkills,...themes.filter(t=>q.includes(t))];
 if(!terms.length&&!/^(describe|summarize|tell us about|tell me about|give(?: us)? an example of|provide an example of) (?:your |a |an |one of your )?(?:engineering |technical |mechanical )?(?:project|projects|project experience|experience|work)(?: you (?:have )?(?:worked on|built|designed))?$/.test(q))return null;
 const ranked=knowledge.projects.filter(p=>p.claims.length).map(p=>{
  const toolKeys=p.tools.map(t=>t.key);const hay=key(p.title+' '+p.claims.map(c=>c.text).join(' ')+' '+p.tools.map(t=>t.usage).join(' '));
  const covers=k=>toolKeys.includes(k)||(k==='cad'&&toolKeys.some(t=>['solidworks','onshape','autocad'].includes(t)))||(k==='fea'&&p.claims.some(c=>c.state==='simulated')&&/analysis|stress|load/.test(hay))||domainRules.some(([name,,projectTest,claimTest])=>name===k&&projectTest(p)&&p.claims.some(claimTest));
  if(requestedSkills.length&&!requestedSkills.every(covers))return null;
  const score=requestedSkills.length*10+terms.reduce((n,t)=>n+(hay.includes(t.replace('robotics','robot'))?3:0),0);
  return {p,score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
 if(!ranked.length||(terms.length&&ranked[0].score===0))return null;
 const p=ranked[0].p,tool=p.tools.find(t=>requestedSkills.includes(t.key));
 const linked=tool?p.claims.filter(c=>c.evidenceIds.some(id=>tool.evidenceIds.includes(id))):[];
 const claims=(linked.length?linked:p.claims).slice(0,2);
 const status=p.completionState.replace(/-/g,' ');
 const text='My work on '+p.title+' included:\n'+claims.map(c=>'• '+c.text).join('\n')+(status?'\nProject status: '+status+'.':'');
 return answer(text,claims.flatMap(c=>c.sources));
}
