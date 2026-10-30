import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {createAssessmentStore} from '../db/store.mjs';
const input={name:'Example',company:'Example Ltd',email:'test@example.com',service:'web_api',scope:"Literal '); DROP TABLE assessment_requests; -- https://example.com <script>"};
const testUrl=process.env.ASTRO_TEST_DATABASE_URL;
const integration={skip:!testUrl?'PostgreSQL unavailable: set ASTRO_TEST_DATABASE_URL to an isolated local test database':false};
async function fixture(t){
 const schema='astro_test_'+randomUUID().replaceAll('-','');
 const admin=new pg.Client({connectionString:testUrl});await admin.connect();
 await admin.query(`CREATE SCHEMA ${schema}`);
 t.after(async()=>{await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();});
 const url=new URL(testUrl);url.searchParams.set('options',`-c search_path=${schema}`);
 return {connectionString:url.toString(),admin,schema};
}
test('requires explicit PostgreSQL URL and rejects SQLite configuration',async()=>{
 await assert.rejects(createAssessmentStore({connectionString:''}),/DATABASE_URL/);
 await assert.rejects(createAssessmentStore({connectionString:'sqlite:local.sqlite'}),/PostgreSQL/);
});
test('PostgreSQL migration, literal data and reopen persist committed data',integration,async t=>{
 const {connectionString,admin,schema}=await fixture(t);
 let store=await createAssessmentStore({connectionString});
 const result=await store.create(input);assert.equal(result.status,'new');assert.match(result.id,/^[0-9a-f-]{36}$/);assert.ok(Number.isFinite(Date.parse(result.created_at)));
 await store.close();store=await createAssessmentStore({connectionString});await store.create({...input,name:'Second'});await store.close();
 const {rows}=await admin.query(`SELECT * FROM ${schema}.assessment_requests ORDER BY created_at`);
 assert.equal(rows.length,2);assert.equal(rows[0].scope,input.scope);
 assert.equal((await admin.query(`SELECT version FROM ${schema}.astro_schema_migrations`)).rows[0].version,1);
});
test('multiple PostgreSQL stores migrate concurrently and retain every concurrent create',integration,async t=>{
 const {connectionString,admin,schema}=await fixture(t);
 const stores=await Promise.all([createAssessmentStore({connectionString}),createAssessmentStore({connectionString})]);
 try{const results=await Promise.all(Array.from({length:20},(_,i)=>stores[i%2].create(input)));assert.equal(new Set(results.map(x=>x.id)).size,20);}
 finally{await Promise.all(stores.map(s=>s.close()));}
 assert.equal((await admin.query(`SELECT count(*)::int AS count FROM ${schema}.assessment_requests`)).rows[0].count,20);
 await assert.rejects(stores[0].create(input),/closed/);
});
test('constraint failure rolls back and subsequent insert succeeds',integration,async t=>{
 const {connectionString,admin,schema}=await fixture(t);const store=await createAssessmentStore({connectionString});
 try{await store.create(input);await assert.rejects(store.create({...input,service:'invalid'}));await store.create({...input,name:'Survives'});}
 finally{await store.close();}
 assert.equal((await admin.query(`SELECT count(*)::int AS count FROM ${schema}.assessment_requests`)).rows[0].count,2);
});
test('unsupported migration version is rejected without changing existing data',integration,async t=>{
 const {connectionString,admin,schema}=await fixture(t);const store=await createAssessmentStore({connectionString});await store.create(input);await store.close();
 await admin.query(`INSERT INTO ${schema}.astro_schema_migrations(version) VALUES (999)`);
 await assert.rejects(createAssessmentStore({connectionString}),/Unsupported schema/);
 assert.equal((await admin.query(`SELECT count(*)::int AS count FROM ${schema}.assessment_requests`)).rows[0].count,1);
});
