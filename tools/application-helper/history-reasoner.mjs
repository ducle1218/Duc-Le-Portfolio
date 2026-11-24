import {commonQuestion,questionKey} from './common-questions.mjs?v=20261123.3';

// A directed edge means that every instance of the narrower history also
// counts as an instance of the broader history. Its absence flows in reverse.
const includes = [
 ['currentJob','employment'], ['governmentJob','employment'],
 ['currentGovernmentJob','governmentJob'], ['currentGovernmentJob','currentJob'],
 ['activeClearance','clearance'], ['currentService','service']
];
const historyNames={employment:'paid employment',currentJob:'current employment',governmentJob:'government employment',currentGovernmentJob:'current government employment',activeClearance:'an active clearance',clearance:'clearance history',service:'military service',currentService:'current military service',polygraph:'polygraph history'};
const facts = new Map([
 ['employment experience','employment'], ['government employment','governmentJob'],
 ['military service','service'], ['active security clearance','activeClearance'],
 ['previous security clearance','clearance'], ['polygraph history','polygraph']
]);

function truth(answer,concept){
 const value=questionKey(answer);
 if(value==='yes')return true;
 if(value==='no'||(['employment','polygraph'].includes(concept)&&value==='none'))return false;
 return undefined;
}

function evidenceFor(entries,field){
 const evidence=new Map(), queue=[];
 function add(concept,value,source,path){
  if(!evidence.has(concept))evidence.set(concept,new Map());
  const witnesses=evidence.get(concept);
  if(witnesses.has(value))return;
  witnesses.set(value,{value,source,path});
  queue.push({concept,value,source,path});
 }
 for(const row of entries){
  const name=questionKey(row.question);
  const concept=facts.get(name)||facts.get(questionKey(commonQuestion(name)?.question))||predicate(name);
  if(!concept)continue;
  const value=truth(row.answer,concept);
  if(value!==undefined)add(concept,value,row.question,[]);
 }
 const parent=predicate(questionKey(field.parentQuestion)), value=questionKey(field.parentAnswer);
 if(parent&&['yes','no'].includes(value))add(parent,value==='yes','Preceding form answer',[]);
 for(let i=0;i<queue.length;i++){
  const item=queue[i];
  for(const [narrow,broad] of includes){
   const from=item.value?narrow:broad, to=item.value?broad:narrow;
   if(item.concept===from)add(to,item.value,item.source,[...(item.path.length?item.path:[from]),to]);
  }
 }
 return evidence;
}

// Only consume a whole personal-history clause. Substrings such as
// "eligible for clearance" and "a family member served" are different claims.
function predicate(clause){
 const s=clause.replace(/^(?:please )?(?:indicate|specify|confirm) (?:if|whether) (?:or not )?/,'').replace(/^(?:including your current position |at any (?:point|time) in your career )/,'')
  .replace(/^(?:(?:have|did|do|are|were) you |you (?:have |are )?)/,'')
  .replace(/^(?:ever |previously |at any time )/,'');
 if(/^(?:been employed|held (?:a|any) (?:job|paid position)|had (?:a|any) job|worked for pay)$/.test(s))return 'employment';
 if(/^(?:currently employed|employed (?:right now|at present)|currently hold a paid position)$/.test(s))return 'currentJob';
 const govt='(?:a |an |the )?government';
 if(new RegExp('^(?:currently (?:work for|employed by) '+govt+'|(?:a |an )?current government (?:civilian )?employee)$').test(s))return 'currentGovernmentJob';
 if(new RegExp('^(?:(?:been employed by|worked for) '+govt+'|(?:held|had) (?:a |any )?government (?:civilian )?(?:job|position)|(?:been|served as) (?:a |an )?government (?:civilian )?employee)$').test(s))return 'governmentJob';
 if(/^(?:(?:currently )?(?:hold|have|possess) (?:a |an )?(?:current |active |valid )?(?:security clearance)|currently cleared)$/.test(s))return 'activeClearance';
 if(/^(?:held|had|possessed|been granted) (?:a |an |any )?(?:government |federal )?security clearance$/.test(s))return 'clearance';
 if(/^(?:currently (?:serve|serving) in|an active member of) (?:the )?(?:military|armed forces)$/.test(s))return 'currentService';
 if(/^(?:served in|been a member of) (?:the )?(?:military|armed forces)$/.test(s))return 'service';
 if(/^(?:taken|undergone|completed|had) (?:a |an |any )?polygraph(?: examination| test)?$/.test(s))return 'polygraph';
 return null;
}

const details=[
 ['governmentJob',/^(?:(?:your )?current )?government civilian (?:employment )?status$/],
 ['service',/^(?:(?:your )?current )?(?:military (?:service )?(?:branch|status)|branch of (?:military )?service)$/],
 ['clearance',/^(?:(?:what is|indicate|select) (?:your |the )?)?(?:highest |current )?(?:security clearance level|level of security clearance)(?: (?:held|you (?:have )?held))?$/],
 ['polygraph',/^(?:which|what) (?:type|types|type s|kind) of polygraph (?:have you (?:had|taken)|did you (?:take|undergo))$/]
];

export function reasonFromHistory(field,entries){
 const question=questionKey(field.label).replace(/^\d+ /,'');
 const detail=details.find(([,pattern])=>pattern.test(question));
 // Legacy handlers recognize qualified employment windows and named sectors.
 if(/^are you currently employed or have you been employed in the past \w+ years? by /.test(question))return null;
 const parts=question.split(/\b(and|or)\b/).map(s=>s.trim());
 const concepts=detail?[detail[0]]:parts.filter((_,i)=>i%2===0).map(predicate);
 if(!concepts.some(Boolean))return null;
 const operators=parts.filter((_,i)=>i%2===1);
 if(!detail&&(new Set(operators).size>1||concepts.some(c=>!c)))return {blocked:true};
 const facts=evidenceFor(entries,field);
 const known=concepts.map(c=>facts.get(c));
 if(known.some(values=>values?.size>1))return {blocked:true};
 const proofs=known.map(values=>values?.values().next().value);
 let proof;
 if(!detail&&operators.length){
  const decisive=operators[0]==='or';
  const witness=proofs.find(p=>p?.value===decisive);
  if(!witness&&proofs.some(p=>!p))return {blocked:true};
  proof=witness?[witness]:proofs;
 }else if(proofs[0])proof=[proofs[0]];
 if(!proof||detail&&proof[0].value){
  // Existing exact profile answers can supply a specific level or type.
  const exact=entries.filter(row=>questionKey(row.question)===question);
  const values=new Set(exact.map(row=>row.answer.trim()));
  if(values.size===1&&exact.length)return {value:exact[0].answer,display:exact[0].answer,sourceQuestion:exact[0].question,reason:'Your saved answer to this question',requiresReview:true};
  return {blocked:true};
 }
 const absentLevel=detail&&['clearance','polygraph'].includes(detail[0]);
 const value=detail?(absentLevel?'None':'N/A'):(proof[0].value?'Yes':'No');
 const sources=[...new Set(proof.map(p=>p.source))];
 const path=proof.find(p=>p.path.length)?.path;
 const reason=detail?'No applicable history for this field':operators.length?'Resolved from the component questions':path?'Based on '+path.map(c=>historyNames[c]).join(' → '):'From your recorded history';
 return {value,display:value,sourceQuestion:sources.join(' + '),requiresReview:true,
  reason,
  ...(detail?{aliases:absentLevel?['none',detail[0]==='clearance'?'no clearance':'no polygraph','none of the above','not applicable','n a','no']:['n a','not applicable','none','did not serve','no military service','not applicable n a']}:{} )};
}
