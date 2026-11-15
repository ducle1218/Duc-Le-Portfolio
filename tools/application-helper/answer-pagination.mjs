// Keep all editable rows in the form; only ten are visible at a time.
export function paginateAnswers(rows,nav,state){
 const pages=Math.max(1,Math.ceil(rows.length/10));state.page=Math.min(pages,Math.max(1,state.page||1));
 rows.forEach((row,i)=>{row.hidden=Math.floor(i/10)!==state.page-1;});
 nav.replaceChildren();nav.hidden=rows.length<=10;if(nav.hidden)return;
 const button=(text,disabled,step)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.disabled=disabled;b.onclick=()=>{state.page+=step;paginateAnswers(rows,nav,state);rows.find(row=>!row.hidden)?.scrollIntoView?.({block:'start'});state.onPage?.();};return b;};
 const status=document.createElement('span');status.setAttribute('role','status');status.textContent='Page '+state.page+' of '+pages+' · '+rows.length+' answers';
 nav.append(button('Previous answers',state.page===1,-1),status,button('Next answers',state.page===pages,1));
}
