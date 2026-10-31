import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';

export const root = new URL('../',import.meta.url);
export const siteUrl = 'https://ducle1218.github.io/Duc-Le-Portfolio/';
export const read = path => readFile(new URL(path,root),'utf8');
export const digest = value => createHash('sha256').update(value).digest('hex');
export const stableText = value => value.replace(/\r\n?/g,'\n');
export const json = value => JSON.stringify(value,null,2)+'\n';
export const plain = value => value.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|rsquo|lsquo|rdquo|ldquo);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“'}[n])).replace(/\s+/g,' ').trim();
const string = {type:'string',minLength:1};
const strings = {type:'array',items:string};
const object = (properties,required=Object.keys(properties)) => ({type:'object',properties,required,additionalProperties:false});
const list = (items,minItems=0) => ({type:'array',items,minItems});
const ownership = {enum:['individual','team','unclear']};
const date = {type:'string',pattern:'^\\d{4}-\\d{2}-\\d{2}$'};
export const evidenceSchema = object({id:string,path:string,quote:string});
export const claimSchema = object({id:string,text:string,owner:ownership,state:{enum:['planned','modeled','simulated','built','tested','documented']},evidenceIds:list(string,1),metrics:list(object({value:{type:'number'},unit:string,meaning:string,conditions:string}))});
export const projectSchema = object({id:{type:'string',pattern:'^box-\\d+$'},title:string,stage:{enum:['College','High school']},category:{enum:['PERSONAL','STUDENT TEAMS','INTERNSHIPS']},dateLabel:string,location:string,summary:string,completionState:string,ownership:object({individual:strings,team:strings,notClaimed:strings}),tools:list(object({name:string,usage:string,owner:ownership,evidenceIds:list(string,1)})),claims:list(claimSchema,1),evidence:list(evidenceSchema,1),limitations:strings,reviewNeeded:strings,updatedOn:{anyOf:[date,{type:'null'}]}});
export const sourceSchema = {$schema:'https://json-schema.org/draft/2020-12/schema',title:'Portfolio project source records',...object({schemaVersion:{const:'1.0.0'},reviewedOn:date,reviewBasis:{const:'existing-public-portfolio'},projects:list(projectSchema,1)})};

// Validate precisely the subset used by the published schema, then cross-check evidence.
// This is intentionally dependency-free; unsupported schema keywords are not accepted here.
export function validate(value,schema,path='$') {
  if(schema.anyOf){assert(schema.anyOf.some(s=>{try{validate(value,s,path);return true}catch{return false}}),path+': invalid value');return;}
  if('const' in schema)assert.deepEqual(value,schema.const,path+': invalid constant');
  if(schema.enum)assert(schema.enum.includes(value),path+': invalid enum');
  if(schema.type){const actual=value===null?'null':Array.isArray(value)?'array':typeof value;assert.equal(actual,schema.type,path+': invalid type');}
  if(schema.type==='string'){assert(value.length>=(schema.minLength||0),path+': empty string');if(schema.pattern)assert(new RegExp(schema.pattern).test(value),path+': invalid format');}
  if(schema.type==='number')assert(Number.isFinite(value),path+': invalid number');
  if(schema.type==='array'){assert(value.length>=(schema.minItems||0),path+': missing items');value.forEach((v,i)=>validate(v,schema.items,path+'['+i+']'));}
  if(schema.type==='object'){
    for(const key of schema.required||[])assert(Object.hasOwn(value,key),path+': missing '+key);
    for(const [key,v] of Object.entries(value)){assert(schema.properties[key]||schema.additionalProperties!==false,path+': unknown field '+key);if(schema.properties[key])validate(v,schema.properties[key],path+'.'+key);}
  }
}
export function validateReferences(project){
  const ids=new Set();
  for(const e of project.evidence){assert(!ids.has(e.id),'Duplicate evidence '+e.id);ids.add(e.id);assert.equal(e.path,'src/content/projects/'+project.id+'.html','Evidence must reference the current project document');}
  const claimIds=new Set();
  for(const c of project.claims){assert(!claimIds.has(c.id),'Duplicate claim '+c.id);claimIds.add(c.id);}
  for(const item of [...project.claims,...project.tools])for(const id of item.evidenceIds)assert(ids.has(id),'Unknown evidence '+id+' in '+project.id);
}
export async function loadRecords(){
  const facts=JSON.parse(await read('src/content/project-facts.json'));
  validate(facts,sourceSchema);
  const profile=JSON.parse(await read('src/content/profile-facts.json'));
  validate(profile,object({name:string,headline:string,facts:list(object({id:string,text:string,evidence:object({path:{const:'index.html'},quote:string})}),1)}));
  const presentation=JSON.parse(await read('src/content/project-presentation.json'));
  assert.equal(facts.projects.length,12,'Expected all twelve portfolio projects');
  const hashes={},ids=new Set();
  for(const project of facts.projects){
    assert(!ids.has(project.id),'Duplicate project '+project.id);ids.add(project.id);validateReferences(project);
    const sourcePath='src/content/projects/'+project.id+'.html';
    const text=await read(sourcePath);hashes[sourcePath]=digest(stableText(text));
    for(const e of project.evidence)assert(plain(text).includes(plain(e.quote)),'Evidence quote no longer matches: '+project.id+'/'+e.id);
    const display=presentation[project.id];assert(display,'Missing presentation metadata '+project.id);
    for(const image of [display.image,...display.imageSet.split(',').map(v=>v.trim().split(' ')[0])]){
      assert(/^src\/assets\/images\/[\w./-]+$/.test(image)&&!image.includes('..'),'Invalid image path');await stat(new URL(image,root));
    }
  }
  assert.equal(Object.keys(presentation).length,ids.size,'Presentation/project mismatch');
  const html=await read('index.html');
  for(const fact of profile.facts)assert(plain(html).includes(plain(fact.evidence.quote)),'Profile quote no longer matches '+fact.id);
  const pdfPath='src/assets/resume/Duc_Le_Resume.pdf';
  const pdf=await readFile(new URL(pdfPath,root));
  assert(pdf.subarray(0,5).toString()==='%PDF-','Resume is not a PDF');
  assert(html.includes('id="resume-download" href="'+pdfPath+'"'),'Resume preview/download source changed');
  hashes[pdfPath]=digest(pdf);
  return {facts,profile,presentation,hashes,pdf:{path:pdfPath,sha256:digest(pdf),bytes:pdf.length}};
}
export function lockFor(records){return {schemaVersion:'1.0.0',reviewedOn:records.facts.reviewedOn,reviewBasis:'Public source consistency check; not independent verification or owner approval.',recordsSha256:digest(json(records.facts)),profileSha256:digest(json(records.profile)),sources:Object.fromEntries(Object.entries(records.hashes).filter(([path])=>!path.endsWith('.pdf')))};}
export function checkLock(records,lock){assert.deepEqual(lock,lockFor(records),'Sources changed since the last fact audit. Review claims and quotations, then run node scripts/build-portfolio-data.mjs --review-sources. Do not bypass this check in CI.');}
const escape = text => text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const labels={modeled:'CAD development',simulated:'Preliminary analysis',built:'Hardware',tested:'Testing',planned:'Next step',documented:'Project evidence'};
export function catalogFor(records){return records.facts.projects.map(project=>{
  const display=records.presentation[project.id];
  return {id:project.id,stage:project.stage,title:project.title,subtitle:project.completionState.replace(/-/g,' '),category:project.category,dateLabel:project.dateLabel,location:project.location,
    icon:display.icon,iconImage:display.iconImage,image:display.image,imageSet:display.imageSet,imageWidth:display.imageWidth,imageHeight:display.imageHeight,imageFit:display.imageFit,
    tags:project.tools.slice(0,3).map(t=>t.name),
    desc:escape(project.summary)+'\n'+project.claims.slice(0,3).map(c=>'• <strong>'+escape(c.owner==='team'?'Team '+labels[c.state].toLowerCase():labels[c.state])+':</strong> '+escape(c.text)).join('\n')};});}
export const spotlightIds=['box-12','box-7','box-11','box-6'];
export function spotlightFor(records){return spotlightIds.map(id=>{const project=records.facts.projects.find(p=>p.id===id),display=records.presentation[id];return [id,project.title,project.summary,display.spotlightTag,display.spotlightImage];});}
export function feedFor(records){
  const resume={schemaVersion:'1.0.0',...records.pdf,url:siteUrl+records.pdf.path,authority:'Current public PDF; preview and download use this file.',contentUpdatedOn:null,projectReconciliation:'Not certified against every project claim. Resolve differences using current evidence; do not merge older exports.',template:'PDF is the published baseline, not an editable resume template. Generate future tailored copies separately.'};
  const snapshotId=digest(json({facts:records.facts,profile:records.profile,sources:records.hashes}));
  const feed={$schema:siteUrl+'data/portfolio.schema.json',schemaVersion:'1.0.0',snapshotId,siteUrl,sourceReviewedOn:records.facts.reviewedOn,
    verification:{level:'published-source-consistency-only',independentlyVerified:false,ownerApprovedForApplications:false,description:'Extracted from the existing public portfolio. Source links and quotations support traceability, not independent verification. Unknown ownership and unfinished work remain explicit.'},
    profile:records.profile,resume,
    usage:{requireClaimEvidence:true,allowInventedQualifications:false,preserveOwnership:true,preserveCompletionState:true,preserveMetricConditions:true,unknownMeans:'unknown, not no',submissionReviewRequired:true,jobPostingIsEvidenceAboutCandidate:false,privateApplicationAnswersIncluded:false},
    projects:records.facts.projects.map(project=>({...project,url:siteUrl+'?project='+project.id,evidence:project.evidence.map(e=>({...e,url:siteUrl+e.path,sourceSha256:records.hashes[e.path]}))}))};
  return {feed,resume};
}
export function markdownFor(feed){
  let text='# '+feed.profile.name+' — public experience record\n\nSnapshot: `'+feed.snapshotId+'`\n\nSource audit: '+feed.sourceReviewedOn+'. Public-source consistency only; not independent verification or permission to submit applications. Unknown values are not negative answers.\n\n'+feed.profile.headline+'\n\n[Current resume PDF]('+feed.resume.url+') — SHA-256 `'+feed.resume.sha256+'`. This PDF is not an editable template.\n';
  text+='\n## Profile facts\n\n'+feed.profile.facts.map(f=>'- **'+f.id+'**: '+f.text+' [Source]('+feed.siteUrl+f.evidence.path+'): “'+f.evidence.quote+'”').join('\n')+'\n';
  for(const project of feed.projects){
    text+='\n## '+project.title+'\n\n'+project.summary+'\n\n'+project.stage+' · '+project.dateLabel+' · '+project.completionState+'\n\n[View project]('+project.url+')\n';
    for(const claim of project.claims){text+='\n- **'+claim.id+'** ('+claim.owner+'; '+claim.state+'): '+claim.text+' Evidence: '+claim.evidenceIds.join(', ')+'.';for(const m of claim.metrics)text+=' '+m.meaning+': '+m.value+' '+m.unit+' ('+m.conditions+').';}
    text+='\n\nTools:\n'+project.tools.map(t=>'- '+t.name+' ('+t.owner+'): '+t.usage+' Evidence: '+t.evidenceIds.join(', ')+'.').join('\n')+'\n';
    text+='\nIndividual work:\n'+project.ownership.individual.map(t=>'- '+t).join('\n')+'\n';
    text+='\nTeam work:\n'+project.ownership.team.map(t=>'- '+t).join('\n')+'\n';
    text+='\nOwnership limits:\n'+[...project.ownership.notClaimed,...project.limitations].map(t=>'- '+t).join('\n')+'\n';
    if(project.reviewNeeded.length)text+='\nNeeds review:\n'+project.reviewNeeded.map(t=>'- '+t).join('\n')+'\n';
    text+='\nEvidence:\n'+project.evidence.map(e=>'- **'+e.id+'** [Source]('+e.url+'): “'+e.quote+'”').join('\n')+'\n';
  }
  return text;
}
const sha = {type:'string',pattern:'^[a-f0-9]{64}$'};
export const feedSchema = {$schema:'https://json-schema.org/draft/2020-12/schema',$id:siteUrl+'data/portfolio.schema.json',title:'Public portfolio experience feed v1',...object({
  $schema:string,schemaVersion:{const:'1.0.0'},snapshotId:sha,siteUrl:string,sourceReviewedOn:date,
  verification:object({level:{const:'published-source-consistency-only'},independentlyVerified:{const:false},ownerApprovedForApplications:{const:false},description:string}),
  profile:object({name:string,headline:string,facts:list(object({id:string,text:string,evidence:object({path:string,quote:string})}),1)}),
  resume:object({schemaVersion:{const:'1.0.0'},path:string,sha256:sha,bytes:{type:'number'},url:string,authority:string,contentUpdatedOn:{type:'null'},projectReconciliation:string,template:string}),
  usage:object({requireClaimEvidence:{const:true},allowInventedQualifications:{const:false},preserveOwnership:{const:true},preserveCompletionState:{const:true},preserveMetricConditions:{const:true},unknownMeans:string,submissionReviewRequired:{const:true},jobPostingIsEvidenceAboutCandidate:{const:false},privateApplicationAnswersIncluded:{const:false}}),
  projects:list({...projectSchema,properties:{...projectSchema.properties,url:string,evidence:list({...evidenceSchema,properties:{...evidenceSchema.properties,url:string,sourceSha256:sha},required:['id','path','quote','url','sourceSha256']},1)},required:[...projectSchema.required,'url']},1)
})};
export async function writeArtifacts(records){
  const {feed,resume}=feedFor(records);validate(feed,feedSchema);
  const outputs={'data/portfolio.json':json(feed),'data/portfolio.md':markdownFor(feed),'data/resume-manifest.json':json(resume),'data/portfolio.schema.json':json(feedSchema),'data/project-source.schema.json':json(sourceSchema),
    'src/scripts/project-catalog.generated.js':'// Generated from src/content/project-facts.json. Do not edit.\nconst TIMELINE_ITEMS = '+JSON.stringify(catalogFor(records))+';\nconst SPOTLIGHT_PROJECTS = '+JSON.stringify(spotlightFor(records))+';\n'};
  await mkdir(new URL('data/',root),{recursive:true});
  for(const [path,value] of Object.entries(outputs))await writeFile(new URL(path,root),value);
  // The first visible slide must use the same facts before any interaction.
  const first=spotlightFor(records)[0];
  const html=(await read('index.html'))
    .replace(/(id="spotlight-title">)[^<]*(<\/h2>)/,(_,a,b)=>a+escape(first[1])+b)
    .replace(/(id="spotlight-summary">)[^<]*(<\/p>)/,(_,a,b)=>a+escape(first[2])+b)
    .replace(/(id="spotlight-tag">)[^<]*(<\/span>)/,(_,a,b)=>a+escape(first[3])+b)
    .replace(/(id="spotlight-open"[^>]*aria-label=")[^"]*(")/,(_,a,b)=>a+'View '+escape(first[1])+' project'+b);
  await writeFile(new URL('index.html',root),html);
  return outputs;
}
