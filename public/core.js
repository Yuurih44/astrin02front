import * as THREE from './vendor/three.module.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {SVGLoader} from './vendor/SVGLoader.js';
import {orbitPose} from './experience.js';
const TAU=Math.PI*2;
function circleGeometry(radius,start=0,length=TAU,segments=240){const points=[];for(let i=0;i<=segments;i++){const angle=start+i/segments*length;points.push(new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius,0));}return new THREE.BufferGeometry().setFromPoints(points);}
export async function createCore(host,{onFailure=()=>{}}={}){
 let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){onFailure(error);return null;}
 renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.5:1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,60),world=new THREE.Group();scene.add(world);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.03);scene.environment=env.texture;room.dispose();pmrem.dispose();scene.add(new THREE.AmbientLight(0xffffff,.9));
 for(const [x,y,z,power] of [[-3,5,6,4],[5,0,4,2],[0,-3,-3,3]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(x,y,z);scene.add(light);}
 const logo=new THREE.Group(),logoMesh=new THREE.Group();logo.add(logoMesh);world.add(logo);
 try{const svg=await new SVGLoader().loadAsync('./assets/logo-astro-preto.svg'),material=new THREE.MeshPhysicalMaterial({color:0x19191d,metalness:.82,roughness:.24,clearcoat:1,clearcoatRoughness:.2,envMapIntensity:1.2});for(const shape of SVGLoader.createShapes(svg.paths[0])){const geometry=new THREE.ExtrudeGeometry(shape,{depth:12,bevelEnabled:true,bevelSize:1,bevelThickness:1,bevelSegments:4,curveSegments:48,steps:1});logoMesh.add(new THREE.Mesh(geometry,material));}logoMesh.scale.set(.038,-.038,.038);logoMesh.updateMatrixWorld(true);const center=new THREE.Box3().setFromObject(logoMesh).getCenter(new THREE.Vector3());logoMesh.position.sub(center);}catch(error){renderer.dispose();env.dispose();renderer.domElement.remove();onFailure(error);return null;}
 const rings=[];
 for(const radius of [2.65]){
  const group=new THREE.Group(),material=new THREE.LineBasicMaterial({color:0x45454c,transparent:true,opacity:.4,depthWrite:false});
  group.add(new THREE.LineLoop(circleGeometry(radius),material));world.add(group);rings.push(group);
 }
 const pointGeometry=new THREE.SphereGeometry(.042,16,12),pointMaterial=new THREE.MeshBasicMaterial({color:0x222228});
 const points=[],labels=[...host.parentElement.querySelectorAll('.orbit-label')];
 for(let i=0;i<4;i++){
  const ring=0,radius=2.65,phase=i*TAU/4;
  const marker=new THREE.Group();marker.add(new THREE.Mesh(pointGeometry,pointMaterial));rings[ring].add(marker);
  const geometry=circleGeometry(radius,-.29,.29,30),colors=[];for(let j=0;j<31;j++){const value=1-(j/30)**2*.85;colors.push(value,value,value);}geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const trail=new THREE.Line(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.75,depthWrite:false}));rings[ring].add(trail);points.push({marker,trail,radius,phase,ring,label:labels[i]});
 }
 const projected=new THREE.Vector3();let width=0,height=0,lost=false,frames=0,lastProgress=0,lastTime=0;
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(w===width&&h===height)return;width=w;height=h;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
 function render(progress=lastProgress,time=lastTime){if(lost)return;lastProgress=progress;lastTime=time;resize();const pose=orbitPose(progress);
  world.rotation.set(0,0,0);rings[0].rotation.set(pose.tilt+.35,pose.yaw,pose.roll*.4);
  logo.rotation.set(-.12,-.36+progress*.65+Math.sin(time*.13)*.08,-.12);logo.position.set(0,.02,.12);
  points.forEach(point=>{const angle=point.phase+time*(point.ring?-.09:.13)+progress*(point.ring?-.65:1.05);point.marker.position.set(Math.cos(angle)*point.radius,Math.sin(angle)*point.radius,0);point.trail.rotation.z=angle;});
  camera.position.set(0,0,3.55/Math.tan(THREE.MathUtils.degToRad(17.5))*Math.max(1,1/camera.aspect));camera.lookAt(0,0,0);camera.updateMatrixWorld();world.updateMatrixWorld(true);
  points.forEach(point=>{if(!point.label)return;point.marker.getWorldPosition(projected);const depth=projected.z;projected.project(camera);const x=(projected.x+1)*width/2,y=(1-projected.y)*height/2;point.label.style.transform=`translate3d(${x}px,${y-14}px,0) translate(-50%,-100%)`;point.label.style.opacity=String(.55+Math.max(0,Math.min(1,(depth+2.5)/5))*.4);});
  renderer.render(scene,camera);frames++;renderer.domElement.dataset.frames=String(frames);renderer.domElement.dataset.open=pose.spread.toFixed(3);renderer.domElement.dataset.orbitTilt=pose.tilt.toFixed(3);renderer.domElement.dataset.orbitTime=time.toFixed(3);renderer.domElement.dataset.scene='orbits';
 }
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;host.parentElement.dataset.renderer='fallback';onFailure(new Error('WebGL context lost'));});
 resize();await renderer.compileAsync(scene,camera);render(0,0);
 return {render,isValid:()=>!lost,stats:()=>({frames,width,height,lost}),destroy(){scene.traverse(object=>{object.geometry?.dispose();if(object.material)for(const material of (Array.isArray(object.material)?object.material:[object.material]))material.dispose();});renderer.dispose();env.dispose();}};
}
