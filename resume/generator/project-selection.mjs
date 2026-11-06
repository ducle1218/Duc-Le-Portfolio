const BASELINE=['box-11','box-7','box-12','box-6','box-4'];
const escapes=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function selectProjects(library,text){
 const ranked=library.projects.map((p,index)=>{const matched=p.topics.filter(t=>new RegExp('(^|[^a-z0-9])'+escapes(t)+'(?:s)?(?=$|[^a-z0-9])','i').test(text));return {...p,index,matched,score:matched.reduce((sum,t)=>sum+(['CAD','testing','assembly'].includes(t)?1:3),0)};});
 if(!ranked.some(p=>p.score))return BASELINE.map(id=>ranked.find(p=>p.id===id));
 return ranked.sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,5);
}
export function projectSlots(projects){
 let top=223;
 return projects.map(p=>{
  const height=Number(p.height),matched=p.matched||[];
  if(!Number.isFinite(height)||height<30||height>70)throw new Error('Project layout needs rebuilding.');
  const slot={id:p.id,isProject:true,before:'Project selection: '+p.title,rect:[48,top,564,top+height],sourceRect:[48,223,564,223+height],file:p.file,choice:{text:p.bullets.join('\n'),sources:p.sources},reason:matched.length?'Matches: '+matched.join(', '):'Supporting project; no specific keyword match',title:p.title,url:p.url};
  top+=height+12;return slot;
 });
}
export function projectFooterRect(slots){
 const top=Math.max(...slots.map(slot=>slot.rect[3]))+12;
 if(top>573)throw new Error('Selected projects exceed the one-page template.');
 return [48,top,564,top+165];
}
