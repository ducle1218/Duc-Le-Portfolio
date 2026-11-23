// Continue only on the reviewed page. A deselected question stays excluded if the employer re-renders it.
export const questionId=field=>JSON.stringify([field.type,field.label]);
export async function fillWithFollowups({url,reviewed,selected,scan,fill,suggest,active=()=>true}){
 const excluded=new Set(reviewed.filter(field=>!selected.includes(field)).map(questionId));
 const attempts=new Map();
 const identity=field=>JSON.stringify([field.type,field.label,field.id,field.name]);
 const total={filled:0,skipped:0,changed:false};
 let pending=selected;
 for(let pass=0;pass<10&&pending.length&&active();pass++){
  for(const field of pending){const key=identity(field);attempts.set(key,(attempts.get(key)||0)+1);}
  const batch=await fill({url,fields:pending});
  total.filled+=batch.filled;total.skipped+=batch.skipped;
  if(batch.changed){total.changed=true;break;}
  if(!batch.filled)break;
  pending=[];
  // Cascading dropdowns may render after the framework's change event or a network response.
  for(const delay of [80,200,400,700]){
   await new Promise(resolve=>setTimeout(resolve,delay));if(!active())return total;
   const form=await scan();if(form.url!==url){total.changed=true;return total;}
   pending=form.fields.filter(field=>field.type!=='chat-reply'&&!field.filled&&!excluded.has(questionId(field))&&(attempts.get(identity(field))||0)<(field.type==='combobox'?2:1))
    .flatMap(field=>{const answer=suggest(field,form);return answer?[{...field,...answer}]:[];});
   if(pending.length)break;
  }
 }
 return total;
}
