// Run the production spotlight script against controlled images, clocks and DOM
// events. This checks asynchronous behavior without a browser or visual mocks.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/scripts/sculptural.js', import.meta.url), 'utf8');
const flush = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };

function harness({reduced=false, globalPaused=false}={}) {
  let now=0, nextTimer=1;
  const timers=new Map(), requests=[], intersections=[], mutations=[];
  class Target {
    listeners=new Map();
    addEventListener(type, listener) {
      const list=this.listeners.get(type)||[];list.push(listener);this.listeners.set(type,list);
    }
    fire(type, detail={}) { for(const listener of this.listeners.get(type)||[])listener({target:this,...detail}); }
  }
  class Element extends Target {
    constructor(name='') {super();this.name=name;this.dataset={};this.attributes={};this.children=[];this.animations=[];this.classes=new Set();this.classList={contains:c=>this.classes.has(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
    setAttribute(name,value){this.attributes[name]=String(value);}
    removeAttribute(name){delete this.attributes[name];}
    getAttribute(name){return this.attributes[name];}
    querySelector(selector){return selector==='.spotlight-progress'?this.progress:null;}
    querySelectorAll(selector){return selector==='.spotlight-outgoing'?this.children.filter(item=>item.className==='spotlight-outgoing'):[];}
    cloneNode(){const clone=new Element();clone.src=this.src;return clone;}
    append(child){this.children.push(child);child.parent=this;}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(item=>item!==this);}
    getAnimations(){return this.animations.filter(animation=>animation.state!=='cancelled');}
    animate(){const animation={state:'running',finished:new Promise(()=>{}),pause(){this.state='paused';},play(){this.state='running';},cancel(){this.state='cancelled';}};this.animations.push(animation);return animation;}
  }
  const ids=Object.fromEntries(['spotlight-image','spotlight-open','spotlight-toggle','spotlight-title','spotlight-summary','spotlight-tag','spotlight-count'].map(id=>[id,new Element(id)]));
  ids['spotlight-image'].sizes='(max-width: 650px) 90vw, 43vw';
  const consoleEl=new Element('console'),caption=new Element('caption');
  const buttons=Array.from({length:4},(_,index)=>{const button=new Element('project '+index);button.progress=new Element('progress');return button;});
  const document=new Target();document.body=new Element('body');document.documentElement=new Element('html');document.hidden=false;
  if(globalPaused)document.documentElement.classes.add('motion-paused');
  document.getElementById=id=>ids[id]||null;
  document.querySelector=selector=>({'.project-console':consoleEl,'.spotlight-caption':caption}[selector]||null);
  document.querySelectorAll=selector=>selector==='[data-spotlight]'?buttons:[];
  const motion=new Target();motion.matches=reduced;
  const hover=new Target();hover.matches=true;
  class FakeImage {
    decode(){return new Promise((resolve,reject)=>requests.push({image:this,resolve,reject}));}
  }
  const context={document,Image:FakeImage,console,performance:{now:()=>now},matchMedia:q=>q.includes('reduced')?motion:hover,
    setTimeout:(callback,delay)=>{const id=nextTimer++;timers.set(id,{callback,due:now+delay});return id;},clearTimeout:id=>timers.delete(id),
    IntersectionObserver:class{constructor(callback){this.callback=callback;intersections.push(this);}observe(target){this.target=target;}},
    MutationObserver:class{constructor(callback){this.callback=callback;mutations.push(this);}observe(){}},showProjectDetail:id=>{context.opened=id;}};
  vm.runInNewContext(source,context,{filename:'sculptural.js'});
  async function tick(ms){const end=now+ms;for(;;){const entry=[...timers].filter(([,timer])=>timer.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];if(!entry)break;now=entry[1].due;timers.delete(entry[0]);entry[1].callback();await flush();}now=end;await flush();}
  const visible=on=>intersections.find(observer=>observer.target===consoleEl).callback([{isIntersecting:on,intersectionRatio:on?1:0}]);
  const route=page=>{document.body.dataset.atmospherePage=page;mutations.forEach(observer=>observer.callback([]));};
  return {ids,consoleEl,caption,buttons,document,motion,requests,timers,context,tick,visible,route,
    async resolve(index){requests[index].resolve();await flush();},
    async reject(index){requests[index].reject(new Error('image unavailable'));await flush();}};
}

const tests=[];
function test(name, run){tests.push({name,run});}

test('waits for visibility, advances after nine seconds and resets dwell',async()=>{
  const h=harness();await h.tick(20000);assert.equal(h.requests.length,0);
  h.visible(true);await h.tick(8999);assert.equal(h.requests.length,0);
  await h.tick(1);assert.equal(h.requests.length,1);await h.resolve(0);
  assert.equal(h.consoleEl.dataset.project,'box-7');assert.equal(h.caption.getAttribute('aria-live'),'off');
  assert.equal(h.requests[0].image.sizes,h.ids['spotlight-image'].sizes);
  h.ids['spotlight-open'].onclick();assert.equal(h.context.opened,'box-7');
  await h.tick(8999);assert.equal(h.requests.length,1);await h.tick(1);assert.equal(h.requests.length,2);
});
test('hover freezes and resumes the remaining dwell',async()=>{
  const h=harness();h.visible(true);await h.tick(4000);h.consoleEl.fire('mouseenter');
  await h.tick(20000);assert.equal(h.requests.length,0);h.consoleEl.fire('mouseleave');
  await h.tick(4999);assert.equal(h.requests.length,0);await h.tick(1);assert.equal(h.requests.length,1);
});
test('hidden document and non-home route suspend rotation',async()=>{
  const h=harness();h.visible(true);await h.tick(1000);h.document.hidden=true;h.document.fire('visibilitychange');
  await h.tick(20000);assert.equal(h.requests.length,0);h.document.hidden=false;h.document.fire('visibilitychange');
  h.route('project');await h.tick(20000);assert.equal(h.requests.length,0);h.route('home');
  await h.tick(7999);assert.equal(h.requests.length,0);await h.tick(1);assert.equal(h.requests.length,1);
});
test('reduced motion permits manual navigation without animation',async()=>{
  const h=harness({reduced:true});h.visible(true);await h.tick(20000);assert.equal(h.requests.length,0);
  h.buttons[1].fire('click');await h.resolve(0);
  assert.equal(h.consoleEl.dataset.project,'box-7');assert.equal(h.ids['spotlight-image'].animations.length,0);
  assert.equal(h.caption.getAttribute('aria-live'),'polite');assert.equal(h.ids['spotlight-toggle'].disabled,true);
});
test('latest manual selection wins a reversed image-decode race',async()=>{
  const h=harness();h.visible(true);h.buttons[1].fire('click');h.buttons[2].fire('click');
  await h.resolve(1);assert.equal(h.consoleEl.dataset.project,'box-11');
  await h.resolve(0);assert.equal(h.consoleEl.dataset.project,'box-11');
  await h.tick(20000);assert.equal(h.requests.length,2);
});
test('failed image preserves the current project and can retry',async()=>{
  const h=harness();h.buttons[1].fire('click');await h.reject(0);
  assert.equal(h.consoleEl.dataset.project,'box-12');h.buttons[1].fire('click');assert.equal(h.requests.length,2);
  await h.resolve(1);assert.equal(h.consoleEl.dataset.project,'box-7');
});
test('focusing a project cancels an automatic image still loading',async()=>{
  const h=harness();h.visible(true);await h.tick(9000);h.consoleEl.fire('focusin',{target:h.ids['spotlight-open']});
  await h.resolve(0);assert.equal(h.consoleEl.dataset.project,'box-12');
});
test('explicit Pause cancels an automatic image still loading',async()=>{
  const h=harness();h.visible(true);await h.tick(9000);h.ids['spotlight-toggle'].fire('click');
  await h.resolve(0);assert.equal(h.consoleEl.dataset.project,'box-12');
});
test('global motion pause also suppresses manual transition animations',async()=>{
  const h=harness({globalPaused:true});h.visible(true);h.buttons[1].fire('click');await h.resolve(0);
  assert.equal(h.consoleEl.dataset.project,'box-7');assert.equal(h.ids['spotlight-image'].animations.length,0);
  assert.equal(h.caption.animations.length,0);
});

let failed=0;
for(const {name,run} of tests){try{await run();console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+'\n  '+error.message);}}
console.log(`${tests.length-failed}/${tests.length} spotlight checks passed.`);
if(failed)process.exitCode=1;
