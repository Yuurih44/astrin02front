import test from 'node:test';
import assert from 'node:assert/strict';
import {applicationPose,heroCopyVisibility,composeBrief} from '../public/experience.js';
test('application layers open continuously, reversibly, and clamp scroll',()=>{
 assert.deepEqual(applicationPose(-1),applicationPose(0));assert.deepEqual(applicationPose(2),applicationPose(1));
 assert.equal(applicationPose(0).open,0);assert.equal(applicationPose(1).open,1);
 let last=applicationPose(0);for(let i=1;i<=1000;i++){const next=applicationPose(i/1000);for(const key of ['open','yaw','tilt','finding','fixed','verified'])assert.ok(Math.abs(next[key]-last[key])<.02);last=next;}
 const at=applicationPose(.45);applicationPose(.9);assert.deepEqual(applicationPose(.45),at);
});
test('application illustrates a permission finding, correction and retest in sequence',()=>{
 assert.equal(applicationPose(0).stage,'application');
 assert.equal(applicationPose(.5).stage,'finding');
 assert.equal(applicationPose(.8).stage,'correction');
 assert.equal(applicationPose(1).stage,'retest');
 assert.equal(applicationPose(.5).fixed,0);
 assert.equal(applicationPose(.8).verified,0);
 assert.equal(applicationPose(1).verified,1);
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
