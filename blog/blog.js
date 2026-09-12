document.documentElement.classList.add('motion-ready');
const nav=document.querySelector('.nav');
addEventListener('scroll',()=>nav?.classList.toggle('scrolled',scrollY>45),{passive:true});
document.querySelector('.burger')?.addEventListener('click',e=>{const menu=document.querySelector('.navlinks');const open=menu.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))});
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target)}}),{threshold:.1,rootMargin:'0px 0px -30px'});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'))}

const contactDock=document.createElement('div');
contactDock.className='contact-dock';
contactDock.setAttribute('role','complementary');
contactDock.setAttribute('aria-label','Appel ou WhatsApp rapide');
contactDock.innerHTML='<a class="contact-dock-call" href="tel:0603257679" aria-label="Appeler Climeo34 au 06 03 25 76 79"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.36 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a><a class="contact-dock-wa" href="https://wa.me/33603257679" aria-label="Contacter Climeo34 sur WhatsApp" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.914 2C6.441 2 2 6.441 2 11.914c0 1.892.523 3.661 1.432 5.178L2 22l5.087-1.404C8.536 21.46 10.194 22 11.914 22 17.387 22 22 17.387 22 11.914 22 6.441 17.387 2 11.914 2z"/></svg></a>';
document.body.append(contactDock);

const footer=document.querySelector('footer');
if(footer&&'IntersectionObserver'in window){new IntersectionObserver(entries=>contactDock.classList.toggle('is-near-footer',entries[0].isIntersecting),{threshold:.05}).observe(footer)}
