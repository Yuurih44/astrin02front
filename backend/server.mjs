import http from 'node:http';
import {readFile,realpath,mkdir} from 'node:fs/promises';
import {resolve,extname,relative,isAbsolute,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'};
const loopback=host=>['127.0.0.1','localhost','::1'].includes(host);
const inside=(root,path)=>{const rel=relative(root,path);return rel===''||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel));};
const services=new Set(['complete','web_api','infrastructure_cloud','code_architecture','remediation_retest']);
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {fields:{body:'invalid'}};
 const limits={name:[1,100],company:[1,150],email:[1,200],service:[1,40],scope:[10,3000]},fields={},data={};
 if(Object.keys(value).some(k=>!Object.hasOwn(limits,k)))fields.body='unknown_fields';
 for(const [key,[min,max]] of Object.entries(limits)){
  const input=value[key];if(typeof input!=='string'){fields[key]='invalid';continue;}
  const text=input.trim();
  if(text.length<min||text.length>max||(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text))||(key!=='scope'&&/[\r\n\t]/u.test(text)))fields[key]='invalid';
  data[key]=text;
 }
 if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(data.email))fields.email='invalid';
 if(!services.has(data.service))fields.service='invalid';
 return Object.keys(fields).length?{fields}:{data};
}
function limiter({max=20,windowMs=60000,maxEntries=256}={}){
 const entries=new Map();return address=>{const now=Date.now();for(const [key,item] of entries)if(item.until<=now)entries.delete(key);let item=entries.get(address);if(!item){if(entries.size>=maxEntries)return false;item={count:0,until:now+windowMs};entries.set(address,item);}return ++item.count<=max;};
}
export async function createAstroServer({enableIntake=false,host='127.0.0.1',publicDir=resolve(project,'public'),store,storeFactory,dataDir=process.env.ASTRO_DATA_DIR,rateLimit}={}){
 if(enableIntake&&!loopback(host))throw new Error('Local intake requires loopback binding');
 const root=await realpath(publicDir),allow=limiter(rateLimit);
 if(enableIntake&&!store){
  const folder=resolve(dataDir||resolve(process.env.LOCALAPPDATA||resolve(homedir(),'.local','share'),'AstroSecurity','data'));
  if(inside(root,folder))throw new Error('Storage must be private');
  await mkdir(folder,{recursive:true});if(inside(root,await realpath(folder)))throw new Error('Storage must be private');
  const filePath=resolve(folder,'assessment-requests.sqlite');
  try{if(inside(root,await realpath(filePath)))throw new Error('Storage must be private');}catch(error){if(error.code!=='ENOENT')throw error;}
  const factory=storeFactory||(await import('../db/store.mjs')).createAssessmentStore;store=await factory({filePath});
 }
 const reply=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
 const fail=(res,status,code,fields)=>reply(res,status,{error:{code,...(fields?{fields}:{})}});
 const server=http.createServer(async(req,res)=>{
  try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(pathname==='/api/capabilities'){if(req.method!=='GET')return fail(res,405,'method_not_allowed');return reply(res,200,{intake:{enabled:enableIntake,mode:enableIntake?'local-demo':'download'}});}
   if(pathname==='/api/assessment-requests'){
    if(!enableIntake)return fail(res,404,'not_found');if(req.method!=='POST')return fail(res,405,'method_not_allowed');
    const {port}=server.address(),origins=new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`,`http://[::1]:${port}`]);
    if(!origins.has(req.headers.origin))return fail(res,403,'origin_forbidden');
    if(!allow(req.socket.remoteAddress))return fail(res,429,'rate_limited');
    if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']||''))return fail(res,415,'unsupported_media_type');
    let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>32768){fail(res,413,'body_too_large');req.resume();return;}chunks.push(chunk);}
    let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return fail(res,400,'invalid_json');}
    const result=validate(input);if(result.fields)return fail(res,422,'validation_failed',result.fields);
    try{const record=await store.create(result.data);return reply(res,201,{id:record.id,status:'received'});}catch{return fail(res,503,'unavailable');}
   }
   if(pathname.startsWith('/api/'))return fail(res,404,'not_found');
   if(req.method!=='GET'&&req.method!=='HEAD')return fail(res,405,'method_not_allowed');
   const path=resolve(root,'.'+decodeURIComponent(pathname));if(!inside(root,path))return fail(res,403,'forbidden');
   const file=await realpath(path===root?resolve(root,'index.html'):path);if(!inside(root,file))return fail(res,403,'forbidden');
   const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
  }catch{if(!res.headersSent)fail(res,404,'not_found');else res.destroy();}
 });
 const listen=server.listen;server.listen=function(...args){if(enableIntake){const binding=typeof args[0]==='object'?args[0].host:args[1];if(!loopback(binding))throw new Error('Local intake requires loopback binding');}return listen.apply(this,args);};
 server.on('close',()=>{if(enableIntake)void store?.close?.();});return server;
}
