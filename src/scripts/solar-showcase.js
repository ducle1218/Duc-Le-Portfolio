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
  const framedPhotos=new Set(['cad','tower','wind','stakes','arduino','sensor','boat']);
  function setProjectMedia(wrapper,key) {
    wrapper.querySelector('img').src=path(key);
    const photo=framedPhotos.has(key);wrapper.classList.toggle('has-photo-backdrop',photo);
    if(photo)wrapper.style.setProperty('--project-photo',`url("${new URL(path(key),document.baseURI).href}")`);
    else wrapper.style.removeProperty('--project-photo');
  }
  const ease=t=>{t=Math.min(1,Math.max(0,t));return t*t*t*(t*(t*6-15)+10);};
  stage.classList.add('constellation-stage');
  const scene=document.createElement('div');scene.className='system-scene';
  const panel=document.createElement('div');panel.className='active-system';
  panel.innerHTML='<div class="system-field"><div class="system-tracks" aria-hidden="true"></div><button type="button" class="system-sun"><img draggable="false" alt=""><span>View project ↗</span></button><div class="system-planets"></div></div>';
  const sun=panel.querySelector('.system-sun'),field=panel.querySelector('.system-field');
  const description=document.createElement('div');description.className='system-description';
  description.innerHTML='<div class="system-kicker"><span class="system-category"></span></div><h2></h2><p></p><ul class="system-tech-stack" aria-label="Project tech stack"></ul>';
  description.querySelector('.system-kicker').append(motion);
  const dock=document.createElement('div');dock.className='system-dock';dock.setAttribute('aria-label','Other project systems');
  const live=document.createElement('span');live.className='system-announcement';live.setAttribute('aria-live','polite');
  const edges=[0,1].map(i=>{
    const button=document.createElement('button');button.type='button';button.className=`mini-system mini-system-${i}`;
    button.innerHTML='<span class="mini-map" aria-hidden="true"><i class="mini-track"></i><i class="mini-track"></i><i class="mini-track"></i><span class="mini-sun"><img alt=""></span><span class="mini-planet"><img alt=""></span><span class="mini-planet"><img alt=""></span><span class="mini-planet"><img alt=""></span></span><span class="mini-name"></span>';
    button.addEventListener('click',()=>switchSystem(i));return button;
  });
  dock.append(...edges);scene.append(panel,dock);stage.replaceChildren(description,scene,live);
  const planets=[0,1,2].map(i=>{
    const p=document.createElement('button');p.type='button';p.className='system-planet';p.innerHTML='<img alt="" draggable="false"><span></span>';
    p.addEventListener('click',()=>selectProject(systems[active].slots[i],true));panel.querySelector('.system-planets').appendChild(p);return p;
  });
  const tracks=planets.map(()=>{const r=document.createElement('i');panel.querySelector('.system-tracks').appendChild(r);return r;});
  sun.addEventListener('click',()=>{if(!projectMove&&!systemMove)showProjectDetail(projects[systems[active].current][0]);});
  function renderContent() {
    const s=systems[active],p=projects[s.current];
    panel.dataset.system=String(active);sun.dataset.project=p[0];sun.setAttribute('aria-label',`Open ${p[1]} project`);
    setProjectMedia(sun,s.current);sun.querySelector('img').alt=p[1];
    description.querySelector('.system-category').textContent=s.name;
    description.querySelector('h2').textContent=p[1];description.querySelector('p').textContent=p[2];
    const stack=description.querySelector('.system-tech-stack');stack.replaceChildren();
    const tags=TIMELINE_ITEMS.find(item=>item.id===p[0])?.tags||[];
    tags.forEach(tag=>{
      const chip=document.createElement('li');const logo=tag==='3D Printing'?'src/assets/images/logos/bambu-logo.png':TAG_ICONS[tag];
      if(logo){const img=document.createElement('img');img.src=logo;img.alt='';chip.append(img);}
      chip.append(document.createTextNode(tag));stack.append(chip);
    });
    s.slots.forEach((key,i)=>{const b=planets[i];b.dataset.project=key;setProjectMedia(b,key);b.querySelector('span').textContent=projects[key][1];b.setAttribute('aria-label',`Show ${projects[key][1]} in the center`);});
    edges.forEach((button,i)=>{const other=systems[background[i]];button.dataset.system=String(background[i]);button.setAttribute('aria-label',`Explore ${other.name}: ${other.keys.map(k=>projects[k][1]).join(', ')}`);button.querySelector('.mini-name').textContent=other.name;setProjectMedia(button.querySelector('.mini-sun'),other.current);button.querySelectorAll('.mini-planet').forEach((planet,j)=>setProjectMedia(planet,other.slots[j]));});
  }
  function layout() {
    const w=field.clientWidth;if(!w)return;
    if(systemMove&&Math.abs(w-geometry.w)>1)completeSystem();
    const sunSize=w*.43,planetSize=w<230?28:w<330?32:w<430?40:Math.min(96,Math.max(54,w*.085));
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
    if(m.manual){live.textContent=`${projects[s.current][1]} selected. Open the central image to view the project.`;restoreFocus(m.origin,sun);}
  }
  function selectProject(key,manual=false) {
    if(projectMove||systemMove||key===systems[active].current)return;
    const slot=systems[active].slots.indexOf(key);if(slot<0)return;
    const clone=project=>{const d=document.createElement('div');d.className='system-transfer';d.setAttribute('aria-hidden','true');const img=document.createElement('img');img.alt='';d.appendChild(img);setProjectMedia(d,project);field.appendChild(d);return d;};
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
    const rect=scene.getBoundingClientRect(),main=field.getBoundingClientRect();
    const mini=edges[edge].querySelector('.mini-map').getBoundingClientRect();
    const miniPlanet=edges[edge].querySelector('.mini-planet').getBoundingClientRect().width;
    const other=edges[1-edge].querySelector('.mini-map').getBoundingClientRect();
    const a={x:main.x-rect.x+geometry.cx,y:main.y-rect.y+geometry.cy};
    const b={x:mini.x-rect.x+mini.width/2,y:mini.y-rect.y+mini.height/2};
    const dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);
    const m=systemMove={edge,old:active,target:background[edge],origin:document.activeElement,elapsed:0,a,b,dx,dy,nx:-dy/distance,ny:dx/distance,miniSize:mini.width,miniPlanet,outgoing:createFlight(systems[active]),incoming:createFlight(systems[background[edge]])};
    // Size the two curved lanes to keep the complete moving systems apart.
    let bend=mini.width*.4;
    for(let i=1;i<100;i++){
      const t=i/100,u=travelProgress(t),sizes=flightSizes(m,t);
      const required=flightRadius(sizes.outgoing)+flightRadius(sizes.incoming)+8;
      const horizontal=distance*(1-2*u);
      bend=Math.max(bend,Math.sqrt(Math.max(0,required*required-horizontal*horizontal))/(2*Math.sin(Math.PI*u)));
    }
    m.bend=bend+.5;
    const obstacle={x:other.x-rect.x+other.width/2,y:other.y-rect.y+other.height/2,r:other.width*.43+edges[1-edge].querySelector('.mini-planet').getBoundingClientRect().width/2};
    const clearance=sign=>{
      let minimum=Infinity;
      for(let i=0;i<=100;i++){
        const t=i/100,positions=flightPositions(m,t,sign),sizes=flightSizes(m,t);
        ['outgoing','incoming'].forEach(key=>{const p=positions[key];minimum=Math.min(minimum,Math.hypot(p.x-obstacle.x,p.y-obstacle.y)-flightRadius(sizes[key])-obstacle.r);});
      }
      return minimum;
    };
    m.direction=clearance(1)>clearance(-1)?1:-1;
    field.style.visibility='hidden';edges[edge].querySelector('.mini-map').style.visibility='hidden';stage.setAttribute('aria-busy','true');lock(true);
    if(paused||reduced.matches)completeSystem();else drawSystem();
  }
  function createFlight(system) {
    const node=document.createElement('div');node.className='system-flight';node.setAttribute('aria-hidden','true');
    node.innerHTML='<i></i><i></i><i></i><span class="flight-sun"><img alt=""><span>View project ↗</span></span><span class="flight-planet"><img alt=""></span><span class="flight-planet"><img alt=""></span><span class="flight-planet"><img alt=""></span>';
    setProjectMedia(node.querySelector('.flight-sun'),system.current);node.querySelectorAll('.flight-planet').forEach((planet,i)=>setProjectMedia(planet,system.slots[i]));scene.append(node);return node;
  }
  function flightSizes(m,t) {
    const range=geometry.w-m.miniSize;
    return {outgoing:m.miniSize+range*(1-ease(t/.5)),incoming:m.miniSize+range*ease((t-.5)/.5)};
  }
  function travelProgress(t) {return (1-Math.cos(Math.PI*t))/2;}
  function flightPlanetSize(size) {
    const m=systemMove;return m.miniPlanet+(geometry.planet-m.miniPlanet)*(size-m.miniSize)/(geometry.w-m.miniSize);
  }
  function flightRadius(size) {return size*.43+flightPlanetSize(size)/2;}
  function flightPositions(m,t,direction=m.direction) {
    const u=travelProgress(t),bend=Math.sin(Math.PI*u)*m.bend*direction;
    return {
      outgoing:{x:m.a.x+m.dx*u+m.nx*bend,y:m.a.y+m.dy*u+m.ny*bend},
      incoming:{x:m.b.x-m.dx*u-m.nx*bend,y:m.b.y-m.dy*u-m.ny*bend}
    };
  }
  function drawFlight(node,system,position,size) {
    node.style.width=node.style.height=`${size}px`;node.style.transform=`translate3d(${position.x}px,${position.y}px,0) translate(-50%,-50%)`;
    node.querySelectorAll(':scope>i').forEach((ring,i)=>{ring.style.width=ring.style.height=`${size*(.68+i*.09)}px`;});
    const center=node.querySelector('.flight-sun');center.style.width=center.style.height=`${size*.43}px`;
    center.style.setProperty('--media-blur',`${Math.max(2,9*size/geometry.w)}px`);
    center.querySelector('span').style.opacity=String(Math.max(0,(size/geometry.w-.7)/.3));
    node.querySelectorAll('.flight-planet').forEach((p,i)=>{
      const angle=system.angle+i*Math.PI*2/3,radius=size*(.34+i*.045);
      p.style.width=p.style.height=`${flightPlanetSize(size)}px`;
      p.style.transform=`translate(${Math.cos(angle)*radius}px,${Math.sin(angle)*radius}px) translate(-50%,-50%)`;
    });
  }
  function completeSystem() {
    if(!systemMove)return;const m=systemMove;
    background[m.edge]=m.old;active=m.target;projectElapsed=0;
    m.outgoing.remove();m.incoming.remove();field.style.visibility='';edges[m.edge].querySelector('.mini-map').style.visibility='';
    systemMove=null;stage.removeAttribute('aria-busy');renderContent();lock(false);
    live.textContent=`${systems[active].name} selected. ${projects[systems[active].current][1]} is in the center.`;restoreFocus(m.origin,sun);
  }
  function drawSystem() {
    const m=systemMove;if(!m)return;
    const t=Math.min(m.elapsed/1900,1),positions=flightPositions(m,t),sizes=flightSizes(m,t);
    drawFlight(m.outgoing,systems[m.old],positions.outgoing,sizes.outgoing);drawFlight(m.incoming,systems[m.target],positions.incoming,sizes.incoming);
    if(t===1)completeSystem();
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
    edges.forEach((b,i)=>b.querySelectorAll('.mini-planet').forEach((planet,j)=>{const a=systems[background[i]].angle+j*Math.PI*2/3;planet.style.transform=`translate(${Math.cos(a)*(34+j*4.5)}cqw,${Math.sin(a)*(34+j*4.5)}cqw) translate(-50%,-50%)`;}));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
