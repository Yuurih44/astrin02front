export const clamp=(n)=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
export function corePose(value){const p=clamp(value);return {open:ease((p-.10)/.85),yaw:-.35+p*.85,tilt:.18-p*.12};}
export function composeBrief(data){return `ASTRO — Briefing de segurança\n\nNome: ${data.name.trim()}\nEmpresa: ${data.company.trim()}\nE-mail: ${data.email.trim()}\nInteresse: ${data.service}\n\nContexto e escopo desejado:\n${data.scope.trim()}\n\nEste documento foi preparado localmente para compartilhar com a equipe Astro.\nNenhuma análise foi executada e nenhum dado foi enviado pelo site.\nO escopo, as permissões e as condições do serviço precisam ser acordados antes de qualquer teste.\n`;}
