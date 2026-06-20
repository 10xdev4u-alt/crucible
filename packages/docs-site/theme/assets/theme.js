// Theme toggle and code copy buttons
(() => {
  const STORAGE_KEY = 'crucible-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function loadTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }

  function attachThemeToggle() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  }

  function attachCodeCopyButtons() {
    const pres = document.querySelectorAll('.content pre');
    pres.forEach((pre) => {
      if (pre.querySelector('.copy')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code');
        if (!code) return;
        navigator.clipboard.writeText(code.textContent || '').then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => (btn.textContent = orig), 1200);
        });
      });
      wrapper.appendChild(btn);
    });
  }

  function init() {
    applyTheme(loadTheme());
    attachThemeToggle();
    attachCodeCopyButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
