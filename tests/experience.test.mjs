import test from 'node:test';
import assert from 'node:assert/strict';
import {corePose,composeBrief} from '../public/experience.js';
test('core opens continuously, reversibly, and clamps scroll',()=>{
 assert.deepEqual(corePose(-1),corePose(0));assert.deepEqual(corePose(2),corePose(1));
 assert.equal(corePose(0).open,0);assert.equal(corePose(1).open,1);
 let last=corePose(0);for(let i=1;i<=1000;i++){const next=corePose(i/1000);for(const key of ['open','yaw','tilt'])assert.ok(Math.abs(next[key]-last[key])<.02);last=next;}
 const at=corePose(.45);corePose(.9);assert.deepEqual(corePose(.45),at);
});
test('brief includes the scope but never pretends to have sent a request',()=>{
 const text=composeBrief({name:'Ana',company:'Empresa',email:'ana@example.com',service:'Web e APIs',scope:'Portal de clientes'});
 for(const value of ['Ana','Empresa','ana@example.com','Web e APIs','Portal de clientes'])assert.ok(text.includes(value));
 assert.ok(text.includes('Nenhuma análise foi executada'));
 assert.ok(!text.includes('enviado com sucesso'));
});
