import {clamp,composeBrief,heroCopyVisibility} from './experience.js';

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
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));const blob=new Blob([composeBrief(data)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='astro-briefing-seguranca.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Briefing preparado. O download foi iniciado; nenhum dado foi enviado.';});

// The fixed header follows the real section below it, including direct anchor visits.
const lightSections=[...document.querySelectorAll('.section-light')];let sectionBounds=[];
function measureSections(){sectionBounds=lightSections.map(e=>({top:e.getBoundingClientRect().top+scrollY,bottom:e.getBoundingClientRect().bottom+scrollY}));}
function updateHeader(){const point=scrollY+header.offsetHeight*.5;header.classList.toggle('is-light',sectionBounds.some(e=>point>=e.top&&point<e.bottom));}

const hero=document.querySelector('.hero'),first=document.querySelector('.hero-copy'),second=document.querySelector('.hero-second'),visual=document.querySelector('.core-visual'),host=document.querySelector('#core-canvas');
const motion=matchMedia('(prefers-reduced-motion:reduce)');
const fullMotion=new URLSearchParams(location.search).get('motion')==='full';
let reduced=motion.matches&&!fullMotion,core=null,visible=true,target=0,current=0,frame=0,lastTime=0,orbitalTime=0,range=1,start=0;
function measure(){start=hero.offsetTop;range=Math.max(1,hero.offsetHeight-document.querySelector('.hero-stage').offsetHeight);measureSections();updateHeader();readScroll();if(core&&visible)requestFrame();}
function readScroll(){target=clamp((scrollY-start)/range);updateHeader();if(visible)requestFrame();}
function requestFrame(){if(!frame&&!document.hidden&&visible)frame=requestAnimationFrame(update);}
function update(now){frame=0;const dt=lastTime?Math.min((now-lastTime)/1000,.1):1/60;lastTime=now;current=reduced?target:current+(target-current)*(1-Math.exp(-dt/.065));if(Math.abs(target-current)<.0001)current=target;
 const visibility=heroCopyVisibility(current),showSecond=visibility.second>.5;
 first.style.opacity=String(visibility.first);first.style.visibility=visibility.first<.001?'hidden':'visible';first.inert=visibility.first<.01;first.setAttribute('aria-hidden',String(visibility.first<.01));
 second.style.opacity=String(visibility.second);second.style.visibility=visibility.second<.001?'hidden':'visible';second.setAttribute('aria-hidden',String(!showSecond));
 if(core?.isValid()){if(!reduced)orbitalTime+=dt;core.render(reduced?1:current,reduced?0:orbitalTime);}
 document.body.dataset.coreProgress=current.toFixed(3);document.body.dataset.motion=reduced?'reduced':'full';
 if(!reduced&&(core?.isValid()||current!==target))requestFrame();else lastTime=0;
}
const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){lastTime=0;readScroll();}else{if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;}},{threshold:0});observer.observe(hero);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;}else if(visible)requestFrame();});
motion.addEventListener('change',event=>{reduced=event.matches&&!fullMotion;requestFrame();});
addEventListener('scroll',readScroll,{passive:true});addEventListener('resize',measure,{passive:true});
const resizeObserver=new ResizeObserver(measure);resizeObserver.observe(document.querySelector('main'));resizeObserver.observe(document.querySelector('.hero-stage'));
measure();document.fonts.ready.then(measure);
try{const {createCore}=await import('./core.js');core=await createCore(host,{onFailure:()=>{visual.dataset.renderer='fallback';}});visual.dataset.renderer=core?.isValid()?'webgl':'fallback';measure();}catch{visual.dataset.renderer='fallback';}
