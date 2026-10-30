import test from 'node:test';
import assert from 'node:assert/strict';
import {immersivePose} from '../public/immersive-path.js';
test('camera crosses the O opening and settles facing the distant ASTRO mark',()=>{
 assert.ok(immersivePose(0).z>8);
 assert.equal(immersivePose(.5).z,0);
 assert.ok(immersivePose(.60).z<-1);
 assert.ok(immersivePose(1).aimZ<immersivePose(1).z);
 assert.deepEqual(immersivePose(-1),immersivePose(0));assert.deepEqual(immersivePose(2),immersivePose(1));
 let previous=immersivePose(0);for(let i=1;i<=1000;i++){const next=immersivePose(i/1000);for(const key of ['x','y','z','aimX','aimY','aimZ'])assert.ok(Math.abs(next[key]-previous[key])<.12);previous=next;}
 assert.equal(immersivePose(0).reveal,0);assert.equal(immersivePose(1).reveal,1);
});
