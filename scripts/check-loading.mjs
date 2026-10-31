import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const html=await read('index.html'),source=await read('src/scripts/portfolio.js');
assert(Buffer.byteLength(html)<30000,'Initial document must remain below 30 KB');
assert(!html.includes('PROJECT_DETAILS'),'Project write-ups must not ship in the initial document');
assert(!html.includes('fonts.googleapis.com'),'Initial fonts must be self-hosted');
assert(!/<source\s+src="[^"]+Portfolio_Background_Video/.test(html),'Workbench video must stay deferred');
assert(!/id="hero-bg-video"[^>]+autoplay/.test(html),'Workbench video must not autoplay on startup');
const catalog=await read('src/scripts/project-catalog.generated.js');
const items=vm.runInNewContext(catalog+';TIMELINE_ITEMS');
for(const item of items){
 const content=await read('src/content/projects/'+item.id+'.html');
 assert(content.includes('<'),'Missing project content: '+item.id);
 await stat(new URL(item.image,root));
 for(const candidate of item.imageSet.split(','))await stat(new URL(candidate.trim().split(' ')[0],root));
}
// Exercise the actual async loader, including cache, errors, and stale navigation.
const loader=source.slice(source.indexOf('const projectContent ='),source.indexOf('function hideProjectDetail()'));
let calls=0,resolveFetch,fail=false;const elements=new Map();
function element(){return {innerHTML:'',attrs:{},classList:{add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v},firstElementChild:{prepend(){}},querySelector(){return {addEventListener(){}}}};}
const doc={body:{dataset:{}},getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},querySelectorAll(){return []},createElement:element};
const context=vm.createContext({document:doc,window:{scrollTo(){}},TIMELINE_ITEMS:items,escapeHtml:x=>x,
 updateCswaLevelBadges(){},initCswaLevelChecks(){},initStressCalculator(){},
 fetch(){calls++;return new Promise(resolve=>{resolveFetch=()=>resolve({ok:!fail,text:async()=>'<article>Loaded</article>'})})}});
vm.runInContext(loader,context);
const first=context.showProjectDetail('box-12');assert.equal(doc.getElementById('project-detail-body').attrs['aria-busy'],'true');resolveFetch();await first;
assert.equal(doc.getElementById('project-detail-body').innerHTML,'<article>Loaded</article>');
assert.equal(doc.getElementById('project-detail-body').attrs['aria-busy'],'false');
await context.showProjectDetail('box-12');assert.equal(calls,1,'Revisit should reuse content');
const stale=context.showProjectDetail('box-7');vm.runInContext('detailRevision++',context);doc.getElementById('project-detail-body').innerHTML='New page';resolveFetch();await stale;
assert.equal(doc.getElementById('project-detail-body').innerHTML,'New page','Old fetch must not overwrite navigation');
fail=true;const error=context.showProjectDetail('box-6');resolveFetch();await error;
assert(doc.getElementById('project-detail-body').innerHTML.includes('Retry project'));
fail=false;const retry=context.showProjectDetail('box-6');resolveFetch();await retry;
assert.equal(doc.getElementById('project-detail-body').innerHTML,'<article>Loaded</article>');
new vm.Script(await read('src/scripts/site.bundle.js'));
console.log('PASS: 12 project documents/assets; startup budgets; cache, stale-navigation and retry behavior; bundle syntax.');
