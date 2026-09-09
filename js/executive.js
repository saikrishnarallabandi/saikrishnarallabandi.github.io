(() => {
const system = matchMedia('(prefers-color-scheme: dark)');
let saved; try { saved = localStorage.getItem('theme'); } catch {}
let chosen = ['light','dark'].includes(saved) ? saved : null;
const button = document.getElementById('theme-toggle');
function apply() { const dark = (chosen || (system.matches ? 'dark' : 'light')) === 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; button.textContent = dark ? 'Light mode' : 'Dark mode'; button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode'); }
apply(); system.addEventListener('change', () => { if (!chosen) apply(); });
button.addEventListener('click', () => { chosen = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('theme', chosen); } catch {} apply(); });
})();