import {readFile,mkdir,open,rename,unlink,realpath} from 'node:fs/promises';
import {dirname,resolve,basename,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import initSqlJs from './vendor/sql-wasm.cjs';

const writers=new Set();
let sqlPromise;
const getSQL=()=>sqlPromise??=initSqlJs({locateFile:()=>fileURLToPath(new URL('./vendor/sql-wasm.wasm',import.meta.url))});
const migration=()=>readFile(new URL('./migrations/001-assessment-requests.sql',import.meta.url),'utf8');

// One process owns this file. SQL.js has no cross-process file locking.
export async function createAssessmentStore({filePath}) {
 if(typeof filePath!=='string'||!filePath)throw new TypeError('filePath is required');
 const target=resolve(filePath);
 await mkdir(dirname(target),{recursive:true});
 const canonical=join(await realpath(dirname(target)),basename(target)).toLowerCase();
 if(writers.has(canonical))throw new Error('Store already open');
 writers.add(canonical);
 let db;
 async function persist(candidate){
  const temporary=join(dirname(target),`.${basename(target)}.${randomUUID()}.tmp`);
  let handle;
  try{
   handle=await open(temporary,'wx',0o600);
   await handle.writeFile(candidate.export());
   await handle.sync();
   await handle.close();handle=null;
   await rename(temporary,target);
  }finally{
   if(handle)await handle.close().catch(()=>{});
   await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});
  }
 }
 try{
  const SQL=await getSQL();
  let bytes;try{bytes=await readFile(target);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(bytes&&(!bytes.length||bytes.subarray(0,16).toString()!=='SQLite format 3\0'))throw new Error('Invalid SQLite file');
  db=bytes?new SQL.Database(bytes):new SQL.Database();
  const integrity=db.exec('PRAGMA quick_check');
  if(integrity[0]?.values[0]?.[0]!=='ok')throw new Error('Invalid SQLite file');
  const version=db.exec('PRAGMA user_version')[0].values[0][0];
  if(version>1)throw new Error('Unsupported schema version');
  if(version===0){
   if(bytes)throw new Error('Existing database has no supported schema');
   db.run(await migration());
   await persist(db);
  }
  // Fail at opening time if the version tag does not match the actual schema.
  db.exec('SELECT id,name,company,email,service,scope,status,created_at,updated_at FROM assessment_requests LIMIT 0');
  let queue=Promise.resolve(),closed=false;
  return {
   create(input){
    if(closed)return Promise.reject(new Error('Store closed'));
    // Snapshot the agreed fields before queuing; caller mutations cannot alter a queued request.
    const values=[input.name,input.company,input.email,input.service,input.scope];
    const task=queue.then(async()=>{
     const candidate=new SQL.Database(db.export());
     const result={id:randomUUID(),status:'new',created_at:new Date().toISOString()};
     try{
      const statement=candidate.prepare('INSERT INTO assessment_requests (id,name,company,email,service,scope,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)');
      try{statement.run([result.id,...values,result.status,result.created_at,result.created_at]);}finally{statement.free();}
      await persist(candidate);
      db.close();db=candidate;
      return result;
     }catch(error){candidate.close();throw error;}
    });
    queue=task.catch(()=>{});
    return task;
   },
   async close(){if(closed){await queue;return;}closed=true;await queue;db.close();writers.delete(canonical);}
  };
 }catch(error){db?.close();writers.delete(canonical);throw error;}
}
