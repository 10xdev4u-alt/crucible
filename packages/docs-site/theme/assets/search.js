// Client-side search index loader and search-box behavior.
(() => {
  // Load the search index if not present yet.
  function ensureIndex() {
    if (window.__CRUCIBLE_INDEX__) return Promise.resolve(window.__CRUCIBLE_INDEX__);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/assets/search-index.js';
      s.onload = () => resolve(window.__CRUCIBLE_INDEX__ || []);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function debounce(fn, ms) {
    let h;
    return (...args) => {
      clearTimeout(h);
      h = setTimeout(() => fn(...args), ms);
    };
  }

  function htmlEscape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function search(query, index) {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const tokens = q.split(/\s+/);
    const scored = [];
    for (const page of index) {
      const _haystack =
        `${page.title} ${page.description} ${page.body} ${page.category}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (!t) continue;
        if (page.title.toLowerCase().includes(t)) score += 10;
        if (page.description.toLowerCase().includes(t)) score += 5;
        if (page.body.toLowerCase().includes(t)) score += 1;
        if (page.category.toLowerCase().includes(t)) score += 2;
      }
      if (score > 0) scored.push({ page, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map((s) => s.page);
  }

  function attach() {
    const input = document.querySelector('.search');
    if (!input) return;

    const results = document.createElement('div');
    results.className = 'search-results';
    results.setAttribute('role', 'listbox');
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(results);

    const showResults = (pages) => {
      if (pages.length === 0) {
        results.classList.remove('active');
        results.innerHTML = '';
        return;
      }
      results.innerHTML = pages
        .map(
          (p, i) => `
        <a href="${p.url}" class="search-result ${i === 0 ? 'active' : ''}" data-index="${i}">
          <div>
            <span class="search-result-title">${escape(p.title)}</span>
            <span class="search-result-category">${escape(p.category)}</span>
          </div>
          <div class="search-result-snippet">${htmlEscape((p.description || p.body).slice(0, 120))}</div>
        </a>`,
        )
        .join('');
      results.classList.add('active');
    };

    const onInput = debounce(async () => {
      const index = await ensureIndex();
      const pages = search(input.value, index);
      showResults(pages);
    }, 120);

    input.addEventListener('input', onInput);
    input.addEventListener('focus', onInput);
    input.addEventListener('blur', () => {
      setTimeout(() => results.classList.remove('active'), 150);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        results.classList.remove('active');
        input.blur();
      } else if (e.key === 'Enter') {
        const first = results.querySelector('.search-result');
        if (first) {
          e.preventDefault();
          first.click();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
