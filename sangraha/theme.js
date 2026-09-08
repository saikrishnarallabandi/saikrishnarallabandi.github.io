(() => {
  const system=window.matchMedia('(prefers-color-scheme: dark)');
  let choice=null;
  try {const saved=localStorage.getItem('sangraha-theme');if(['light','dark'].includes(saved))choice=saved;} catch {}
  function apply() {
    const dark=(choice|| (system.matches?'dark':'light'))==='dark';
    document.documentElement.dataset.theme=dark?'dark':'light';
    const button=document.getElementById('theme-toggle');
    if(button){button.textContent=dark?'Light mode':'Dark mode';button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');button.setAttribute('aria-pressed',String(dark));}
  }
  apply();
  system.addEventListener('change',()=>{if(!choice)apply();});
  document.addEventListener('DOMContentLoaded',()=>{
    apply();
    document.getElementById('theme-toggle')?.addEventListener('click',()=>{
      choice=document.documentElement.dataset.theme==='dark'?'light':'dark';
      try {localStorage.setItem('sangraha-theme',choice);} catch {}
      apply();
    });
  });
})();
