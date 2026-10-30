import {chromium} from '../astro-bank/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader-webgl']});
const errors=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[320,568]]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4180/?motion=full');await page.waitForFunction(()=>document.body.dataset.renderer==='webgl');
  const canvas=page.locator('canvas');
  for(const [p,phase] of [[0,'outside'],[.25,'approach'],[.5,'crossing'],[.7,'reveal'],[1,'brand'],[.25,'approach'],[0,'outside']]){
   await page.evaluate(p=>{const j=document.querySelector('.journey'),s=document.querySelector('.stage');scrollTo({top:(j.offsetHeight-s.offsetHeight)*p,behavior:'instant'});},p);await page.waitForFunction(p=>Math.abs(Number(document.body.dataset.progress)-p)<.001,p);
   assert.equal(await canvas.getAttribute('data-phase'),phase);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(p===.5)assert.ok(Math.abs(Number(await canvas.getAttribute('data-camera-z')))<.05,'camera crosses the actual portal plane');
   await page.screenshot({path:`artifacts/immersive-verified-${width}-${phase}.png`});
  }
  await page.evaluate(()=>scrollTo({top:document.querySelector('#servicos').offsetTop+200,behavior:'instant'}));await page.waitForTimeout(150);const paused=await canvas.getAttribute('data-frames');await page.waitForTimeout(150);assert.equal(await canvas.getAttribute('data-frames'),paused);
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://localhost:4180/');await page.waitForFunction(()=>document.body.dataset.renderer==='webgl');await page.waitForTimeout(120);assert.equal(await page.locator('canvas').getAttribute('data-phase'),'brand');const still=await page.locator('canvas').getAttribute('data-frames');await page.waitForTimeout(150);assert.equal(await page.locator('canvas').getAttribute('data-frames'),still);
  console.log(`PASS ${width}: full-screen camera passage, reveal, reverse, overflow, offscreen pause, reduced motion`);await page.close();
 }
 const fallback=await browser.newPage({viewport:{width:390,height:844}});await fallback.route('**/assets/logo-astro-preto.svg',route=>route.abort());await fallback.goto('http://localhost:4180/');await fallback.waitForFunction(()=>document.body.dataset.renderer==='fallback');assert.equal(await fallback.locator('.fallback img').isVisible(),true);await fallback.close();assert.deepEqual(errors,[]);console.log('PASS fallback and no page errors');
}finally{await browser.close();}
