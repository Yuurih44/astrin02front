import {composeBrief} from './experience.js';

const header=document.querySelector('.header'),menuButton=document.querySelector('.menu-toggle'),menu=document.querySelector('.mobile-menu');
function closeMenu(restoreFocus=false){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menu');header.classList.remove('menu-open');document.body.style.overflow='';if(restoreFocus)menuButton.focus();}
menuButton.addEventListener('click',()=>{const open=menu.hidden;if(open){menu.hidden=false;menuButton.setAttribute('aria-expanded','true');menuButton.setAttribute('aria-label','Fechar menu');header.classList.add('menu-open');document.body.style.overflow='hidden';menu.querySelector('a').focus();}else closeMenu();});
menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();closeMenu();const section=document.querySelector(link.getAttribute('href')),heading=section?.querySelector('h2')??section;if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});section.scrollIntoView({block:'start'});history.pushState(null,'',link.getAttribute('href'));}}));
document.addEventListener('keydown',event=>{if(menu.hidden)return;if(event.key==='Escape'){closeMenu(true);return;}if(event.key==='Tab'){const links=[...menu.querySelectorAll('a')],first=menuButton,last=links.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
matchMedia('(min-width:761px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

// Keep each specialty readable without accumulating several expanded panels.
const services=[...document.querySelectorAll('.service-list details')];
services.forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)services.forEach(other=>{if(other!==detail)other.open=false;});}));

const form=document.querySelector('#brief-form'),status=document.querySelector('.form-status');
const localIntake=document.querySelector('.local-intake'),saveLocal=document.querySelector('#save-local');
let localEnabled=false,saving=false;
const fieldMessages={name:'Informe um nome de até 100 caracteres.',company:'Informe uma empresa de até 150 caracteres.',email:'Informe um e-mail válido de até 200 caracteres.',service:'Escolha uma das opções de avaliação.',scope:'Informe um contexto entre 10 e 3000 caracteres.'};
const fieldErrors=new Map();
for(const name of Object.keys(fieldMessages)){
 const field=form.elements.namedItem(name),error=document.createElement('span');
 error.id='error-'+name;error.className='field-error';error.hidden=true;field.insertAdjacentElement('afterend',error);field.setAttribute('aria-describedby',error.id);fieldErrors.set(name,error);
 field.addEventListener('input',()=>{field.removeAttribute('aria-invalid');error.hidden=true;error.textContent='';});
}
function clearFieldErrors(){for(const [name,error] of fieldErrors){form.elements.namedItem(name).removeAttribute('aria-invalid');error.hidden=true;error.textContent='';}}
function readBrief(){return Object.fromEntries(new FormData(form));}
form.addEventListener('submit',event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const data=readBrief();data.service=form.elements.namedItem('service').selectedOptions[0].textContent;
 const blob=new Blob([composeBrief(data)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='astro-briefing-seguranca.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 status.textContent='Briefing preparado. O download foi iniciado; nenhum dado foi enviado nesta ação.';
});
// Capability discovery carries no form data; errors preserve download mode.
fetch('/api/capabilities',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(5000)})
 .then(response=>response.ok?response.json():null)
 .then(capabilities=>{localEnabled=capabilities?.intake?.enabled===true&&capabilities.intake.mode==='local-demo';localIntake.hidden=!localEnabled;})
 .catch(()=>{});
saveLocal.addEventListener('click',async()=>{
 if(!localEnabled||saving||!form.reportValidity())return;
 clearFieldErrors();saving=true;saveLocal.disabled=true;saveLocal.textContent='Salvando…';status.textContent='Salvando o pedido neste computador…';
 try{
  const response=await fetch('/api/assessment-requests',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(readBrief()),signal:AbortSignal.timeout(15000)});
  const result=await response.json().catch(()=>null);
  if(response.status===201&&result?.status==='received'&&typeof result.id==='string'&&result.id.length){status.textContent='Pedido salvo localmente neste computador. Nenhum e-mail ou mensagem de WhatsApp foi enviado.';return;}
  if(response.status===422){
   const fields=result?.error?.fields,names=Array.isArray(fields)?fields:fields&&typeof fields==='object'?Object.keys(fields):[];
   for(const name of names){if(!fieldErrors.has(name))continue;const field=form.elements.namedItem(name),error=fieldErrors.get(name);field.setAttribute('aria-invalid','true');error.textContent=fieldMessages[name];error.hidden=false;}
   status.textContent='Revise os campos indicados e tente novamente. Você também pode baixar o briefing.';
   form.querySelector('[aria-invalid="true"]')?.focus();
  }else{status.textContent='Não foi possível confirmar o salvamento local. Os campos foram mantidos; você pode tentar novamente ou baixar o briefing.';}
 }catch{status.textContent='Não foi possível confirmar o salvamento local. Os campos foram mantidos; você pode tentar novamente ou baixar o briefing.';}
 finally{saving=false;saveLocal.disabled=false;saveLocal.textContent='Salvar pedido localmente';}
});

// The fixed header follows the real section below it, including direct anchor visits.
const lightSections=[...document.querySelectorAll('.section-light')];let sectionBounds=[];
function measureSections(){sectionBounds=lightSections.map(e=>({top:e.getBoundingClientRect().top+scrollY,bottom:e.getBoundingClientRect().bottom+scrollY}));}
function updateHeader(){const point=scrollY+header.offsetHeight*.5;header.classList.toggle('is-light',sectionBounds.some(e=>point>=e.top&&point<e.bottom));}

function measure(){measureSections();updateHeader();}
addEventListener('scroll',updateHeader,{passive:true});addEventListener('resize',measure,{passive:true});
new ResizeObserver(measure).observe(document.querySelector('main'));
measure();document.fonts.ready.then(measure);
