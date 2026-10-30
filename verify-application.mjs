import {chromium} from '../astro-bank/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader-webgl']});
try{for(const [width,height] of [[1440,900],[390,844],[320,568]]){
 const p=await b.newPage({viewport:{width,height}});await p.goto('http://localhost:4180/?motion=full&v=application');await p.waitForFunction(()=>document.querySelector('.core-visual').dataset.renderer==='webgl');
 for(const [progress,stage] of [[0,'application'],[.5,'finding'],[.8,'correction'],[1,'retest'],[.5,'finding']]){
 await p.evaluate(progress=>{const j=document.querySelector('.hero'),s=document.querySelector('.hero-stage');scrollTo({top:(j.offsetHeight-s.offsetHeight)*progress,behavior:'instant'});},progress);await p.waitForTimeout(800);assert.equal(await p.locator('#core-canvas canvas').getAttribute('data-stage'),stage);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:`artifacts/application-${width}-${stage}.png`});
 }console.log(`PASS ${width}: application, finding, correction, retest and reverse scroll`);await p.close();}}finally{await b.close();}
