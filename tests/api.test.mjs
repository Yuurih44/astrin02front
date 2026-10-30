import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAstroServer} from '../server.mjs';

const valid={name:' Pessoa ',company:'Empresa',email:'a@example.com',service:'web_api',scope:'Contexto de avaliação local'};
async function fixture(t,options={}){
 const records=[];
 const server=await createAstroServer({enableIntake:true,store:{async create(input){records.push(input);return {id:'request-id',status:'new',created_at:new Date().toISOString()};}},...options});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>server.close(r)));
 const port=server.address().port;
 const send=(body=JSON.stringify(valid),headers={},method='POST',path='/api/assessment-requests')=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,path,method,headers:{Origin:`http://127.0.0.1:${port}`,'Content-Type':'application/json',...headers}},res=>{let text='';res.on('data',b=>text+=b);res.on('end',()=>resolve({status:res.statusCode,text,headers:res.headers}));});req.on('error',reject);req.end(body);});
 return {send,records};
}
test('disabled intake exposes download capabilities and never writes',async t=>{const {send,records}=await fixture(t,{enableIntake:false});assert.equal((await send()).status,404);assert.deepEqual(JSON.parse((await send('',{},'GET','/api/capabilities')).text),{intake:{enabled:false,mode:'download'}});assert.equal(records.length,0);});
test('validated request is trimmed and acknowledged only after durable create',async t=>{const {send,records}=await fixture(t);assert.deepEqual(JSON.parse((await send()).text),{id:'request-id',status:'received'});assert.equal(records[0].name,'Pessoa');assert.equal((await send('',{},'GET')).status,405);});
test('foreign origins cannot be authorized using Host or forwarded headers',async t=>{const {send,records}=await fixture(t);for(const Origin of ['http://evil.test','null',''])assert.equal((await send(undefined,{Origin,Host:'evil.test','X-Forwarded-Host':'evil.test'})).status,403);assert.equal(records.length,0);});
test('malformed JSON, shapes, unknown fields and invalid values never persist',async t=>{const {send,records}=await fixture(t);assert.equal((await send('{')).status,400);for(const body of [null,[],1,{...valid,email:'invalid'},{...valid,name:'\u0000'},{...valid,id:'private'},{...valid,scope:[]}])assert.equal((await send(JSON.stringify(body))).status,422);assert.equal((await send('{}',{'Content-Type':'text/plain'})).status,415);assert.equal(records.length,0);});
test('streaming body limit rejects excess bytes',async t=>{const {send,records}=await fixture(t);assert.equal((await send('x'.repeat(32769))).status,413);assert.equal(records.length,0);});
test('socket rate limit ignores forwarded addresses',async t=>{const {send}=await fixture(t,{rateLimit:{max:2,windowMs:60000,maxEntries:2}});assert.equal((await send()).status,201);assert.equal((await send(undefined,{'X-Forwarded-For':'another'})).status,201);assert.equal((await send(undefined,{'X-Forwarded-For':'third'})).status,429);});
test('storage failure is generic and static missing file does not crash server',async t=>{const {send}=await fixture(t,{store:{async create(){throw new Error(valid.email);}}});const failed=await send();assert.equal(failed.status,503);assert.ok(!failed.text.includes(valid.email));assert.equal((await send('',{},'GET','/missing-file')).status,404);assert.equal((await send('',{},'GET','/')).status,200);});
test('success waits for asynchronous persistence confirmation',async t=>{let complete,entered;const started=new Promise(r=>entered=r),pending=new Promise(r=>complete=r);const {send}=await fixture(t,{store:{async create(){entered();await pending;return {id:'durable-id',status:'new',created_at:'2026-10-30T00:00:00Z'};}}});let received=false;const response=send().then(r=>{received=true;return r;});await started;await new Promise(r=>setImmediate(r));assert.equal(received,false);complete();assert.equal((await response).status,201);});
test('disabled mode never initializes a store and enabled mode refuses public bind',async t=>{const server=await createAstroServer({enableIntake:false,storeFactory(){throw new Error('must not initialize');}});server.close();await assert.rejects(createAstroServer({enableIntake:true,host:'0.0.0.0'}),/loopback/);const {send}=await fixture(t,{rateLimit:{max:1,windowMs:1}});assert.equal((await send()).status,201);await new Promise(r=>setTimeout(r,5));assert.equal((await send()).status,201);});
test('realpath blocks junction escape while serving regular files',async t=>{const dir=await mkdtemp(join(tmpdir(),'astro-api-'));t.after(()=>rm(dir,{recursive:true,force:true}));const root=join(dir,'public'),privateDir=join(dir,'private');await mkdir(root);await mkdir(privateDir);await writeFile(join(root,'index.html'),'public');await writeFile(join(privateDir,'secret.txt'),'private sentinel');await symlink(privateDir,join(root,'linked'),process.platform==='win32'?'junction':'dir');const {send}=await fixture(t,{publicDir:root});const escaped=await send('',{},'GET','/linked/secret.txt');assert.equal(escaped.status,403);assert.ok(!escaped.text.includes('sentinel'));assert.equal((await send('',{},'GET','/')).text,'public');});
test('enabled intake requires an explicit PostgreSQL connection',async()=>{await assert.rejects(createAstroServer({enableIntake:true,databaseUrl:''}),/DATABASE_URL/);});
test('factory receives PostgreSQL configuration and connection errors are sanitized',async()=>{
 const databaseUrl='postgresql://demo:secret@127.0.0.1:5432/astro';let configuration;
 const server=await createAstroServer({enableIntake:true,databaseUrl,storeFactory:async options=>{configuration=options;return {async create(){return {id:'persisted'};},async close(){}};}});
 assert.deepEqual(configuration,{connectionString:databaseUrl});server.close();
 await assert.rejects(createAstroServer({enableIntake:true,databaseUrl,storeFactory:async()=>{throw new Error(databaseUrl);}}),error=>!error.message.includes('secret')&&/unavailable/.test(error.message));
});
