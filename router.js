/* shortcut utils */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const create = (e) => document.createElement(e);
const event = (detail) =>
  window.dispatchEvent(new CustomEvent("spa:router", { detail }));

/* normalize url (force remove trailing slash, strip hash) */
const normalize = (url) => {
  const u = new URL(url, location.origin);
  let path = u.pathname.replace(/\/+$/, "");
  if (path === "") path = "/";
  return path + u.search;
};

/* state */
let activeStyles = [];
let activeModules = [];
let navId = 0;
let controller;
const htmlCache = new Map(); // HTMLテキストをキャッシュ
const scrollMap = new Map();
const executedOnceScripts = new Set();

/* transition timeout (CSSに合わせて調整) */
const TRANSITION_TIMEOUT = 600;

const waitTransition = (el) =>
  new Promise((resolve) => {
    if (!el) return resolve();
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    el.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, TRANSITION_TIMEOUT);
  });

/* ---- fetch html (キャッシュはテキスト段階で保存) ---- */
async function fetchPage(pathWithQuery) {
  const key = normalize(pathWithQuery);

  // キャッシュにHTMLテキストがあればパースして返す
  if (htmlCache.has(key)) {
    const cached = htmlCache.get(key);
    const doc = new DOMParser().parseFromString(cached.html, "text/html");
    return { doc, baseUrl: cached.baseUrl };
  }

  controller?.abort();
  controller = new AbortController();

  // 元のパスをそのままfetch（余計なパラメータを付けない）
  const res = await fetch(key, { signal: controller.signal });
  if (!res.ok) throw new Error(res.status);

  const html = await res.text();

  // HTMLテキストとbaseUrlをキャッシュ
  htmlCache.set(key, { html, baseUrl: res.url });

  const doc = new DOMParser().parseFromString(html, "text/html");
  return { doc, baseUrl: res.url };
}

/* キャッシュ破棄ユーティリティ */
function invalidateCache(pathWithQuery) {
  if (pathWithQuery) {
    htmlCache.delete(normalize(pathWithQuery));
  } else {
    htmlCache.clear();
  }
}

/* link interceptor */
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a || !a.href) return;

  const url = new URL(a.href);

  if (
    url.origin !== location.origin ||
    a.target === "_blank" ||
    a.hasAttribute("download") ||
    e.metaKey ||
    e.ctrlKey
  )
    return;

  const to = normalize(url.href);
  const from = normalize(location.href);

  if (url.hash && to === from) {
    e.preventDefault();
    location.hash = url.hash;
    return;
  }

  if (to === from) return;

  e.preventDefault();
  navigate(to, true, url.hash);
});

/* スクロール位置を保存 */
let scrollTimer;
window.addEventListener(
  "scroll",
  () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      scrollMap.set(normalize(location.href), scrollY);
    }, 100);
  },
  { passive: true }
);

/* ---- router core ---- */
async function navigate(pathWithQuery, push = true, hash = "") {
  if (!pathWithQuery) return;

  const key = normalize(pathWithQuery);
  const id = ++navId;

  // 離脱元のスクロール位置を保存
  scrollMap.set(normalize(location.href), scrollY);

  event({ type: "before" });

  const main = $("main");
  document.body.classList.add("load");

  const pTransition = waitTransition(main);
  const pFetch = fetchPage(key);

  try {
    const [{ doc, baseUrl }] = await Promise.all([pFetch, pTransition]);

    if (id !== navId) return;

    const nextMain = $("main", doc);
    if (!main || !nextMain) {
      document.body.classList.remove("load");
      return;
    }

    // ---- mainをreplaceする前にscripts/stylesを取得 ----
    const nextScripts = $$("page-script[src]", doc);
    const nextStyleLinks = $$("link[data-page]", doc);

    // cleanup (前ページのモジュールunmount + 不要スタイル削除)
    cleanup();

    // ---- adoptNodeでDOMParserのノードを現在のdocumentに取り込む ----
    const adopted = document.adoptNode(nextMain);
    main.replaceWith(adopted);

    document.title = doc.title;
    syncMeta(doc);

    // スタイル適用
    loadStyles(nextStyleLinks, baseUrl);

    if (push) history.pushState(null, "", key + hash);

    // スクロール処理
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      const scroll = push ? 0 : (scrollMap.get(key) ?? 0);
      window.scrollTo(0, scroll);
    }

    requestAnimationFrame(async () => {
      document.body.classList.remove("load");
      await loadPageScripts(nextScripts, baseUrl);
    });

    event({ type: "after" });
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("Nav failed:", err);
    showErrorPage();
  }
}

/* ---- スタイル差分管理 ---- */
function loadStyles(nextStyleLinks, base) {
  const nextHrefs = new Set();

  // 次のページに必要なhrefを収集（元のhrefをそのまま解決）
  nextStyleLinks.forEach((l) => {
    const href = new URL(l.getAttribute("href"), base).href;
    nextHrefs.add(href);
  });

  // 現在のpage styleで不要なものを削除

  $$("link[data-page]").forEach((existing) => {
    if (!nextHrefs.has(existing.href)) {
      existing.remove();
    }
  });

  // まだDOMにないものを追加
  const newActiveStyles = [];

  nextHrefs.forEach((href) => {
    let existing = null;

    // 既存のlink[data-page]から一致するものを探す
    for (const el of $$("link[data-page]")) {
      if (el.href === href) {
        existing = el;
        break;
      }
    }

    if (!existing) {
      existing = create("link");
      existing.rel = "stylesheet";
      existing.href = href;
      existing.dataset.page = "";
      document.head.appendChild(existing);
    }

    newActiveStyles.push(existing);
  });

  activeStyles = newActiveStyles;
}

/* ---- onceスクリプトのキー（パス部分のみ） ---- */
function getScriptKey(rawHref) {
  const u = new URL(rawHref);
  return u.origin + u.pathname;
}

/* ---- ページスクリプト読み込み ---- */
async function loadPageScripts(scriptElements, base) {
  for (const s of scriptElements) {
    // 元のsrc属性をそのまま解決
    const resolved = new URL(s.getAttribute("src"), base);
    const isOnce = s.hasAttribute("once");
    const scriptKey = getScriptKey(resolved.href);

    if (isOnce && executedOnceScripts.has(scriptKey)) continue;

    // onceでないスクリプトだけキャッシュバスター付与（再実行のため）
    if (!isOnce) {
      resolved.searchParams.set("t", performance.now());
    }

    try {
      const mod = await import(resolved.href);
      activeModules.push(mod);
      mod.init?.();
      if (isOnce) executedOnceScripts.add(scriptKey);
    } catch (err) {
      console.error("Script load failed:", resolved.href, err);
    }
  }
}

/* cleanup */
function cleanup() {
  activeModules.forEach((m) => {
    try {
      m.unmount?.();
    } catch (err) {
      console.error("Unmount failed:", err);
    }
  });

  activeModules = [];
  activeStyles = [];
}

/* meta同期 */
function syncMeta(doc) {
  const selectors = [
    'meta[name="description"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:image"]',
  ];

  selectors.forEach((sel) => {
    const next = $(sel, doc);
    const current = $(sel);

    if (next && current) {
      current.setAttribute("content", next.getAttribute("content"));
    } else if (next && !current) {
      document.head.appendChild(document.adoptNode(next));
    } else if (!next && current) {
      current.remove();
    }
  });
}

/* error page */
function showErrorPage() {
  const main = $("main");
  if (!main) return location.reload();

  main.innerHTML = `
    <section class="router-error">
      <h1>Navigation failed</h1>
      <p>ページの読み込みに失敗しました</p>
      <button onclick="location.reload()">Reload</button>
    </section>
  `;

  document.body.classList.remove("load");
}

/* back/forward */
window.addEventListener("popstate", () => {
  navigate(normalize(location.href), false);
});

/* prefetch on hover */
document.addEventListener("mouseover", (e) => {
  const a = e.target.closest("a");
  if (!a || !a.href) return;

  const url = new URL(a.href);
  if (url.origin !== location.origin) return;

  fetchPage(normalize(url.href)).catch(() => {});
});

/* init */
window.addEventListener("DOMContentLoaded", () => {
  activeStyles = $$("link[data-page]");
  history.replaceState(null, "", normalize(location.href) + location.hash);
  loadPageScripts($$("page-script[src]"), location.href);
});

/* 外部公開 */
window.spaRouter = { navigate, invalidateCache };
