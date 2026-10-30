import * as THREE from './vendor/three.module.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {corePose} from './experience.js';

export async function createCore(host,{onFailure=()=>{}}={}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){onFailure(error);return null;}
 renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.5:1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,50),world=new THREE.Group();scene.add(world);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.025);scene.environment=env.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.AmbientLight(0xffffff,.7));
 for(const [x,y,z,intensity] of [[-4,6,5,6],[5,1,3,3],[0,-4,-2,4]]){const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.set(x,y,z);scene.add(light);}
 const metal=new THREE.MeshPhysicalMaterial({color:0xa4a4a8,metalness:1,roughness:.20,clearcoat:.4,clearcoatRoughness:.28,side:THREE.DoubleSide,envMapIntensity:1.5});
 const bands=[];
 for(let i=0;i<8;i++){
  const group=new THREE.Group();
  for(let j=0;j<3;j++){
   const shell=new THREE.Mesh(new THREE.SphereGeometry(1.7,48,12,j*Math.PI*2/3+.012,Math.PI*2/3-.024,i*Math.PI/8+.025,Math.PI/8-.05),metal);group.add(shell);
  }
  bands.push(group);world.add(group);
 }
 const inner=new THREE.Group();world.add(inner);
 const nucleus=new THREE.Mesh(new THREE.IcosahedronGeometry(.73,0),new THREE.MeshPhysicalMaterial({color:0x222225,metalness:.85,roughness:.21,clearcoat:1}));inner.add(nucleus);
 const cage=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.94,1)),new THREE.LineBasicMaterial({color:0xbabac0,transparent:true,opacity:.7}));inner.add(cage);
 const nodeGeo=new THREE.SphereGeometry(.027,10,8),nodeMat=new THREE.MeshBasicMaterial({color:0xdedee2});
 const vertices=new THREE.IcosahedronGeometry(.94,0).attributes.position,seen=new Set();
 for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),key=[x,y,z].map(v=>v.toFixed(2)).join(',');if(seen.has(key))continue;seen.add(key);const node=new THREE.Mesh(nodeGeo,nodeMat);node.position.set(x,y,z);inner.add(node);}
 const scan=new THREE.Mesh(new THREE.TorusGeometry(1.78,.006,6,144),new THREE.MeshBasicMaterial({color:0xdddddf,transparent:true,opacity:.6}));scan.rotation.x=Math.PI/2;world.add(scan);
 let width=0,height=0,lost=false,frames=0,lastProgress=0;
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(w===width&&h===height)return false;width=w;height=h;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);return true;}
 function render(progress=lastProgress){if(lost)return;lastProgress=progress;resize();const pose=corePose(progress);
  world.rotation.set(pose.tilt,pose.yaw,-.23);world.position.y=.05;
  bands.forEach((band,i)=>{const direction=(3.5-i)/3.5;band.position.y=direction*pose.open*.75;band.rotation.y=(i%2?1:-1)*pose.open*(.18+Math.abs(direction)*.15);band.scale.setScalar(1+pose.open*.045);});
  inner.rotation.set(pose.open*.38,-pose.yaw*.6,.25);scan.position.y=-.85+progress*1.7;scan.scale.setScalar(1-pose.open*.12);scan.material.opacity=.22+pose.open*.15;
  camera.position.set(0,.05,(2.65+pose.open*.45)/Math.tan(THREE.MathUtils.degToRad(17.5))*Math.max(1,1/camera.aspect));camera.lookAt(0,0,0);camera.updateMatrixWorld();renderer.render(scene,camera);frames++;
  renderer.domElement.dataset.frames=String(frames);renderer.domElement.dataset.open=pose.open.toFixed(3);
 }
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;host.parentElement.dataset.renderer='fallback';onFailure(new Error('WebGL context lost'));});
 resize();await renderer.compileAsync(scene,camera);render(0);
 return {render,isValid:()=>!lost,stats:()=>({frames,width,height,lost}),destroy(){renderer.dispose();env.dispose();}};
}
