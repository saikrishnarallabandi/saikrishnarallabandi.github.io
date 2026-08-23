const modeButtons = document.querySelectorAll('.mode-btn');
const modeLabel = document.getElementById('modeLabel');
const installBtn = document.getElementById('installBtn');

const modeCopy = {
  neutral: 'Neutral / default — calm, direct, attentive.',
  ops: 'Ops — controlled, alert, surgical clarity.',
  warm: 'Warm — private, reassuring, low-intensity warmth.',
  sangraha: 'Sangraha — public narratives, low-trust model testing.'
};

const setMode = (mode) => {
  document.body.dataset.mode = mode;
  localStorage.setItem('judith-mode', mode);
  modeLabel.textContent = modeCopy[mode] || modeCopy.neutral;
  if (mode === 'sangraha' && location.hash !== '#sangraha') {
    history.replaceState(null, '', '#sangraha');
  } else if (mode !== 'sangraha' && location.hash === '#sangraha') {
    history.replaceState(null, '', location.pathname + location.search);
  }

  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.getElementById('sangrahaPanel').hidden = mode !== 'sangraha';
};

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

setMode(location.hash === '#sangraha' ? 'sangraha' : (localStorage.getItem('judith-mode') || 'neutral'));

const esc = (value) =>
  String(value ?? '').replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[char]);

const fmtAgo = (iso) => {
  const time = new Date(iso).getTime();
  if (!time) return '';
  const hours = Math.max(0, (Date.now() - time) / 36e5);
  if (hours < 2) return 'fresh';
  if (hours < 36) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const renderMarkdownLite = (text) => {
  const lines = String(text || '').split(/\r?\n/);
  const out = [];
  let list = [];
  let paragraph = [];
  const flushList = () => {
    if (list.length) {
      out.push(`<ul>${list.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      list = [];
    }
  };
  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${paragraph.join(' ')}</p>`);
      paragraph = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
    } else if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      out.push(`<h3>${esc(line.slice(2))}</h3>`);
    } else if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      out.push(`<h4>${esc(line.slice(3))}</h4>`);
    } else if (line.startsWith('- ')) {
      flushParagraph();
      list.push(esc(line.slice(2)));
    } else {
      paragraph.push(esc(line));
    }
  }
  flushParagraph();
  flushList();
  return out.join('');
};

const renderSangraha = async () => {
  const summary = document.getElementById('sangrahaSummary');
  const grid = document.getElementById('narrativesGrid');
  const blog = document.getElementById('blogBody');
  if (!summary || !grid || !blog) return;

  try {
    const [narrativeResponse, blogResponse] = await Promise.all([
      fetch('./data/sangraha-narratives.json', { cache: 'no-store' }),
      fetch('./blog/sangraha-narratives.md', { cache: 'no-store' })
    ]);
    const data = await narrativeResponse.json();
    const blogText = await blogResponse.text();
    const items = data.items || [];
    const rising = items.filter((item) => item.status === 'rising').length;
    const evidence = items.reduce((sum, item) => sum + (Number(item.evidence) || 0), 0);

    summary.innerHTML = `
      <div class="summary-stat"><b>${items.length}</b><span>public narratives</span></div>
      <div class="summary-stat"><b>${rising}</b><span>rising</span></div>
      <div class="summary-stat"><b>${evidence}</b><span>evidence links</span></div>
      <div class="summary-stat"><b>${esc(data.model)}</b><span>${esc(data.modelRoute)}</span></div>
    `;

    grid.innerHTML = items.map((item) => {
      const tags = (item.tags || []).map((tag) => `<span class="chip">${esc(tag)}</span>`).join('');
      return `<article class="narrative-card">
        <div class="narrative-head">
          <span class="mom mom-${esc(item.status || 'tracked')}">${esc(item.status || 'tracked')}</span>
          <h3>${esc(item.title)}</h3>
        </div>
        <p>${esc(item.summary)}</p>
        <footer>
          <span>${esc(item.source || 'sangraha')}</span>
          <span>${esc(fmtAgo(item.lastEvidence))}</span>
          <span>${Number(item.evidence) || 0} evidence</span>
        </footer>
        <div class="tags">${tags}</div>
      </article>`;
    }).join('');

    blog.innerHTML = renderMarkdownLite(blogText);
  } catch (error) {
    summary.innerHTML = '<p class="error">Sangraha data unavailable.</p>';
    grid.innerHTML = '';
    blog.textContent = String(error);
  }
};

renderSangraha();

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
