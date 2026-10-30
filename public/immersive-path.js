const clamp=n=>Math.max(0,Math.min(1,n));
export const smooth=(a,b,value)=>{const t=clamp((value-a)/(b-a));return t*t*(3-2*t);};
const frames=[
 {p:0,x:-.8,y:.45,z:9,aimX:-1.1,aimY:.05,aimZ:0},
 {p:.16,x:-.5,y:.32,z:7,aimX:-.45,aimY:.10,aimZ:-1},
 {p:.38,x:.22,y:.20,z:2.4,aimX:.25,aimY:.16,aimZ:-4},
 {p:.50,x:.2574,y:.1716,z:0,aimX:.2574,aimY:.1716,aimZ:-6},
 {p:.60,x:.20,y:.12,z:-1.8,aimX:.15,aimY:.05,aimZ:-8},
 {p:.80,x:.05,y:.05,z:-1.3,aimX:0,aimY:0,aimZ:-8},
 {p:1,x:0,y:0,z:-.2,aimX:0,aimY:0,aimZ:-8}
];
export function immersivePose(value){
 const p=clamp(value);let right=frames.findIndex(frame=>frame.p>=p);if(right===0)return {...frames[0],reveal:0};if(right<0)right=frames.length-1;
 const a=frames[right-1],b=frames[right],before=frames[Math.max(0,right-2)],after=frames[Math.min(frames.length-1,right+1)],duration=b.p-a.p,t=(p-a.p)/duration,t2=t*t,t3=t2*t;
 const pose={p,reveal:smooth(.35,.68,p)};
 for(const key of ['x','y','z','aimX','aimY','aimZ']){const ma=(b[key]-before[key])/(b.p-before.p)*duration,mb=(after[key]-a[key])/(after.p-a.p)*duration;pose[key]=(2*t3-3*t2+1)*a[key]+(t3-2*t2+t)*ma+(-2*t3+3*t2)*b[key]+(t3-t2)*mb;}
 return pose;
}
