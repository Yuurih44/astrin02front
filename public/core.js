import * as THREE from './vendor/three.module.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {SVGLoader} from './vendor/SVGLoader.js';
import {wordmarkPose,letterEntrance} from './experience.js';
export async function createCore(host,{onFailure=()=>{}}={}){
 let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){onFailure(error);return null;}
 renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.5:1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,60),world=new THREE.Group();scene.add(world);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.025);scene.environment=env.texture;room.dispose();pmrem.dispose();scene.add(new THREE.AmbientLight(0xffffff,.8));
 for(const [x,y,z,power] of [[-3,5,6,4],[5,0,4,2],[-2,-2,-3,3]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(x,y,z);scene.add(light);}
 const letters=[];
 try{const svg=await new SVGLoader().loadAsync('./assets/logo-astro-preto.svg');
  for(const [index,path] of svg.paths.entries()){
   const group=new THREE.Group(),geometry=new THREE.ExtrudeGeometry(SVGLoader.createShapes(path),{depth:9,bevelEnabled:index!==2&&index!==3,bevelSize:.65,bevelThickness:.65,bevelSegments:3,curveSegments:32,steps:1});geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new THREE.Vector3());geometry.translate(-center.x,-center.y,-center.z);
   const front=new THREE.MeshPhysicalMaterial({color:0xb9b9c0,metalness:.72,roughness:.25,clearcoat:.7,envMapIntensity:1.2,transparent:index>0,opacity:index?0:1});
   const edge=new THREE.MeshStandardMaterial({color:0x25252e,metalness:.85,roughness:.22,transparent:index>0,opacity:index?0:1});
   const mesh=new THREE.Mesh(geometry,[front,edge]);group.add(mesh);world.add(group);letters.push({group,materials:[front,edge],x:(center.x-176.88)*.014,y:-(center.y+30)*.014});
  }
 }catch(error){renderer.dispose();env.dispose();renderer.domElement.remove();onFailure(error);return null;}
 let width=0,height=0,lost=false,frames=0,lastProgress=0,lastTime=0;
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(w===width&&h===height)return;width=w;height=h;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
 function render(progress=lastProgress,time=lastTime){if(lost)return;lastProgress=progress;lastTime=time;resize();const pose=wordmarkPose(progress),a=letters[0];
  world.rotation.set(-.04,-.30*(1-pose.aMix)+Math.sin(time*.13)*.018,-.012*(1-pose.aMix));
  const aScale=THREE.MathUtils.lerp(.045,.014,pose.aMix);a.group.scale.set(aScale,-aScale,aScale);a.group.position.set(a.x*pose.aMix,a.y,0);
  letters.slice(1).forEach((letter,index)=>{const reveal=pose.letters[index+1],entrance=letterEntrance(reveal,a.group.position.x,letter.x),scale=.014*(.90+.10*reveal);letter.group.visible=reveal>.001;letter.group.scale.set(scale,-scale,scale);letter.group.position.set(entrance.x,letter.y+entrance.y,entrance.z);letter.group.rotation.y=-(1-reveal)*.12;letter.materials.forEach(material=>{material.opacity=entrance.opacity;material.depthWrite=entrance.opacity>.995;});});
  camera.position.set(0,0,3.45/Math.tan(THREE.MathUtils.degToRad(17.5))*Math.max(1,1/camera.aspect));camera.lookAt(0,0,0);camera.updateMatrixWorld();renderer.render(scene,camera);frames++;
  renderer.domElement.dataset.frames=String(frames);renderer.domElement.dataset.open=pose.assemble.toFixed(3);renderer.domElement.dataset.animationTime=time.toFixed(3);renderer.domElement.dataset.scene='wordmark';renderer.domElement.dataset.letters='ASTRO'.split('').filter((_,i)=>pose.letters[i]>.5).join('');
 }
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;host.parentElement.dataset.renderer='fallback';onFailure(new Error('WebGL context lost'));});
 resize();await renderer.compileAsync(scene,camera);render(0,0);
 return {render,isValid:()=>!lost,stats:()=>({frames,width,height,lost}),destroy(){const geometries=new Set(),materials=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const m of (Array.isArray(object.material)?object.material:[object.material]))materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();env.dispose();}};
}
