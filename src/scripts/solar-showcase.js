/* Three project systems; background systems change only when selected. */
(() => {
  const stage=document.querySelector('.machine-stage');
  const motion=document.getElementById('motion-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const projects={
    robot:['box-12','Quadruped robot','A folding robot dog, developed through CAD and printed prototypes.','quadruped-robot/hero-cutout.png'],
    display:['box-7','Volumetric display','A twenty-arm rotor designed to turn moving light into a 3D display.','volumetric-display/hero-cutout.png'],
    fea:['box-11','FEA & GD&T','Studying load paths and stress in a two-plate robot aligner.','fea/hero-cutout.png'],
    vex:['box-6','VEX Pushback','Competition robot drivetrain, intake mechanisms, and controls.','capstone/Sprocket_Robot_CAD.png'],
    cad:['box-3','CAD & manufacturing','Parametric SolidWorks models and manufacturing drawings.','cswa_solidworks_practice.jpg'],
    launch:['box-4','Launch vehicle','Vehicle sizing, structural modeling, and payload packaging.','launch_vehicle_cross_section.png'],
    tower:['box-8','Tower design','A braced balsa structure developed through load testing.','tower/Tower_Testing_Setup.jpg'],
    wind:['box-2','Wind turbine','Iterating blade geometry and pitch for low-speed wind.','wind-turbine-notebook/wt-test-p8-3blade-12in.jpg'],
    stakes:['box-1','High Stakes robot','Competition chassis, lifting mechanisms, and autonomous control.','High_Stake_Robot.png'],
    arduino:['box-5','Arduino synthesizer','An eight-key instrument combining circuits and embedded code.','arduino/Arduino_Physical_Breadboard.jpg'],
    sensor:['box-9','Sensor challenge','Line following and sonar for autonomous warehouse navigation.','sensor-challenge/Sensor_Warehouse_Course.jpg'],
    boat:['box-10','Putt-putt boat','Refining a candle-powered boat for faster, straighter travel.','putt-putt/PuttPutt_Boat_Photo.jpg']
  };
  const systems=[
    {name:'Featured work',keys:['robot','display','fea','vex']},
    {name:'Design & structures',keys:['cad','launch','tower','wind']},
    {name:'Controls & prototypes',keys:['stakes','arduino','sensor','boat']}
  ].map(s=>({...s,current:s.keys[0],slots:s.keys.slice(1),angle:0}));
  let active=0,background=[1,2],paused=document.documentElement.classList.contains('motion-paused');
  let visible=false,lastFrame=null,projectElapsed=0,projectMove=null,systemMove=null;
  let geometry={w:0,cx:0,cy:0,sun:0,planet:0,radius:0};
  const path=key=>'src/assets/images/'+projects[key][3];
  const ease=t=>{t=Math.min(1,Math.max(0,t));return t*t*t*(t*(t*6-15)+10);};
  stage.classList.add('constellation-stage');
  const panel=document.createElement('div');panel.className='active-system';
  panel.innerHTML='<div class="system-description"><span class="system-category"></span><h2></h2><p></p></div><div class="system-field"><div class="system-tracks" aria-hidden="true"></div><button type="button" class="system-sun"><img draggable="false" alt=""><span>View project ↗</span></button><div class="system-planets"></div></div><div class="system-project-tabs" aria-label="Projects in this system"></div>';
  const sun=panel.querySelector('.system-sun'),field=panel.querySelector('.system-field');
  const tabs=panel.querySelector('.system-project-tabs');
  const live=document.createElement('span');live.className='system-announcement';live.setAttribute('aria-live','polite');
  const edges=[0,1].map(i=>{
    const button=document.createElement('button');button.type='button';button.className=`mini-system mini-system-${i}`;
    button.innerHTML='<span class="mini-map" aria-hidden="true"><i class="mini-track"></i><img class="mini-sun" alt=""><img class="mini-planet" alt=""><img class="mini-planet" alt=""><img class="mini-planet" alt=""></span><span class="mini-name"></span>';
    button.addEventListener('click',()=>switchSystem(i));return button;
  });
  stage.replaceChildren(panel,...edges,motion,live);
  const planets=[0,1,2].map(i=>{
    const p=document.createElement('button');p.type='button';p.className='system-planet';p.innerHTML='<img alt="" draggable="false"><span></span>';
    p.addEventListener('click',()=>selectProject(systems[active].slots[i],true));panel.querySelector('.system-planets').appendChild(p);return p;
  });
  const tracks=planets.map(()=>{const r=document.createElement('i');panel.querySelector('.system-tracks').appendChild(r);return r;});
  sun.addEventListener('click',()=>{if(!projectMove&&!systemMove)showProjectDetail(projects[systems[active].current][0]);});
  function renderContent() {
    const s=systems[active],p=projects[s.current];
    panel.dataset.system=String(active);sun.dataset.project=p[0];sun.setAttribute('aria-label',`Open ${p[1]} project`);
    sun.querySelector('img').src=path(s.current);sun.querySelector('img').alt=p[1];
    panel.querySelector('.system-category').textContent=s.name;
    panel.querySelector('h2').textContent=p[1];panel.querySelector('.system-description p').textContent=p[2];
    s.slots.forEach((key,i)=>{const b=planets[i];b.dataset.project=key;b.querySelector('img').src=path(key);b.querySelector('span').textContent=projects[key][1];b.setAttribute('aria-label',`Show ${projects[key][1]} in the center`);});
    // Preserve focused controls during a project exchange.
    if(tabs.dataset.system!==String(active)) {
      tabs.replaceChildren();tabs.dataset.system=String(active);
      s.keys.forEach(key=>{const b=document.createElement('button');b.type='button';b.dataset.key=key;b.textContent=projects[key][1];b.addEventListener('click',()=>selectProject(key,true));tabs.appendChild(b);});
    }
    tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.key===s.current)));
    edges.forEach((button,i)=>{const other=systems[background[i]];button.dataset.system=String(background[i]);button.setAttribute('aria-label',`Explore ${other.name}: ${other.keys.map(k=>projects[k][1]).join(', ')}`);button.querySelector('.mini-name').textContent=other.name;button.querySelector('.mini-sun').src=path(other.current);button.querySelectorAll('.mini-planet').forEach((img,j)=>img.src=path(other.slots[j]));});
  }
  function layout() {
    const w=field.clientWidth;if(!w)return;
    const sunSize=w*.43,planetSize=w<430?40:54;
    const verticalSpace=Math.max(8,planetSize/2-w*.04+8);
    geometry={w,cx:w/2,cy:w*.47+verticalSpace,sun:sunSize,planet:planetSize,radius:w*.34};
    field.style.height=`${w*.94+verticalSpace*2}px`;sun.style.width=sun.style.height=`${sunSize}px`;
    sun.style.left=`${geometry.cx}px`;sun.style.top=`${geometry.cy}px`;
    tracks.forEach((r,i)=>{const diameter=(geometry.radius+i*w*.045)*2;r.style.width=r.style.height=`${diameter}px`;r.style.left=`${geometry.cx}px`;r.style.top=`${geometry.cy}px`;});
    planets.forEach(p=>{p.style.width=p.style.height=`${planetSize}px`;});
  }
  function orbitPoint(slot,angle,radial=1) {
    const r=(geometry.radius+slot*geometry.w*.045)*radial;
    return {x:geometry.cx+Math.cos(angle)*r,y:geometry.cy+Math.sin(angle)*r};
  }
  function lock(value) {stage.querySelectorAll('button:not(#motion-toggle)').forEach(b=>b.disabled=value);}
  function restoreFocus(origin,target) {
    if(origin&&stage.contains(origin)&&(document.activeElement===document.body||document.activeElement===origin))target.focus({preventScroll:true});
  }
  function completeProject() {
    if(!projectMove)return;
    const m=projectMove,s=systems[active];s.slots[m.slot]=s.current;s.current=m.key;
    m.incoming.remove();m.outgoing.remove();sun.style.visibility='';planets[m.slot].style.visibility='';
    projectMove=null;projectElapsed=0;renderContent();lock(false);
    if(m.manual){live.textContent=`${projects[s.current][1]} selected. Open the central image to view the project.`;restoreFocus(m.origin,tabs.querySelector(`[data-key="${m.key}"]`));}
  }
  function selectProject(key,manual=false) {
    if(projectMove||systemMove||key===systems[active].current)return;
    const slot=systems[active].slots.indexOf(key);if(slot<0)return;
    const clone=project=>{const d=document.createElement('div');d.className='system-transfer';d.setAttribute('aria-hidden','true');const img=document.createElement('img');img.src=path(project);img.alt='';d.appendChild(img);field.appendChild(d);return d;};
    projectMove={key,slot,manual,origin:document.activeElement,elapsed:0,incoming:clone(key),outgoing:clone(systems[active].current)};
    sun.style.visibility='hidden';planets[slot].style.visibility='hidden';lock(true);
    if(paused||reduced.matches)completeProject();else drawProject();
  }
  function drawProject() {
    const m=projectMove;if(!m)return;const t=Math.min(m.elapsed/1600,1),e=ease(t),a=systems[active].angle+m.slot*Math.PI*2/3;
    const place=(el,radial,angle,growth)=>{const pos=orbitPoint(m.slot,angle,radial),size=geometry.planet+(geometry.sun-geometry.planet)*growth;el.style.width=el.style.height=`${geometry.sun}px`;el.style.transform=`translate3d(${pos.x}px,${pos.y}px,0) translate(-50%,-50%) scale(${size/geometry.sun})`;};
    // The departing project becomes small before the arriving project grows.
    // Separate curved paths keep both circles clear throughout the exchange.
    place(m.incoming,1-e,a+e*1.15,ease(t*2-1));place(m.outgoing,e,a-(1-e)*1.15,1-ease(t*2));
    if(t===1)completeProject();
  }
  function switchSystem(edge) {
    if(systemMove||projectMove)return;
    const target=background[edge];
    const panelRect=panel.getBoundingClientRect(),miniRect=edges[edge].getBoundingClientRect();
    systemMove={edge,old:active,target,origin:document.activeElement,elapsed:0,swapped:false,dx:miniRect.x+miniRect.width/2-panelRect.x-panelRect.width/2,dy:miniRect.y+miniRect.height/2-panelRect.y-panelRect.height/2};
    edges[edge].style.visibility='hidden';lock(true);
    if(paused||reduced.matches)completeSystem();
  }
  function commitSystem() {
    const m=systemMove;if(m.swapped)return;
    background[m.edge]=m.old;active=m.target;m.swapped=true;projectElapsed=0;renderContent();layout();lock(true);
  }
  function completeSystem() {
    if(!systemMove)return;commitSystem();const {edge,origin}=systemMove;
    panel.style.transform='';panel.style.opacity='';edges[edge].style.visibility='';
    systemMove=null;lock(false);live.textContent=`${systems[active].name} selected. ${projects[systems[active].current][1]} is in the center.`;
    restoreFocus(origin,sun);
  }
  function drawSystem() {
    const m=systemMove;if(!m)return;
    // One panel, two consecutive phases. The two full systems never cross.
    if(m.elapsed<650) {
      const t=ease(m.elapsed/650);panel.style.transform=`translate(${m.dx*t}px,${m.dy*t}px) scale(${1-.88*t})`;panel.style.opacity=String(1-t);
    } else {
      commitSystem();const t=ease((m.elapsed-650)/850);
      panel.style.transform=`translate(${m.dx*(1-t)}px,${m.dy*(1-t)}px) scale(${.12+.88*t})`;panel.style.opacity=String(t);
      if(m.elapsed>=1500)completeSystem();
    }
  }
  document.addEventListener('portfolio-motion',event=>{paused=event.detail.paused;if(paused){completeProject();completeSystem();}});
  new ResizeObserver(layout).observe(field);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;lastFrame=null;},{threshold:0}).observe(stage);
  document.addEventListener('visibilitychange',()=>{lastFrame=null;});
  renderContent();layout();
  function frame(now) {
    const dt=lastFrame===null?0:Math.min(now-lastFrame,40);lastFrame=now;
    if(!paused&&!document.hidden&&visible&&stage.getClientRects().length) {
      systems.forEach(s=>s.angle+=dt*.00009);
      if(projectMove){projectMove.elapsed+=dt;drawProject();}
      if(systemMove){systemMove.elapsed+=dt;drawSystem();}
      if(!projectMove&&!systemMove&&!stage.matches(':hover')&&!stage.contains(document.activeElement)) {
        projectElapsed+=dt;
        if(projectElapsed>9000){const s=systems[active];selectProject(s.keys[(s.keys.indexOf(s.current)+1)%4]);}
      }
    }
    planets.forEach((p,i)=>{const point=orbitPoint(i,systems[active].angle+i*Math.PI*2/3);p.style.transform=`translate3d(${point.x}px,${point.y}px,0) translate(-50%,-50%)`;});
    edges.forEach((b,i)=>b.querySelectorAll('.mini-planet').forEach((img,j)=>{const a=systems[background[i]].angle+j*Math.PI*2/3;img.style.transform=`translate(${Math.cos(a)*31}px,${Math.sin(a)*24}px) translate(-50%,-50%)`;}));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
