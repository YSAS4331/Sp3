/* shortcut utils */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const create = e => document.createElement(e);
const event = detail => window.dispatchEvent(new CustomEvent('spa:router', { detail }));

/* normalize url */
const normalize = url => url.replace(/index(\.html)?$/, '');

/* state */
let activeStyles = [];
let activeModules = [];
let navId = 0;
let controller;
const pageCache = new Map();
const scrollMap = new Map();

/* once scripts registry */
const executedOnceScripts = new Set();

/* wait for transition */
const waitTransition = el =>
  new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    el?.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 300);
  });

/* fetch html (with cache + abort) */
async function fetchPage(path) {
  // if (pageCache.has(path)) return pageCache.get(path);

  controller?.abort();
  controller = new AbortController();

  const res = await fetch(path, { signal: controller.signal });
  if (!res.ok) throw new Error(res.status);

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const result = { doc, baseUrl: res.url };

  pageCache.set(path, result);
  return result;
}

/* link interceptor */
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a || !a.href) return;

  const url = new URL(a.href);

  if (url.origin !== location.origin || a.target === '_blank' || e.metaKey || e.ctrlKey) return;

  const to = normalize(url.href);
  const from = normalize(location.href);

  if (to === from && !url.hash) return;

  e.preventDefault();

  if (url.hash && to === from) {
    location.hash = url.hash;
    return;
  }

  navigate(url.pathname);
});

/* router core */
async function navigate(path, push = true) {
  if (!path) return;

  const id = ++navId;

  scrollMap.set(location.pathname, scrollY);

  event({ type: 'before' });

  const main = $('main');
  document.body.classList.add('load');

  const pTransition = waitTransition(main);
  const pFetch = fetchPage(path);

  try {
    const [{ doc, baseUrl }] = await Promise.all([pFetch, pTransition]);

    if (id !== navId) return;

    const nextMain = $('main', doc);
    if (!main || !nextMain) {
      document.body.classList.remove('load');
      console.log(doc)
      return;
    }

    cleanup();

    main.replaceWith(nextMain);

    document.title = doc.title;

    loadStyles(doc, baseUrl);

    if (push) history.pushState(null, '', path);

    const scroll = scrollMap.get(path) ?? 0;
    window.scrollTo(0, scroll);

    requestAnimationFrame(async () => {
      document.body.classList.remove('load');
      await loadPageScripts(doc, baseUrl);
    });

    event({ type: 'after' });
  } catch (err) {
    console.error('Nav failed:', err, err.name, err.message, err.stack);
    showErrorPage();
  }
}

/* inject styles (dedupe) */
function loadStyles(doc, base) {
  const links = $$('link[data-page]', doc);

  links.forEach(l => {
    const href = new URL(l.getAttribute('href'), base).href;

    if ($(`link[data-page][href="${href}"]`)) return;

    const link = create('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.page = '';

    document.head.appendChild(link);
    activeStyles.push(link);
  });
}

/* load page scripts (with once support) */
async function loadPageScripts(doc, base) {
  const scripts = $$('page-script[src]', doc);
  console.log(JSON.stringify(scripts))

  for (const s of scripts) {
    const rawUrl = new URL(s.getAttribute('src'), base);
    const isOnce = s.hasAttribute('once');

    // once じゃないときだけキャッシュバスターを付ける
    if (!isOnce) {
      rawUrl.searchParams.set('t', performance.now());
    }

    const url = rawUrl.href;

    // once かつ実行済みならスキップ
    if (isOnce && executedOnceScripts.has(url)) {
      continue;
    }

    const mod = await import(url);

    activeModules.push(mod);
    mod.init?.();
    console.log('正常に実行されました', mod, scripts);

    if (isOnce) {
      executedOnceScripts.add(url);
    }
  }
}


/* cleanup */
function cleanup() {
  activeModules.forEach(m => m.unmount?.());
  activeStyles.forEach(l => l.remove());

  activeModules = [];
  activeStyles = [];
}

/* error page (SPA内表示) */
function showErrorPage() {
  const main = $('main');
  if (!main) return location.reload();

  main.innerHTML = `
    <section class="router-error">
      <h1>Navigation failed</h1>
      <p>ページの読み込みに失敗しました</p>
      <button onclick="location.reload()">Reload</button>
    </section>
  `;

  document.body.classList.remove('load');
}

/* back/forward */
window.addEventListener('popstate', () => {
  navigate(location.pathname, false);
});

/* prefetch on hover */
document.addEventListener('mouseover', e => {
  const a = e.target.closest('a');
  if (!a || !a.href) return;

  const url = new URL(a.href);
  if (url.origin !== location.origin) return;

  fetchPage(url.pathname).catch(() => {});
});

/* init */
window.addEventListener('DOMContentLoaded', () => {
  activeStyles = $$('link[data-page]');
  loadPageScripts(document, location.href);
});
