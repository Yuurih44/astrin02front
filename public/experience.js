export const clamp=(n)=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
export function heroCopyVisibility(value){return {first:1-ease((value-.12)/.14),second:ease((value-.28)/.10)};}
export function wordmarkPose(value){const p=clamp(value);return {assemble:ease(p),anchorMix:ease((p-.02)/.36),letters:[ease((p-.62)/.25),ease((p-.48)/.25),ease((p-.34)/.25),ease((p-.20)/.25),1]};}
export function letterEntrance(value,originX,targetX){const t=clamp(value),arc=t===1?0:Math.sin(t*Math.PI);return {x:originX+(targetX-originX)*t,y:arc*.12,z:t===1?0:-1.9*(1-t)-arc*.5,opacity:ease((t-.01)/.16)};}
export function composeBrief(data){return `ASTRO — Briefing de segurança\n\nNome: ${data.name.trim()}\nEmpresa: ${data.company.trim()}\nE-mail: ${data.email.trim()}\nInteresse: ${data.service}\n\nContexto e escopo desejado:\n${data.scope.trim()}\n\nEste documento foi preparado localmente para compartilhar com a equipe Astro.\nNenhuma análise foi executada e nenhum dado foi enviado pelo site.\nO escopo, as permissões e as condições do serviço precisam ser acordados antes de qualquer teste.\n`;}
