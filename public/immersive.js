import * as THREE from './vendor/three.module.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {SVGLoader} from './vendor/SVGLoader.js';
import {immersivePose,smooth} from './immersive-path.js';

const host=document.querySelector('#immersive-canvas'),journey=document.querySelector('.journey'),stage=document.querySelector('.stage'),loading=document.querySelector('.loading');
const opening=document.querySelector('.opening'),approach=document.querySelector('.approach'),reveal=document.querySelector('.reveal'),bar=document.querySelector('.progress>span');
const motion=matchMedia('(prefers-reduced-motion:reduce)'),forced=new URLSearchParams(location.search).get('motion')==='full';
let reduced=motion.matches&&!forced,renderer=null,ready=false,camera,scene,portal,orbit,brand,stars,environment,letters=[],satellites=[];
let frame=0,visible=true,lost=false,current=0,target=0,last=0,time=0,frames=0,width=0,height=0,start=0,range=1;
const geometries=[];
function requestFrame(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(update);}
function readScroll(){target=Math.max(0,Math.min(1,(scrollY-start)/range));if(visible)requestFrame();}
function measure(){start=journey.offsetTop;range=Math.max(1,journey.offsetHeight-stage.offsetHeight);readScroll();requestFrame();}
function copyState(element,opacity){element.style.opacity=String(opacity);element.style.visibility=opacity<.001?'hidden':'visible';element.inert=opacity<.01;element.setAttribute('aria-hidden',String(opacity<.01));}
function update(now){frame=0;const dt=last?Math.min((now-last)/1000,.1):1/60;last=now;current=reduced?target:current+(target-current)*(1-Math.exp(-dt/.070));if(Math.abs(current-target)<.0001)current=target;
 const p=current;copyState(opening,1-smooth(.05,.18,p));copyState(approach,smooth(.18,.23,p)*(1-smooth(.34,.40,p)));copyState(reveal,smooth(.76,.85,p));bar.style.transform=`scaleX(${p})`;
 if(ready&&renderer&&!lost){if(!reduced)time+=dt;render(reduced?1:p,reduced?0:time);}
 document.body.dataset.progress=p.toFixed(3);document.body.dataset.motion=reduced?'reduced':'full';
 if(!reduced&&((ready&&renderer&&!lost)||p!==target))requestFrame();else last=0;
}
function resize(){const w=host.clientWidth,h=host.clientHeight;if(w===width&&h===height)return;width=w;height=h;camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
function render(p,clock){resize();const pose=immersivePose(p),aspect=camera.aspect,portalFactor=Math.min(1,aspect*1.7)*(aspect<.9&&height<700?THREE.MathUtils.lerp(.72,1,smooth(0,.30,p)):1),startFactor=Math.max(0,Math.min(1,(aspect-.7)/.7)),horizontal=THREE.MathUtils.lerp(startFactor,portalFactor,smooth(.15,.43,p));
 portal.scale.set(.055*portalFactor,-.055*portalFactor,.055*portalFactor);portal.rotation.set(0,-.10,.015);portal.visible=p<.59;
 orbit.scale.setScalar(2.65*portalFactor);orbit.rotation.set(.95,-.18,-.28+p*.2);orbit.visible=p<.60;
 satellites.forEach((point,index)=>{const angle=index*Math.PI*2/3+clock*.13+p*.5;point.position.set(Math.cos(angle),Math.sin(angle),0);});
 brand.scale.setScalar(Math.min(1,aspect*.72));brand.position.z=-8;
 letters.forEach((letter,index)=>{const u=smooth(.35+(4-index)*.035,.54+(4-index)*.035,p);letter.group.visible=u>.001;letter.group.position.set(letter.x+(1-u)*.15,letter.y+(1-u)*.15,-(1-u)*(1.5+(4-index)*.3));letter.group.rotation.y=(1-u)*.12;letter.materials.forEach(m=>{m.opacity=u;m.depthWrite=u>.995;});});
 const mobileAim=aspect<.9?-(height<700?1.8:1.1)*(1-smooth(0,.30,p)):0;
 camera.position.set(pose.x*horizontal,pose.y*portalFactor,pose.z);camera.lookAt(pose.aimX*horizontal,(pose.aimY+mobileAim)*portalFactor,pose.aimZ);camera.updateMatrixWorld();renderer.render(scene,camera);frames++;
 renderer.domElement.dataset.cameraZ=pose.z.toFixed(3);renderer.domElement.dataset.frames=String(frames);renderer.domElement.dataset.reveal=pose.reveal.toFixed(3);renderer.domElement.dataset.phase=p<.18?'outside':p<.48?'approach':p<.58?'crossing':p<.84?'reveal':'brand';
}
document.querySelector('#enter').addEventListener('click',()=>scrollTo({top:start+range*.64,behavior:reduced?'instant':'smooth'}));
addEventListener('scroll',readScroll,{passive:true});addEventListener('resize',measure,{passive:true});document.fonts.ready.then(measure);
const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;readScroll();}else{if(frame)cancelAnimationFrame(frame);frame=0;last=0;}},{threshold:0});observer.observe(journey);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}else{last=0;requestFrame();}});
motion.addEventListener('change',event=>{reduced=event.matches&&!forced;requestFrame();});
new ResizeObserver(measure).observe(stage);measure();

try{
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.5:1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;ready=false;if(frame)cancelAnimationFrame(frame);frame=0;document.body.dataset.renderer='fallback';loading.textContent='A versão estática está disponível. Continue para conhecer as especialidades.';});
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(46,1,.025,80);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pmrem.fromScene(room,.025);scene.environment=environment.texture;room.dispose();pmrem.dispose();scene.add(new THREE.AmbientLight(0xffffff,.65));
 for(const [x,y,z,power] of [[-4,6,5,5],[5,1,2,3],[-2,-2,-5,4],[2,4,-10,3]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(x,y,z);scene.add(light);}
 const svg=await new SVGLoader().loadAsync('./assets/logo-astro-preto.svg');
 const metal=()=>new THREE.MeshPhysicalMaterial({color:0xaaaab5,metalness:.8,roughness:.22,clearcoat:.5,envMapIntensity:1.3}),side=()=>new THREE.MeshStandardMaterial({color:0x282834,metalness:.9,roughness:.18});
 const centers=[];
 svg.paths.forEach((path,index)=>{const g=new THREE.ExtrudeGeometry(SVGLoader.createShapes(path),{depth:9,bevelEnabled:index!==2&&index!==3,bevelSize:.65,bevelThickness:.65,bevelSegments:3,curveSegments:40,steps:1});g.computeBoundingBox();const center=g.boundingBox.getCenter(new THREE.Vector3());centers.push(center);g.translate(-center.x,-center.y,-center.z);geometries.push(g);});
 portal=new THREE.Group();portal.add(new THREE.Mesh(geometries[4],[metal(),side()]));scene.add(portal);
 orbit=new THREE.Group();const points=[];for(let i=0;i<=320;i++){const angle=i/320*Math.PI*2;points.push(new THREE.Vector3(Math.cos(angle),Math.sin(angle),0));}orbit.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xbbbbca,transparent:true,opacity:.5})));scene.add(orbit);
 const nodeGeometry=new THREE.SphereGeometry(.014,16,12),nodeMaterial=new THREE.MeshBasicMaterial({color:0xffffff});for(let i=0;i<3;i++){const node=new THREE.Mesh(nodeGeometry,nodeMaterial);orbit.add(node);satellites.push(node);}
 brand=new THREE.Group();scene.add(brand);geometries.forEach((g,index)=>{const group=new THREE.Group(),front=metal(),edge=side();for(const material of [front,edge]){material.transparent=true;material.opacity=0;}const mesh=new THREE.Mesh(g,[front,edge]);group.add(mesh);group.scale.set(.020,-.020,.020);brand.add(group);letters.push({group,materials:[front,edge],x:(centers[index].x-176.88)*.020,y:-(centers[index].y+30)*.020});});
 let seed=68153;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),positions=[];for(let i=0;i<500;i++)positions.push((random()-.5)*34,(random()-.5)*20,random()*24-18);const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x8c8c9f,size:.013,transparent:true,opacity:.35,sizeAttenuation:true}));scene.add(stars);
 if(!lost){resize();camera.position.set(0,0,9);camera.lookAt(0,0,0);await renderer.compileAsync(scene,camera);if(!lost){ready=true;document.body.dataset.renderer='webgl';loading.textContent='';requestFrame();}}
}catch{ready=false;renderer?.dispose();renderer=null;document.body.dataset.renderer='fallback';loading.textContent='A versão estática está disponível. Continue para conhecer as especialidades.';requestFrame();}
