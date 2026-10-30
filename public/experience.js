export const clamp=(n)=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
export function heroCopyVisibility(value){return {first:1-ease((value-.12)/.14),second:ease((value-.28)/.10)};}
export function orbitPose(value){const p=clamp(value);return {spread:ease(p),tilt:.65+.38*ease(p),yaw:-.22+.40*p,roll:-.32+.42*ease(p)};}
export function composeBrief(data){return `ASTRO — Briefing de segurança\n\nNome: ${data.name.trim()}\nEmpresa: ${data.company.trim()}\nE-mail: ${data.email.trim()}\nInteresse: ${data.service}\n\nContexto e escopo desejado:\n${data.scope.trim()}\n\nEste documento foi preparado localmente para compartilhar com a equipe Astro.\nNenhuma análise foi executada e nenhum dado foi enviado pelo site.\nO escopo, as permissões e as condições do serviço precisam ser acordados antes de qualquer teste.\n`;}
