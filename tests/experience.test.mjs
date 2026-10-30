import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitPose,heroCopyVisibility,composeBrief} from '../public/experience.js';
test('orbital perspective stays continuous, reversible and bounded while scrolling',()=>{
 assert.deepEqual(orbitPose(-1),orbitPose(0));assert.deepEqual(orbitPose(2),orbitPose(1));
 let last=orbitPose(0);for(let i=1;i<=1000;i++){const next=orbitPose(i/1000);for(const key of ['spread','yaw','tilt','roll'])assert.ok(Math.abs(next[key]-last[key])<.02);last=next;}
 const at=orbitPose(.45);orbitPose(.9);assert.deepEqual(orbitPose(.45),at);
 assert.ok(Math.abs(orbitPose(1).tilt-orbitPose(0).tilt)>.2);
 assert.ok(Math.abs(orbitPose(1).yaw-orbitPose(0).yaw)>.2);
});
test('hero headings never overlap while transitioning into the concrete analysis',()=>{
 assert.deepEqual(heroCopyVisibility(0),{first:1,second:0});
 assert.deepEqual(heroCopyVisibility(.5),{first:0,second:1});
 for(let i=0;i<=1000;i++){const v=heroCopyVisibility(i/1000);assert.ok(v.first<.001||v.second<.001);}
});
test('brief includes the scope but never pretends to have sent a request',()=>{
 const text=composeBrief({name:'Ana',company:'Empresa',email:'ana@example.com',service:'Web e APIs',scope:'Portal de clientes'});
 for(const value of ['Ana','Empresa','ana@example.com','Web e APIs','Portal de clientes'])assert.ok(text.includes(value));
 assert.ok(text.includes('Nenhuma análise foi executada'));
 assert.ok(!text.includes('enviado com sucesso'));
});
