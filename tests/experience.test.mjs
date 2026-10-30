import test from 'node:test';
import assert from 'node:assert/strict';
import {wordmarkPose,letterEntrance,heroCopyVisibility,composeBrief} from '../public/experience.js';
test('the initial A forms ASTRO continuously, in letter order and reversibly',()=>{
 assert.deepEqual(wordmarkPose(-1),wordmarkPose(0));assert.deepEqual(wordmarkPose(2),wordmarkPose(1));
 assert.deepEqual(wordmarkPose(0).letters,[1,0,0,0,0]);assert.deepEqual(wordmarkPose(1).letters,[1,1,1,1,1]);
 let last=wordmarkPose(0);for(let i=1;i<=1000;i++){const next=wordmarkPose(i/1000);assert.ok(Math.abs(next.aMix-last.aMix)<.02);for(let j=0;j<5;j++){assert.ok(next.letters[j]>=next.letters[j+1]||j===4);assert.ok(Math.abs(next.letters[j]-last.letters[j])<.02);}last=next;}
 const at=wordmarkPose(.45);wordmarkPose(.9);assert.deepEqual(wordmarkPose(.45),at);
});
test('hero headings never overlap while transitioning into the concrete analysis',()=>{
 assert.deepEqual(heroCopyVisibility(0),{first:1,second:0});
 assert.deepEqual(heroCopyVisibility(.5),{first:0,second:1});
 for(let i=0;i<=1000;i++){const v=heroCopyVisibility(i/1000);assert.ok(v.first<.001||v.second<.001);}
});
test('each letter starts behind the A and reaches its final position without crossing in front',()=>{
 const start=letterEntrance(0,-2,2),end=letterEntrance(1,-2,2);
 assert.equal(start.x,-2);assert.ok(start.z<-1);assert.equal(start.opacity,0);
 assert.equal(end.x,2);assert.equal(end.z,0);assert.equal(end.opacity,1);
 let previous=start;for(let i=1;i<1000;i++){const next=letterEntrance(i/1000,-2,2);assert.ok(next.z<0);assert.ok(Math.abs(next.x-previous.x)<.02);assert.ok(Math.abs(next.z-previous.z)<.02);previous=next;}
});
test('brief includes the scope but never pretends to have sent a request',()=>{
 const text=composeBrief({name:'Ana',company:'Empresa',email:'ana@example.com',service:'Web e APIs',scope:'Portal de clientes'});
 for(const value of ['Ana','Empresa','ana@example.com','Web e APIs','Portal de clientes'])assert.ok(text.includes(value));
 assert.ok(text.includes('Nenhuma análise foi executada'));
 assert.ok(!text.includes('enviado com sucesso'));
});
