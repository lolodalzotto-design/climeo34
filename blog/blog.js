document.documentElement.classList.add('motion-ready');
const nav=document.querySelector('.nav');
addEventListener('scroll',()=>nav?.classList.toggle('scrolled',scrollY>45),{passive:true});
document.querySelector('.burger')?.addEventListener('click',e=>{const menu=document.querySelector('.navlinks');const open=menu.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))});
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target)}}),{threshold:.1,rootMargin:'0px 0px -30px'});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'))}
