import {employerSpecific,privateQuestion,reviewedIdentityQuestion,memoryMatch,normalizeQuestion,questionConcept} from './answer-memory.mjs';
import {suggestField} from './application-autofill.mjs';
import {paginateAnswers} from './answer-pagination.mjs';
const normalizedAnswer=value=>String(value||'').trim().replace(/\s+/g,' ').toLowerCase();
export function answerDifference(item,{origin,context,memory=[],profile}){
 const current=suggestField({label:item.question,type:'text'},profile,memory,origin,context)||memoryMatch(item.question,memory,origin,context);
 if(current){const previous=current.value;return {kind:normalizedAnswer(previous)===normalizedAnswer(item.answer)?'unchanged':'changed',previous};}
 const concept=questionConcept(item.question),same=q=>normalizeQuestion(q)===normalizeQuestion(item.question)||(concept&&questionConcept(q)===concept);
 const known=[...(profile?.answers||[]),...memory.filter(a=>a.scope==='*'||a.scope===origin&&a.context===context)].filter(a=>same(a.question));
 return {kind:known.length?'changed':'new',previous:known.map(a=>a.answer).join(' / ')};
}
export function reviewAnswers(container,{origin,context,candidates,memory=[],profile,onSave,onCancel}){
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 container.replaceChildren();const hint=el('p','Review new or changed answers. Your existing bank stays hidden unless you choose Show all detected answers. Identity answers need explicit selection.');
 const summary=el('p'),toggle=el('button'),list=el('div'),nav=el('nav'),status=el('p'),save=el('button','Save selected answers'),cancel=el('button','Cancel');
 toggle.type=save.type=cancel.type='button';nav.className='answer-pagination';nav.setAttribute('aria-label','Answer review pages');status.setAttribute('role','status');summary.setAttribute('role','status');
 const state={page:1};let showAll=false;const rows=[];
 for(const item of candidates.filter(a=>!privateQuestion(a.question))){
  const difference=answerDifference(item,{origin,context,memory,profile}),row=el('div');row.className='memory-row';row.dataset.difference=difference.kind;
  const badge=el('strong',difference.kind==='new'?'New answer':difference.kind==='changed'?'Changed answer':'Already saved');badge.className='memory-difference '+difference.kind;
  const label=el('label'),check=el('input');check.type='checkbox';check.checked=difference.kind!=='unchanged'&&!reviewedIdentityQuestion(item.question);label.append(check,document.createTextNode(' '+item.question));
  const answer=el('textarea');answer.value=item.answer;answer.rows=2;answer.maxLength=1500;answer.setAttribute('aria-label','Answer: '+item.question);
  const scope=el('select');scope.setAttribute('aria-label','Reuse: '+item.question);
  for(const [value,text] of [[origin,context?.startsWith('page:')?'This page only':'This employer only'],['*','All employers']]){const option=el('option',text);option.value=value;scope.append(option);}scope.value=employerSpecific(item.question)?origin:'*';
  row.append(badge,label);if(difference.kind==='changed')row.append(el('small','Saved: '+difference.previous));row.append(answer,scope);list.append(row);rows.push({item,check,answer,scope,row,...difference});
 }
 const changed=rows.filter(r=>r.kind!=='unchanged');
 function render(){const visible=showAll?rows:changed;for(const r of rows)r.row.hidden=true;paginateAnswers(visible.map(r=>r.row),nav,state);toggle.textContent=showAll?'Show only new or changed answers':'Show all detected answers ('+rows.length+')';toggle.hidden=!rows.some(r=>r.kind==='unchanged');summary.textContent=changed.length+' new or changed · '+(rows.length-changed.length)+' already saved';save.disabled=!visible.length;if(!rows.length)hint.textContent='No supported completed fields found. Answer a question on this page first.';else if(!visible.length)hint.textContent='All detected answers match your saved profile or answer bank. Nothing new to save.';else hint.textContent='Review the answers below. Previously saved matches are hidden by default.';}
 toggle.onclick=()=>{showAll=!showAll;state.page=1;render();};
 save.onclick=async()=>{const selected=rows.filter(r=>r.check.checked&&(showAll||r.kind!=='unchanged')).map(r=>({question:r.item.question,answer:r.answer.value,scope:r.scope.value,sourceOrigin:origin,context}));if(!selected.length){status.textContent='Select an answer to remember.';return;}save.disabled=true;try{await onSave(selected);}catch(error){status.textContent=error.message;}finally{save.disabled=false;}};
 cancel.onclick=onCancel;container.append(hint,summary,toggle,list,nav,status,save,cancel);render();
}
