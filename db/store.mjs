import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import pg from 'pg';

export async function createAssessmentStore({connectionString=process.env.DATABASE_URL}={}) {
 if(typeof connectionString!=='string'||!connectionString)throw new TypeError('DATABASE_URL is required');
 let parsed;try{parsed=new URL(connectionString);}catch{throw new TypeError('PostgreSQL connection URL required');}
 if(!['postgres:','postgresql:'].includes(parsed.protocol))throw new TypeError('PostgreSQL connection URL required');
 const pool=new pg.Pool({connectionString,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:10000,application_name:'astro-security'});
 // Idle connection failures must not become uncaught EventEmitter exceptions.
 pool.on('error',()=>{});
 let client;
 try{
  client=await pool.connect();
  await client.query('BEGIN');
  await client.query("SET LOCAL synchronous_commit = on");
  // Serialize migrations even when several application processes open together.
  await client.query('SELECT pg_advisory_xact_lock($1)',[418020261]);
  await client.query('CREATE TABLE IF NOT EXISTS astro_schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const {rows}=await client.query('SELECT version FROM astro_schema_migrations ORDER BY version');
  if(rows.some(row=>row.version!==1))throw new Error('Unsupported schema version');
  if(!rows.some(row=>row.version===1)){
   await client.query(await readFile(new URL('./migrations/001-assessment-requests.sql',import.meta.url),'utf8'));
   await client.query('INSERT INTO astro_schema_migrations(version) VALUES ($1)',[1]);
  }
  await client.query('SELECT id,name,company,email,service,scope,status,created_at,updated_at FROM assessment_requests LIMIT 0');
  await client.query('COMMIT');
 }catch(error){
  if(client)await client.query('ROLLBACK').catch(()=>{});
  client?.release();await pool.end();throw error;
 }
 client.release();
 let closed=false,closing;
 return {
  async create(input){
   if(closed)throw new Error('Store closed');
   const values=[randomUUID(),input.name,input.company,input.email,input.service,input.scope];
   const writer=await pool.connect();
   try{
    await writer.query('BEGIN');
    await writer.query('SET LOCAL synchronous_commit = on');
    const {rows}=await writer.query({name:'astro-create-assessment-v1',text:"INSERT INTO assessment_requests(id,name,company,email,service,scope) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,status,created_at",values});
    await writer.query('COMMIT');
    return {...rows[0],created_at:rows[0].created_at.toISOString()};
   }catch(error){await writer.query('ROLLBACK').catch(()=>{});throw error;}
   finally{writer.release();}
  },
  close(){if(!closing){closed=true;closing=pool.end();}return closing;}
 };
}
