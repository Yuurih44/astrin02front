import {chromium} from '../astro-bank/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createAstroServer} from './server.mjs';
import pg from 'pg';
import {randomUUID} from 'node:crypto';

if(!process.env.ASTRO_TEST_DATABASE_URL)throw new Error('Set ASTRO_TEST_DATABASE_URL for real PostgreSQL browser verification');
const schema='astro_test_'+randomUUID().replaceAll('-','');assert.match(schema,/^astro_test_[0-9a-f]{32}$/);
const admin=new pg.Client({connectionString:process.env.ASTRO_TEST_DATABASE_URL});await admin.connect();await admin.query('CREATE SCHEMA '+schema);
const databaseUrl=new URL(process.env.ASTRO_TEST_DATABASE_URL);databaseUrl.searchParams.set('options','-c search_path='+schema);await mkdir('artifacts',{recursive:true});
let browser;
const errors=[],external=[];
let server;
try{
 browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader-webgl']});
 for(const enabled of [false,true]){
  server=await createAstroServer({enableIntake:enabled,databaseUrl:databaseUrl.toString()});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
  for(const width of [390,320]){
   const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});let posts=0;
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().startsWith('http')&&!r.url().startsWith(origin+'/'))external.push(r.url());if(r.method()==='POST')posts++;});
   const capabilities=page.waitForResponse(r=>r.url().endsWith('/api/capabilities'));await page.goto(origin);await capabilities;await page.waitForFunction(enabled=>document.querySelector('.local-intake').hidden!==enabled,enabled);
   const form=page.locator('#brief-form');await form.locator('[name=name]').fill('Synthetic browser '+width);await form.locator('[name=company]').fill('Example');await form.locator('[name=email]').fill(`browser${width}@example.com`);await form.locator('[name=service]').selectOption('web_api');await form.locator('[name=scope]').fill('Synthetic local assessment https://example.com');
   assert.equal(posts,0);assert.equal(await page.locator('.local-intake').isVisible(),enabled);
   if(enabled){const response=page.waitForResponse(r=>r.url().endsWith('/api/assessment-requests'));await page.locator('#save-local').click();assert.equal((await response).status(),201);await page.waitForFunction(()=>document.querySelector('.form-status').textContent.includes('Pedido salvo localmente'));assert.equal(posts,1);}
   const download=page.waitForEvent('download');await form.locator('button[type=submit]').click();const file=await download;assert.equal(file.suggestedFilename(),'astro-briefing-seguranca.txt');const contents=await readFile(await file.path(),'utf8');assert.ok(contents.includes(`browser${width}@example.com`));assert.equal(posts,enabled?1:0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`artifacts/intake-${enabled?'on':'off'}-${width}.png`,fullPage:true});await page.close();console.log(`PASS intake ${enabled?'ON':'OFF'} ${width}: explicit save, download, no automatic POST, no overflow`);
  }
  await new Promise(r=>server.close(r));server=null;
 }
 const result=await admin.query('SELECT email,service FROM '+schema+'.assessment_requests ORDER BY email');assert.deepEqual(result.rows,[{email:'browser320@example.com',service:'web_api'},{email:'browser390@example.com',service:'web_api'}]);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS real PostgreSQL contains exactly two explicit browser submissions; no external HTTP requests or page errors');
}finally{if(server)await new Promise(r=>server.close(r));await browser?.close();assert.match(schema,/^astro_test_[0-9a-f]{32}$/);try{await admin.query('DROP SCHEMA '+schema+' CASCADE');}finally{await admin.end();}}
