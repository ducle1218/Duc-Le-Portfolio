import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Decorative airflow visualization. The analytic field approximates deflection
// and wake motion; it is not a CFD solution or aerodynamic performance result.
// The entry module only defines this function. The lightweight loader calls it
// after the visible scene approaches the viewport and the page has painted.
export function startWindTunnel() {
const layer = document.querySelector('.portfolio-atmosphere');
if (!layer) return null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-10, 10, 4, -4, .1, 100);
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.domElement.setAttribute('aria-hidden', 'true');
renderer.domElement.dataset.airflow = 'true';
layer.replaceChildren(renderer.domElement);
const ink = new THREE.Color();
const models = new Map();
const flows = new Map();
let activePage = '', activeGroup = null, flowGroup = null, flowMaterials = [];
let frame = 0, elapsed = 0, lastTime = 0, onscreen = true, disposed = false;
let userPaused = reducedMotion.matches;
let layoutFrame = 0, layoutSignature = '';
let layoutVersion = 0;
const toggle = document.createElement('button');
toggle.type = 'button';
toggle.id = 'airflow-motion';
toggle.className = 'airflow-motion';
document.body.append(toggle);

const contourMaterial = new THREE.ShaderMaterial({
  transparent: true, depthWrite: true, side: THREE.FrontSide,
  uniforms: {ink: {value: ink}, spacing: {value: 6}},
  vertexShader: `varying vec3 vPosition; varying vec3 vNormal;
    void main(){ vec4 world=modelMatrix*vec4(position,1.0);vPosition=world.xyz;
      vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world; }`,
  fragmentShader: `uniform vec3 ink;uniform float spacing;varying vec3 vPosition;varying vec3 vNormal;
    void main(){float q=vPosition.x*spacing;float d=abs(fract(q)-0.5);
      float aa=max(fwidth(q),0.003);float line=1.0-smoothstep(0.014,0.014+aa,d);
      float light=0.24+0.76*max(0.0,dot(normalize(vNormal),normalize(vec3(-0.4,1.0,0.6))));
      float alpha=0.08+0.16*light+line*0.36;
      gl_FragColor=vec4(ink,alpha); }`
});
const edgeMaterial = new THREE.LineBasicMaterial({color: ink, transparent: true, opacity: .26, depthWrite: false});

function mesh(geometry, group, edges = true) {
  geometry.computeVertexNormals();
  const part = new THREE.Mesh(geometry, contourMaterial);
  part.renderOrder = 1;
  group.add(part);
  if (edges) {
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 38), edgeMaterial);
    outline.renderOrder = 2;
    part.add(outline);
  }
  return part;
}

function loft(sections, sides = 48, shape = 1) {
  const vertices = [], indices = [];
  sections.forEach(([x, centerY, height, breadth], i) => {
    for (let j = 0; j < sides; j++) {
      const a = j / sides * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      vertices.push(x, centerY + Math.sign(c) * Math.abs(c) ** shape * height,
        Math.sign(s) * Math.abs(s) ** shape * breadth);
      if (i < sections.length - 1) {
        const p = i * sides + j, q = i * sides + (j + 1) % sides;
        indices.push(p, q, p + sides, q, q + sides, p + sides);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  return geometry;
}

function plate(points, thickness, group) {
  const n = points.length, vertices = [], indices = [];
  for (const offset of [-thickness / 2, thickness / 2]) {
    for (const p of points) vertices.push(p[0], p[1] + offset, p[2]);
  }
  for (let i = 1; i < n - 1; i++) indices.push(0, i + 1, i, n, n + i, n + i + 1);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(i, j, i + n, j, j + n, i + n);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  const part = mesh(geometry, group);
  // Thin aerodynamic surfaces must remain visible from both sides.
  const material = contourMaterial.clone(); material.side = THREE.DoubleSide;
  material.uniforms.ink.value = ink; part.material = material;
  return part;
}

function makeAircraft() {
  const group = new THREE.Group();
  // Original simplified F-35 silhouette: swept trapezoidal wings, single
  // exhaust, shoulder inlets, bubble canopy and two outward-canted fins.
  mesh(loft([
    [-3.65,.03,.008,.008],[-3.25,.04,.12,.16],[-2.65,.06,.22,.28],
    [-2.0,.06,.29,.38],[-1.3,.02,.34,.49],[-.5,0,.37,.62],
    [.4,0,.35,.62],[1.25,0,.32,.50],[2.0,.01,.28,.36],
    [2.8,.02,.23,.26],[3.04,.02,.22,.24]
  ], 48, .72), group, false);
  const canopy = mesh(loft([[-2.27,.25,.015,.02],[-2.05,.39,.21,.25],[-1.6,.42,.31,.28],
    [-1.12,.37,.23,.26],[-.7,.30,.018,.04]], 36), group, false);
  canopy.name = 'canopy';
  for (const side of [-1, 1]) {
    const points = p => p.map(([x,y,z]) => [x,y,z*side]);
    plate(points([[-1.15,-.05,.40],[.38,-.02,2.37],[1.08,-.04,2.07],[1.44,-.06,.45]]), .07, group);
    plate(points([[1.27,.09,.39],[2.0,.08,1.5],[2.87,.07,1.27],[2.66,.06,.31]]), .045, group);
    plate(points([[1.23,.23,.46],[1.78,1.14,.91],[2.55,.89,1.08],[2.75,.22,.45]]), .035, group);
    plate(points([[-1.73,.10,.37],[-1.4,.26,.67],[-.30,.17,.74],[.30,-.16,.51],[-1.64,-.20,.47]]), .035, group);
    const inlet = mesh(new THREE.BoxGeometry(.12,.29,.21), group);
    inlet.position.set(-1.51,-.02,side*.49); inlet.rotation.y = -side*.18;
  }
  const nozzle = mesh(new THREE.CylinderGeometry(.22,.25,.26,40,1,true), group, false);
  nozzle.rotation.z = Math.PI/2; nozzle.position.set(3.01,.02,0);
  const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
    Array.from({length:64},(_,i)=>new THREE.Vector3(3.15,.02+.22*Math.cos(i*Math.PI/32),.22*Math.sin(i*Math.PI/32)))),edgeMaterial);
  group.add(rim);
  return group;
}

async function makeCow() {
  const gltf = await new GLTFLoader().loadAsync(new URL('../assets/models/background-cow.glb', import.meta.url).href);
  const group = new THREE.Group();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(part => {
    if (!part.isMesh || /coat|patch/i.test(part.name)) return;
    const geometry = part.geometry.clone().applyMatrix4(part.matrixWorld);
    geometry.scale(2.25,2.25,2.25); geometry.translate(.28,-1.65,0);
    mesh(geometry,group,false);
  });
  return group;
}

function obstacles(kind, shift) {
  const list = kind === 'home' ? [
    [[-.25,0,0],[3.25,.45,.7]], [[-1.6,.48,0],[.85,.39,.32]],
    [[.38,-.02,-1.28],[1.12,.15,1.18]],[[.38,-.02,1.28],[1.12,.15,1.18]],
    [[2,.17,-.91],[.92,.23,.73]],[[2,.17,.91],[.92,.23,.73]],
    [[2.02,.70,-.75],[.60,.60,.32]],[[2.02,.70,.75],[.60,.60,.32]]
  ] : [
    [[.15,.24,0],[1.95,.95,.82]],[[-1.67,.68,0],[.70,.78,.57]],
    [[-2.26,.32,0],[.50,.36,.48]],
    [[-1.05,-.98,-.47],[.24,.75,.23]],[[-1.05,-.98,.47],[.24,.75,.23]],
    [[1.35,-.98,-.49],[.25,.75,.25]],[[1.35,-.98,.49],[.25,.75,.25]]
  ];
  return list.map(([c,r])=>({c:[c[0]+shift,c[1],c[2]],r}));
}

async function streamlines(kind, mobile) {
  // Build once in local coordinates; resizing only translates the cached group.
  const shift = 0;
  const blockers = obstacles(kind,shift);
  const group = new THREE.Group();
  const positions=[], travel=[], phases=[], speeds=[], fades=[];
  function velocity(p, result) {
    result[0]=1;result[1]=0;result[2]=0;
    for (const {c,r} of blockers) {
      const qx=(p[0]-c[0])/r[0],qy=(p[1]-c[1])/r[1],qz=(p[2]-c[2])/r[2];
      const rr = Math.max(1.04,qx*qx+qy*qy+qz*qz);
      const dipole = Math.min(.8,1/(rr*Math.sqrt(rr)));
      result[0] += .48*dipole*(1-3*qx*qx/rr);
      result[1] -= 1.44*dipole*qx*qy/rr*r[1]/r[0];
      result[2] -= 1.44*dipole*qx*qz/rr*r[2]/r[0];
    }
    const wake = p[0]-shift-(kind==='home'?1.4:1.2);
    if (wake>0) {
      const span=kind==='home'?2.12:.65;
      const attenuation=.18*Math.exp(-wake/6);
      for (let side=-1;side<=1;side+=2) {
        const dy=p[1]+.1, dz=p[2]-side*span;
        const strength=side*attenuation*Math.exp(-(dy*dy+dz*dz)/.65);
        result[1]-=dz*strength; result[2]+=dy*strength;
      }
    }
    result[0]=Math.max(.32,result[0]);
    return result;
  }
  function keepOutside(p, sign) {
    for (const {c,r} of blockers) {
      const x=(p[0]-c[0])/r[0];
      if(Math.abs(x)>=1.06) continue;
      let y=(p[1]-c[1])/r[1], z=(p[2]-c[2])/r[2];
      const yz=Math.hypot(y,z), required=Math.sqrt(Math.max(0,1.13-x*x));
      if(yz<required) {
        if(yz<.001) {y=.05;z=sign*.05;}
        const factor=required/Math.hypot(y,z);
        p[1]=c[1]+y*factor*r[1];p[2]=c[2]+z*factor*r[2];
      }
    }
  }
  const rows=3, depths=mobile?7:13;
  let batchStarted=performance.now();
  for(let row=0;row<rows;row++) for(let depth=0;depth<depths;depth++) {
    const id=row*depths+depth;
    // Keep input and painting responsive while integrating the decorative field.
    if(performance.now()-batchStarted>6) {
      if(globalThis.scheduler?.yield)await scheduler.yield();
      else await new Promise(resolve=>setTimeout(resolve,0));
      batchStarted=performance.now();
    }
    const p=[-10+shift,-.65+row/(rows-1)*1.8,-3.0+depth/(depths-1)*6.0];
    const points=[],first=[0,0,0],mid=[0,0,0],v=[0,0,0];
    for(let step=0;step<420&&p[0]<10+shift;step++) {
      points.push(p[0],p[1],p[2]);
      velocity(p,first);
      for(let axis=0;axis<3;axis++)mid[axis]=p[axis]+first[axis]*.045;
      velocity(mid,v);
      for(let axis=0;axis<3;axis++)p[axis]+=v[axis]*.09;
      keepOutside(p,id%2?1:-1);
    }
    const pointCount=points.length/3;
    const phase=(id*.61803398875)%1,speed=.045+((id*.41421356)%1)*.027;
    for(let i=0;i<pointCount-1;i++)for(let j=i;j<=i+1;j++) {
      positions.push(points[j*3],points[j*3+1],points[j*3+2]);travel.push(j/pointCount);phases.push(phase);speeds.push(speed);
      const end=Math.min(j/25,(pointCount-1-j)/30,1);fades.push(Math.max(0,end));
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('aTravel',new THREE.Float32BufferAttribute(travel,1));
  geometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));
  geometry.setAttribute('aSpeed',new THREE.Float32BufferAttribute(speeds,1));
  geometry.setAttribute('aFade',new THREE.Float32BufferAttribute(fades,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{ink:{value:ink},time:{value:elapsed}},
    vertexShader:`attribute float aTravel,aPhase,aSpeed,aFade;varying float vTravel,vPhase,vSpeed,vFade;
      void main(){vTravel=aTravel;vPhase=aPhase;vSpeed=aSpeed;vFade=aFade;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform vec3 ink;uniform float time;varying float vTravel,vPhase,vSpeed,vFade;
      void main(){float phase=fract(vTravel-time*vSpeed+vPhase);
        float pulse=pow(max(0.0,1.0-abs(phase-.5)*2.0),6.0);
        gl_FragColor=vec4(ink,(.035+.27*pulse)*vFade);}`});
  const lines=new THREE.LineSegments(geometry,material);lines.renderOrder=3;group.add(lines);
  return group;
}

function updateTheme() {
  ink.set(document.documentElement.classList.contains('dark')?0xa5b4c2:0x354553);
  edgeMaterial.color.copy(ink);
  draw();
}
function draw() { if(activeGroup&&!disposed) renderer.render(scene,camera); }
function animate(now) {
  frame=0;
  if(!onscreen||document.hidden||userPaused||!activeGroup)return;
  if(lastTime&&now-lastTime<32){frame=requestAnimationFrame(animate);return;}
  if(lastTime)elapsed+=Math.min(.1,(now-lastTime)/1000);
  lastTime=now;
  for(const material of flowMaterials)material.uniforms.time.value=elapsed;
  draw();frame=requestAnimationFrame(animate);
}
function syncMotion() {
  toggle.textContent=userPaused?'▶':'Ⅱ';
  toggle.setAttribute('aria-label',userPaused?'Play airflow animation':'Pause airflow animation');
  toggle.title=userPaused?'Play airflow animation':'Pause airflow animation';
  toggle.setAttribute('aria-pressed',String(userPaused));
  if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;
  if(onscreen&&!document.hidden&&!userPaused&&activeGroup)frame=requestAnimationFrame(animate);
  else draw();
}
toggle.addEventListener('click',()=>{userPaused=!userPaused;syncMotion();});
reducedMotion.addEventListener('change',event=>{userPaused=event.matches;syncMotion();});
document.addEventListener('visibilitychange',syncMotion);
new IntersectionObserver(entries=>{onscreen=entries[0].isIntersecting;syncMotion();},
  {rootMargin:'100px'}).observe(renderer.domElement);

function clearFlow() {
  if(!flowGroup)return;
  scene.remove(flowGroup);
  // There are only four small page/viewport variants; reuse them on navigation.
  flowGroup=null;flowMaterials=[];
}
async function layout() {
  layoutFrame=0;
  const page=document.body.dataset.atmospherePage||'home';
  const width=document.body.clientWidth,mobile=width<650;
  const enabled=page==='home'||page==='project';
  renderer.domElement.hidden=!enabled;toggle.hidden=!enabled;
  if(!enabled){layoutVersion++;if(activeGroup)scene.remove(activeGroup);activeGroup=null;clearFlow();activePage=page;syncMotion();return;}
  const stage=page==='home'?document.querySelector('.discipline-strip'):document.querySelector('.project-page-heading');
  if(!stage)return;
  const bounds=stage.getBoundingClientRect();
  // A scene that has never been seen should not load its model or build flows.
  if(activePage!==page&&(bounds.top>innerHeight+180||bounds.bottom<-180)) {
    layoutVersion++;
    if(activeGroup)scene.remove(activeGroup);
    activeGroup=null;clearFlow();renderer.domElement.hidden=true;toggle.hidden=true;syncMotion();return;
  }
  const top=page==='home'?bounds.top+scrollY:(mobile?bounds.bottom+scrollY-5:bounds.top+scrollY-35);
  const height=page==='home'?bounds.height:(mobile?280:440);
  const signature=[page,width,Math.round(top),Math.round(height)].join(':');
  if(signature===layoutSignature&&activeGroup)return;
  const version=++layoutVersion;
  layoutSignature=signature;
  renderer.domElement.style.top=top+'px';renderer.domElement.style.left='0';
  renderer.setSize(width,height,false);renderer.domElement.style.width=width+'px';renderer.domElement.style.height=height+'px';
  toggle.style.top=(top+height-36)+'px';toggle.style.right='5vw';
  const viewHeight=mobile?6.8:(page==='home'?5.4:7.0),aspect=width/height;
  camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;
  camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
  camera.position.set(page==='home'?-2.8:-3.6,page==='home'?6.5:3.4,10);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  if(activeGroup)scene.remove(activeGroup);activeGroup=null;clearFlow();
  if(!models.has(page))models.set(page,page==='home'?Promise.resolve(makeAircraft()):makeCow());
  let model;
  try { model=await models.get(page); }
  catch(error) {
    models.delete(page);
    if(version===layoutVersion){renderer.domElement.hidden=true;toggle.hidden=true;layoutSignature='';syncMotion();}
    console.warn('Decorative airflow model unavailable:',error);
    return;
  }
  if(version!==layoutVersion||(document.body.dataset.atmospherePage||'home')!==page)return;
  activeGroup=model;activePage=page;
  const shift=page==='project'&&!mobile?viewHeight*aspect*.22:0;
  model.position.set(shift,0,0);
  model.scale.setScalar(1);
  scene.add(model);
  layer.dataset.page=page;renderer.domElement.dataset.subject=page==='home'?'f35':'cow';
  updateTheme();syncMotion();
  const flowKey=page+':'+mobile;
  if(!flows.has(flowKey))flows.set(flowKey,streamlines(page,mobile));
  const nextFlow=await flows.get(flowKey);
  if(version!==layoutVersion||(document.body.dataset.atmospherePage||'home')!==page)return;
  flowGroup=nextFlow;flowGroup.position.x=shift;
  flowMaterials=[];
  flowGroup.traverse(item=>{if(item.material?.uniforms?.time){item.material.uniforms.time.value=elapsed;flowMaterials.push(item.material);}});
  scene.add(flowGroup);draw();
}
function schedule(){if(!layoutFrame)layoutFrame=requestAnimationFrame(layout);}
new ResizeObserver(schedule).observe(document.body);
new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['data-atmosphere-page']});
new MutationObserver(updateTheme).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
const stageObserver=new IntersectionObserver(schedule,{rootMargin:'180px'});
for(const stage of document.querySelectorAll('.discipline-strip,.project-page-heading'))stageObserver.observe(stage);
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('pagehide',()=>{disposed=true;if(frame)cancelAnimationFrame(frame);});
window.addEventListener('pageshow',()=>{disposed=false;syncMotion();});
layout();
return {refresh:schedule};
}
