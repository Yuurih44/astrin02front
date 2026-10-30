// Uses Playwright already installed in the neighboring Astro project; no install needed.
import {chromium} from '../astro-bank/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader-webgl']});
const errors=[];
try{
 for(const [width,height] of [[1440,900],[1920,1080],[390,844],[320,568],[640,360]]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:4180');await page.waitForFunction(()=>document.body.dataset.renderer==='webgl');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}: horizontal overflow`);
  const frames=()=>page.locator('#immersive-canvas canvas').getAttribute('data-frames');
  await page.evaluate(()=>{const e=document.querySelector('.journey'),stage=document.querySelector('.stage');scrollTo({top:e.offsetTop+(e.offsetHeight-stage.offsetHeight)*.5,behavior:'instant'});});await page.waitForFunction(()=>Math.abs(Number(document.body.dataset.progress)-.5)<.001);
  assert.ok(Math.abs(Number(await page.locator('#immersive-canvas canvas').getAttribute('data-camera-z')))<.1,'camera crosses portal with scroll');
  await page.screenshot({path:`artifacts/verified-${width}-open.png`});
  await page.evaluate(()=>scrollTo({top:document.querySelector('.contact').offsetTop,behavior:'instant'}));await page.waitForTimeout(200);const paused=await frames();await page.waitForTimeout(200);assert.equal(await frames(),paused,'offscreen renderer pauses');
  await page.locator('input[name="name"]').fill('Ana Teste');await page.locator('input[name="company"]').fill('Empresa de teste');await page.locator('input[name="email"]').fill('ana@example.com');await page.locator('textarea').fill('Avaliação do portal de clientes e suas APIs.');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar briefing'}).click();const download=await downloadPromise;const text=await readFile(await download.path(),'utf8');assert.ok(text.includes('Ana Teste'));assert.ok(text.includes('Nenhuma análise foi executada'));assert.equal(download.suggestedFilename(),'astro-briefing-seguranca.txt');
  await page.locator('.service-list summary').nth(1).click();await page.waitForTimeout(100);assert.equal(await page.locator('.service-list details[open]').count(),1);assert.equal(await page.locator('.service-list details').nth(1).getAttribute('open'),'');
  if(width<=760){await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#mobile-menu').isHidden(),true);assert.equal(await page.locator('.menu-toggle').evaluate(e=>e===document.activeElement),true);await page.locator('.menu-toggle').click();await page.locator('#mobile-menu a').first().click();assert.equal(await page.locator('#mobile-menu').isHidden(),true);assert.equal(await page.locator('.services h2').evaluate(e=>e===document.activeElement),true);}
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(250);const reducedFrames=await frames();await page.waitForTimeout(220);assert.equal(await frames(),reducedFrames,'reduced-motion scene does not loop');
  console.log(`PASS ${width}x${height}: WebGL scroll, overflow, pause, real briefing download, accordion, keyboard/menu, reduced motion`);await page.close();
 }
 const fallback=await browser.newPage({viewport:{width:390,height:844}});await fallback.route('**/assets/logo-astro-preto.svg',route=>route.abort());await fallback.goto('http://localhost:4180');await fallback.waitForFunction(()=>document.body.dataset.renderer==='fallback');assert.equal(await fallback.locator('.fallback').isVisible(),true);assert.deepEqual(errors,[]);console.log('PASS fallback3D and zero page errors');await fallback.close();
 const explicit=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await explicit.goto('http://localhost:4180/?motion=full');await explicit.waitForFunction(()=>document.body.dataset.renderer==='webgl');assert.equal(await explicit.locator('body').getAttribute('data-motion'),'full');console.log('PASS explicit full-motion preview with reduced-motion OS preference');await explicit.close();
}finally{await browser.close();}
