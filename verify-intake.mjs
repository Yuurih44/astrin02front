import {chromium} from '../astro-bank/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAstroServer} from './server.mjs';
import initSqlJs from './db/vendor/sql-wasm.cjs';

const dir=await mkdtemp(join(tmpdir(),'astro-browser-intake-'));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader-webgl']});
const errors=[],external=[];
let server;
try{
 for(const enabled of [false,true]){
  server=await createAstroServer({enableIntake:enabled,dataDir:dir});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
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
 const SQL=await initSqlJs({locateFile:()=>fileURLToPath(new URL('./db/vendor/sql-wasm.wasm',import.meta.url))});const db=new SQL.Database(await readFile(join(dir,'assessment-requests.sqlite')));try{assert.deepEqual(db.exec('SELECT email,service FROM assessment_requests ORDER BY email')[0].values,[['browser320@example.com','web_api'],['browser390@example.com','web_api']]);}finally{db.close();}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS real SQLite contains exactly two explicit browser submissions; no external HTTP requests or page errors');
}finally{if(server)await new Promise(r=>server.close(r));await browser.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));await rm(dir,{recursive:true,force:true});}
