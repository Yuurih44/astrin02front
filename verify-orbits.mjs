import {chromium} from '../astro-bank/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader-webgl']});
try{for(const [width,height] of [[1440,900],[1920,1080],[390,844],[320,568]]){
 const page=await browser.newPage({viewport:{width,height}});await page.goto('http://localhost:4180/?motion=full&v=orbits');await page.waitForFunction(()=>document.querySelector('.core-visual').dataset.renderer==='webgl');
 const canvas=page.locator('#core-canvas canvas');assert.equal(await canvas.getAttribute('data-scene'),'orbits');
 const time=Number(await canvas.getAttribute('data-orbit-time'));await page.waitForTimeout(150);assert.ok(Number(await canvas.getAttribute('data-orbit-time'))>time,'points move continuously while visible');
 const initial=await canvas.getAttribute('data-orbit-tilt');
 await page.evaluate(()=>{const j=document.querySelector('.hero'),s=document.querySelector('.hero-stage');scrollTo({top:(j.offsetHeight-s.offsetHeight)*.8,behavior:'instant'});});await page.waitForTimeout(700);assert.notEqual(await canvas.getAttribute('data-orbit-tilt'),initial);
 if(width===1440){const jump=await page.evaluate(async()=>{const labels=[...document.querySelectorAll('.orbit-label')];let previous=labels.map(e=>e.getBoundingClientRect().left),largest=0;for(let i=0;i<240;i++){await new Promise(requestAnimationFrame);const next=labels.map(e=>e.getBoundingClientRect().left);next.forEach((x,i)=>{largest=Math.max(largest,Math.abs(x-previous[i]));});previous=next;}return largest;});assert.ok(jump<25,`orbit label jumps ${jump}px`);}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const labels=await page.locator('.orbit-label').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));for(const r of labels){assert.ok(r.left>=0&&r.right<=width,`${width}: label clipped horizontally`);assert.ok(r.top>=0&&r.bottom<=height,`${width}: label clipped vertically`);}
 assert.equal(await page.locator('.hero-copy').evaluate(e=>Number(getComputedStyle(e).opacity)),0);
 await page.screenshot({path:`artifacts/orbits-${width}-perspective.png`});
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(700);assert.equal(await canvas.getAttribute('data-orbit-tilt'),initial);await page.screenshot({path:`artifacts/orbits-${width}-hero.png`});
 await page.evaluate(()=>scrollTo({top:document.querySelector('.contact').offsetTop,behavior:'instant'}));await page.waitForTimeout(100);const paused=await canvas.getAttribute('data-frames');await page.waitForTimeout(150);assert.equal(await canvas.getAttribute('data-frames'),paused);
 if(width===1440){await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);await canvas.evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await page.waitForFunction(()=>document.querySelector('.core-visual').dataset.renderer==='fallback');const stopped=await canvas.getAttribute('data-frames');await page.waitForTimeout(150);assert.equal(await canvas.getAttribute('data-frames'),stopped,'lost WebGL context must stop the continuous loop');}
 console.log(`PASS ${width}: orbital motion, scroll perspective/reverse, labels, offscreen pause`);await page.close();
}}finally{await browser.close();}
