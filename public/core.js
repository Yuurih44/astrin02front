import * as THREE from './vendor/three.module.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {applicationPose} from './experience.js';
function rect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
function text(c,value,x,y,size=22,color='#171719',weight=500){c.fillStyle=color;c.font=`${weight} ${size}px Manrope,Arial,sans-serif`;c.fillText(value,x,y);}
function line(c,x,y,endX,endY,color='#d9d9d7'){c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);c.stroke();}
function lock(c,x,y,color='#222',valid=false){c.save();c.translate(x,y);c.strokeStyle=color;c.lineWidth=3;c.lineCap='round';c.beginPath();c.roundRect(0,17,30,25,5);c.moveTo(6,17);c.lineTo(6,10);c.arc(15,10,9,Math.PI,0);c.lineTo(24,17);c.stroke();if(valid){c.beginPath();c.moveTo(8,29);c.lineTo(13,34);c.lineTo(22,25);c.stroke();}else{c.beginPath();c.moveTo(15,25);c.lineTo(15,33);c.stroke();}c.restore();}
function makeTexture(height,draw){const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=height;const c=canvas.getContext('2d');draw(c);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;}
function rounded(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function surface(w,h,material){const geometry=new THREE.ShapeGeometry(rounded(w,h,.11)),uv=geometry.attributes.uv,pos=geometry.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+w/2)/w,(pos.getY(i)+h/2)/h);return new THREE.Mesh(geometry,material);}
export async function createCore(host,{onFailure=()=>{}}={}){
 let renderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){onFailure(error);return null;}
 await document.fonts.ready;const logo=new Image();logo.src='./assets/logo-astro-preto.svg';await logo.decode().catch(()=>{});
 renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<761?1.5:1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,60),world=new THREE.Group();scene.add(world);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.03);scene.environment=env.texture;room.dispose();pmrem.dispose();scene.add(new THREE.AmbientLight(0xffffff,1));
 for(const [x,y,z,power] of [[-4,6,5,4],[5,1,3,3],[0,-4,-2,2]]){const light=new THREE.DirectionalLight(0xffffff,power);light.position.set(x,y,z);scene.add(light);}
 const frameMat=new THREE.MeshStandardMaterial({color:0x55555b,metalness:.8,roughness:.33});
 const uiMap=makeTexture(700,c=>{
  rect(c,0,0,1000,700,26,'#f6f6f3');rect(c,0,0,1000,76,24,'#e5e5e2');c.fillStyle='#e5e5e2';c.fillRect(0,36,1000,40);
  for(let i=0;i<3;i++){c.fillStyle=['#8a8a8d','#aaaab0','#c1c1c5'][i];c.beginPath();c.arc(34+i*25,37,6,0,Math.PI*2);c.fill();}
  rect(c,270,20,470,34,8,'#f5f5f2');text(c,'portal.exemplo',408,44,17,'#666');
  if(logo.naturalWidth)c.drawImage(logo,43,110,145,26);text(c,'Área do cliente',790,130,18,'#666');line(c,42,165,958,165);
  text(c,'Seus documentos',43,225,42,'#171719',600);text(c,'Tudo o que sua equipe precisa, em um lugar.',44,267,21,'#777');
  rect(c,42,305,916,86,12,'#fff','#d5d5d0');rect(c,63,325,44,44,8,'#ecece8');text(c,'↓',77,356,25);text(c,'Fatura #1042',130,344,24,'#222',600);text(c,'Documento da sua empresa',130,370,16,'#777');text(c,'Visualizar',810,354,18,'#444');
  for(const [name,y] of [['Relatório mensal',447],['Contrato de serviço',538]]){line(c,43,y+37,958,y+37);text(c,'↳',65,y,25,'#888');text(c,name,130,y,23,'#555');text(c,'Disponível',810,y,16,'#888');}
  lock(c,45,607,'#777',true);text(c,'Você está conectado como usuário da empresa.',95,636,18,'#666');
 });
 const apiMaps=[0,1,2,3].map(state=>makeTexture(340,c=>{
  rect(c,0,0,1000,340,24,state===1?'#e8e8e4':'#202023','#73737b');const dark=state!==1,ink=dark?'#f1f1ef':'#111',muted=dark?'#a9a9af':'#56565b';
  text(c,'API',38,57,23,ink,700);text(c,'Permissão por recurso',38,117,34,ink,600);
  text(c,['Análise do controle de acesso','Falha de autorização identificada','Verificação aplicada no servidor','Reteste: acesso indevido bloqueado'][state],38,164,23,muted);line(c,38,195,962,195,dark?'#45454c':'#bdbdb8');
  text(c,state<2?'Quem pode acessar este documento?':'Usuário + empresa + documento',38,244,20,muted);text(c,['Validando escopo','Permissão ausente','Permissão verificada','Correção validada'][state],38,294,22,ink,600);lock(c,901,89,ink,state>=2);
 }));
 const dbMap=makeTexture(270,c=>{
  rect(c,0,0,1000,270,24,'#29292d','#73737b');text(c,'Dados',38,58,24,'#eee',650);text(c,'Documentos da empresa',38,119,33,'#eee',550);text(c,'Acesso limitado aos recursos autorizados.',38,167,21,'#b3b3ba');for(let i=0;i<3;i++)rect(c,38+i*122,200,105,25,5,'#414146');
  c.strokeStyle='#bfc0c7';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.ellipse(909,91+i*24,35,12,0,0,Math.PI*2);c.stroke();}line(c,874,91,874,139,'#bfc0c7');line(c,944,91,944,139,'#bfc0c7');
 });
 const apiUniforms={nextMap:{value:apiMaps[1]},blend:{value:0}},apiMaterial=new THREE.MeshBasicMaterial({map:apiMaps[0],toneMapped:false});
 apiMaterial.onBeforeCompile=shader=>{Object.assign(shader.uniforms,apiUniforms);shader.fragmentShader='uniform sampler2D nextMap;\nuniform float blend;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#ifdef USE_MAP\n diffuseColor *= mix(texture2D(map,vMapUv),texture2D(nextMap,vMapUv),blend);\n#endif');};apiMaterial.customProgramCacheKey=()=>'astro-application-api-v1';
 function plate(w,h,material){const group=new THREE.Group(),back=new THREE.Mesh(new THREE.ExtrudeGeometry(rounded(w,h,.11),{depth:.10,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1,curveSegments:12}),frameMat);back.position.z=-.11;group.add(back);const face=surface(w-.02,h-.02,material);face.position.z=.015;group.add(face);world.add(group);return group;}
 const ui=plate(4.4,3.08,new THREE.MeshBasicMaterial({map:uiMap,toneMapped:false})),api=plate(4.2,1.43,apiMaterial),data=plate(4,1.08,new THREE.MeshBasicMaterial({map:dbMap,toneMapped:false}));
 const connectorGeo=new THREE.BufferGeometry();connectorGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(18),3));const connectors=new THREE.LineSegments(connectorGeo,new THREE.LineBasicMaterial({color:0x9999a2,transparent:true,opacity:.6}));world.add(connectors);
 const signal=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));world.add(signal);
 let width=0,height=0,lost=false,frames=0,lastProgress=0,lastApi=-1;
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(w===width&&h===height)return;width=w;height=h;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
 function render(progress=lastProgress){if(lost)return;lastProgress=progress;resize();const pose=applicationPose(progress);world.rotation.set(pose.tilt,pose.yaw,.025);world.position.y=0;
  ui.position.set(-.10-pose.open*.16,.85+pose.open*.60,.75+pose.open*.18);api.position.set(.20,-.70-pose.open*.55,-.12+pose.open*.44);data.position.set(.38,-1.65-pose.open,-.9+pose.open*.65);
  const positions=connectorGeo.attributes.position,points=[[-2.36,ui.position.y-1.1,ui.position.z],[-2.36,api.position.y+.35,api.position.z],[-2.36,api.position.y+.35,api.position.z],[-2.08,api.position.y+.35,api.position.z],[-1.62,api.position.y-.7,api.position.z],[-1.62,data.position.y+.45,data.position.z]];points.forEach((p,i)=>positions.setXYZ(i,...p));positions.needsUpdate=true;
  signal.position.set(-2.36,THREE.MathUtils.lerp(ui.position.y-1.1,api.position.y+.35,Math.min(1,progress*2)),THREE.MathUtils.lerp(ui.position.z,api.position.z,Math.min(1,progress*2)));signal.visible=progress<.63;
  const from=progress<.55?0:progress<.80?1:2,to=from+1,mix=from===0?pose.finding:from===1?pose.fixed:pose.verified;if(from!==lastApi){apiMaterial.map=apiMaps[from];lastApi=from;}apiUniforms.nextMap.value=apiMaps[to];apiUniforms.blend.value=mix;
  camera.position.set(0,.10,(3.65+pose.open*.55)/Math.tan(THREE.MathUtils.degToRad(17.5))*Math.max(1,1/camera.aspect));camera.lookAt(0,.10,0);camera.updateMatrixWorld();renderer.render(scene,camera);frames++;
  renderer.domElement.dataset.frames=String(frames);renderer.domElement.dataset.open=pose.open.toFixed(3);renderer.domElement.dataset.stage=pose.stage;
 }
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;host.parentElement.dataset.renderer='fallback';onFailure(new Error('WebGL context lost'));});
 resize();for(const map of [uiMap,...apiMaps,dbMap])renderer.initTexture(map);await renderer.compileAsync(scene,camera);render(0);
 return {render,isValid:()=>!lost,stats:()=>({frames,width,height,lost}),destroy(){renderer.dispose();env.dispose();}};
}
