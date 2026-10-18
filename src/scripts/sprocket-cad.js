import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export async function createSprocketViewer(stage, url) {
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
  const canvas = renderer.domElement;
  canvas.className = 'sp-cad-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Sprocket 3D assembly. Drag to rotate, right-drag to pan, scroll to zoom. Arrow keys rotate; plus and minus zoom.');
  canvas.style.touchAction = 'pan-y';
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#fafafa');
  const camera = new THREE.OrthographicCamera(-1.5,1.5,1.5,-1.5,.01,30);
  const controls = new OrbitControls(camera, canvas);
  canvas.style.touchAction = 'pan-y';
  controls.enableDamping = true;
  controls.dampingFactor = .15;
  controls.minZoom = .4;
  controls.maxZoom = 7;
  controls.zoomSpeed = .7;
  controls.rotateSpeed = .7;
  controls.screenSpacePanning = true;
  scene.add(new THREE.HemisphereLight(0xffffff,0x626975,.65));
  const key = new THREE.DirectionalLight(0xffffff,2.1);
  key.position.set(-3,5,6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.1,far:15});
  key.shadow.bias = -.00015;
  key.shadow.normalBias = .006;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe8efff,.35);
  fill.position.set(4,1,-3);scene.add(fill);
  const composer = new EffectComposer(renderer);
  const ao = new SSAOPass(scene,camera,512,512,16);
  ao.kernelRadius = 10;
  ao.minDistance = .0005;
  ao.maxDistance = .025;
  composer.addPass(new RenderPass(scene,camera));
  composer.addPass(ao);
  composer.addPass(new OutputPass());
  let frame = 0, disposed = false, loaded = false;
  const render = () => {
    frame=0;
    if(disposed || !stage.isConnected || stage.hidden || document.hidden || !stage.getClientRects().length)return;
    controls.update();
    composer.render();
  };
  const invalidate = () => { if(!disposed && !frame)frame=requestAnimationFrame(render); };
  controls.addEventListener('change',invalidate);
  const resize = () => {
    const {width,height}=stage.getBoundingClientRect();if(!width || !height)return;
    renderer.setSize(width,height,false);composer.setSize(width,height);
    const aspect=width/height;camera.left=-1.5*aspect;camera.right=1.5*aspect;camera.updateProjectionMatrix();invalidate();
  };
  const observer = new ResizeObserver(resize);observer.observe(stage);
  const visibility = () => invalidate();document.addEventListener('visibilitychange',visibility);
  const intersections = new IntersectionObserver(invalidate);intersections.observe(stage);
  const geometries = new Set(), materials = new Set(), edges = new Map();
  const edgeMaterial = new THREE.LineBasicMaterial({color:0x15191d,transparent:true,opacity:.8,depthWrite:false});materials.add(edgeMaterial);
  const reset = () => {
    controls.target.set(0,0,0);camera.position.set(3.3,2.7,4.8);camera.zoom=1;camera.updateProjectionMatrix();controls.update();invalidate();
  };
  const keyboard = event => {
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key))return;
    event.preventDefault();
    if(['+','=','-'].includes(event.key)){camera.zoom=THREE.MathUtils.clamp(camera.zoom*(event.key==='-'?.9:1.1),.4,7);camera.updateProjectionMatrix();}
    else {
      const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if(event.key==='ArrowLeft')spherical.theta-=.12;if(event.key==='ArrowRight')spherical.theta+=.12;
      if(event.key==='ArrowUp')spherical.phi-=.12;if(event.key==='ArrowDown')spherical.phi+=.12;
      spherical.makeSafe();camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    }
    controls.update();invalidate();
  };
  canvas.addEventListener('keydown',keyboard);
  const dispose = () => {
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersections.disconnect();removal.disconnect();
    document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('keydown',keyboard);controls.dispose();
    for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
    key.shadow.map?.dispose();for(const pass of composer.passes)pass.dispose?.();composer.dispose();renderer.dispose();canvas.remove();
  };
  const removal = new MutationObserver(()=>{if(!stage.isConnected)dispose();});removal.observe(document.body,{childList:true,subtree:true});
  const draco=new DRACOLoader().setDecoderPath(new URL('src/vendor/model-viewer/draco/',document.baseURI).href);
  try {
    const gltf=await new GLTFLoader().setDRACOLoader(draco).loadAsync(url);
    if(disposed)return {dispose,reset,invalidate,loaded:false};
    const model=gltf.scene;
    // Correct the supplied export's right gray side plate, using the left side's
    // 4.28488 mm clearance to the black panel. Keep this occurrence-only: its
    // mesh is shared by both sides. Guard against applying it to a future export.
    model.traverse(object => {
      if(gltf.parser.associations.get(object)?.nodes === 931 &&
         Math.abs(object.position.x - .0642462968826294) < 1e-8 &&
         Math.abs(object.position.y - .2916525602340698) < 1e-8 &&
         Math.abs(object.position.z + .061891477555036545) < 1e-8) {
        object.position.x -= .0065427499741680;
      }
    });
    const meshes=[];model.traverse(object=>{if(object.isMesh)meshes.push(object);});
    const mapped=new Map();
    for(let i=0;i<meshes.length;i++){
      const mesh=meshes[i];geometries.add(mesh.geometry);
      const convert=source=>{
        if(!mapped.has(source)){
          const material=new THREE.MeshPhongMaterial({color:source.color.clone(),map:source.map,shininess:35,specular:0x333333,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
          mapped.set(source,material);materials.add(source);materials.add(material);
        }return mapped.get(source);
      };
      mesh.material=Array.isArray(mesh.material)?mesh.material.map(convert):convert(mesh.material);
      mesh.castShadow=true;mesh.receiveShadow=true;
      if(!edges.has(mesh.geometry)){
        const edge=new THREE.EdgesGeometry(mesh.geometry,28);edges.set(mesh.geometry,edge);geometries.add(edge);
        // Yield while processing a new shared part so the loading message remains responsive.
        await new Promise(resolve=>setTimeout(resolve,0));
        if(disposed)return {dispose,reset,invalidate,loaded:false};
      }
      mesh.add(new THREE.LineSegments(edges.get(mesh.geometry),edgeMaterial));
    }
    const bounds=new THREE.Box3().setFromObject(model);const center=bounds.getCenter(new THREE.Vector3());const size=bounds.getSize(new THREE.Vector3());
    const root=new THREE.Group();root.add(model);model.position.sub(center);root.scale.setScalar(2.25/Math.max(size.x,size.y,size.z));scene.add(root);
    stage.append(canvas);loaded=true;reset();resize();renderer.shadowMap.needsUpdate=true;invalidate();
    return {dispose,reset,invalidate,get loaded(){return loaded;}};
  } catch(error){dispose();throw error;} finally {draco.dispose();}
}

