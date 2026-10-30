import {chromium} from '../astro-bank/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader-webgl']});
try{for(const [width,height] of [[1440,900],[1920,1080],[390,844],[320,568]]){
 const page=await browser.newPage({viewport:{width,height}});await page.goto('http://localhost:4180/?motion=full&v=o-orbit');await page.waitForFunction(()=>document.querySelector('.core-visual').dataset.renderer==='webgl');
 const canvas=page.locator('#core-canvas canvas');assert.equal(await canvas.getAttribute('data-scene'),'wordmark');
 assert.equal(await canvas.getAttribute('data-anchor'),'O');
 const initialRadius=Number(await canvas.getAttribute('data-orbit-radius'));
 for(const [p,text] of [[0,'O'],[.34,'RO'],[.48,'TRO'],[.62,'STRO'],[.95,'ASTRO'],[.34,'RO'],[0,'O']]){
  await page.evaluate(p=>{const j=document.querySelector('.hero'),s=document.querySelector('.hero-stage');scrollTo({top:(j.offsetHeight-s.offsetHeight)*p,behavior:'instant'});},p);await page.waitForFunction(expected=>document.querySelector('#core-canvas canvas')?.dataset.letters===expected,text,{timeout:15000});await page.waitForTimeout(250);assert.equal(await canvas.getAttribute('data-letters'),text);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`artifacts/wordmark-${width}-${text}.png`});
  if(text==='ASTRO')assert.ok(Number(await canvas.getAttribute('data-orbit-radius'))<initialRadius,'orbit shrinks with its O anchor');
 }
 await page.evaluate(()=>scrollTo({top:document.querySelector('.contact').offsetTop,behavior:'instant'}));await page.waitForTimeout(100);const paused=await canvas.getAttribute('data-frames');await page.waitForTimeout(150);assert.equal(await canvas.getAttribute('data-frames'),paused);
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://localhost:4180/');await page.waitForFunction(()=>document.querySelector('.core-visual').dataset.renderer==='webgl');await page.waitForTimeout(100);assert.equal(await page.locator('#core-canvas canvas').getAttribute('data-letters'),'ASTRO');const still=await page.locator('#core-canvas canvas').getAttribute('data-frames');await page.waitForTimeout(150);assert.equal(await page.locator('#core-canvas canvas').getAttribute('data-frames'),still);
 console.log(`PASS ${width}: O → RO → TRO → STRO → ASTRO, orbit follows O, reverse, pause, reduced-motion complete brand`);await page.close();
}}finally{await browser.close();}
