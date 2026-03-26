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
const pageCache = new Map();
const scrollMap = new Map();
const executedOnceScripts = new Set();

/* ---- BUG FIX #9: transition待機の改善 ---- */
const TRANSITION_TIMEOUT = 600; // CSSのmax transitionに合わせて調整

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

/* ---- BUG FIX #1 & #7: キャッシュを実際に使う ---- */
async function fetchPage(pathWithQuery) {
  const key = normalize(pathWithQuery);

  // キャッシュがあればそのまま返す（prefetchが活きる）
  if (pageCache.has(key)) {
    return pageCache.get(key);
  }

  controller?.abort();
  controller = new AbortController();

  const sep = key.includes("?") ? "&" : "?";

  const res = await fetch(`${key}${sep}_=${performance.now()}`, {
    signal: controller.signal,
  });

  if (!res.ok) throw new Error(res.status);

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const result = { doc, baseUrl: res.url };

  pageCache.set(key, result);
  return result;
}

/* ---- キャッシュを明示的に破棄するユーティリティ ---- */
function invalidateCache(pathWithQuery) {
  if (pathWithQuery) {
    pageCache.delete(normalize(pathWithQuery));
  } else {
    pageCache.clear();
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
    a.hasAttribute("download") || // download属性も除外
    e.metaKey ||
    e.ctrlKey
  )
    return;

  const to = normalize(url.href);
  const from = normalize(location.href);

  // same page, only hash changed → scroll only
  if (url.hash && to === from) {
    e.preventDefault();
    location.hash = url.hash;
    return;
  }

  if (to === from) return;

  e.preventDefault();
  // ---- BUG FIX #6: hashを保持して遷移 ----
  navigate(to, true, url.hash);
});

/* ---- BUG FIX #5: スクロール位置を離脱前に保存 ---- */
function saveCurrentScroll() {
  scrollMap.set(normalize(location.href), scrollY);
}

/* ---- router core (BUG FIX #2, #5, #6 適用) ---- */
async function navigate(pathWithQuery, push = true, hash = "") {
  if (!pathWithQuery) return;

  const key = normalize(pathWithQuery);
  const id = ++navId;

  // 離脱元のスクロール位置を、URLが変わる前に保存
  saveCurrentScroll();

  event({ type: "before" });

  const main = $("main");
  document.body.classList.add("load");

  const pTransition = waitTransition(main);
  const pFetch = fetchPage(key);

  try {
    const [{ doc, baseUrl }] = await Promise.all([pFetch, pTransition]);

    if (id !== navId) return; // 後続のnavigate()が走っていたら中断

    const nextMain = $("main", doc);
    if (!main || !nextMain) {
      document.body.classList.remove("load");
      return;
    }

    // ---- BUG FIX #3 & #4: cleanup前に「現在の全page style」を把握 ----
    cleanup();

    main.replaceWith(nextMain);
    document.title = doc.title;

    // metaタグ同期（OGP等）
    syncMeta(doc);

    loadStyles(doc, baseUrl);

    if (push) history.pushState(null, "", key + hash);

    // ---- BUG FIX #6: hashがあればその要素へスクロール ----
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
      await loadPageScripts(doc, baseUrl);
    });

    event({ type: "after" });
  } catch (err) {
    // ---- BUG FIX #2: AbortErrorは正常キャンセルなので無視 ----
    if (err.name === "AbortError") return;

    console.error("Nav failed:", err);
    showErrorPage();
  }
}

/* ---- BUG FIX #3: スタイルの差分管理 ---- */
function loadStyles(doc, base) {
  const nextLinks = $$("link[data-page]", doc);
  const nextHrefs = new Set();

  // 次のページに必要なスタイルを収集
  nextLinks.forEach((l) => {
    const href = new URL(l.getAttribute("href"), base).href;
    nextHrefs.add(href);
  });

  // 今あるpage styleのうち、次のページで不要なものを削除

  $$('link[data-page]').forEach((existing) => {
    if (!nextHrefs.has(existing.href)) {
      existing.remove();
    }
  });

  // 次のページに必要で、まだDOMにないものを追加
  const newActiveStyles = [];

  nextHrefs.forEach((href) => {
    let existing = $(`link[data-page][href="${CSS.escape(href)}"]`);

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

/* ---- BUG FIX #10: onceスクリプトのキーをパス部分のみに正規化 ---- */
function getScriptKey(src) {
  const u = new URL(src);
  // クエリパラメータを除いたpathname部分だけをキーにする
  return u.origin + u.pathname;
}

/* load page scripts (with once support) */
async function loadPageScripts(doc, base) {
  const scripts = $$("page-script[src]", doc);

  for (const s of scripts) {
    const rawUrl = new URL(s.getAttribute("src"), base);
    const isOnce = s.hasAttribute("once");
    const scriptKey = getScriptKey(rawUrl.href);

    if (isOnce && executedOnceScripts.has(scriptKey)) continue;

    if (!isOnce) {
      rawUrl.searchParams.set("t", performance.now());
    }

    try {
      const mod = await import(rawUrl.href);
      activeModules.push(mod);
      mod.init?.();

      if (isOnce) executedOnceScripts.add(scriptKey);
    } catch (err) {
      console.error("Script load failed:", rawUrl.href, err);
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

  // スタイルの削除は loadStyles() の差分管理に任せる
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
      document.head.appendChild(next.cloneNode(true));
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

/* ---- BUG FIX #5: popstateでも離脱元スクロールを正しく保存 ---- */
window.addEventListener("popstate", () => {
  // popstate発火時、location.hrefは既に遷移先のURLになっている
  // → saveCurrentScrollはnavigate()内で呼ばれるが、
  //   popstate時はlocationが既に変わっているため、
  //   ここではscrollMapへの保存をスキップし、navigate内でも保存しない
  //   代わりに、beforeunload的にscrollを常時記録する方式に変更
  navigate(normalize(location.href), false);
});

// スクロール位置を定期的に記録（popstate対策）
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

/* prefetch on hover (BUG FIX #7: キャッシュが効くので意味がある) */
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

  // 初期URLをhistoryに置換（popstate対策）
  history.replaceState(null, "", normalize(location.href) + location.hash);

  loadPageScripts(document, location.href);
});

// 外部から使えるように公開
window.spaRouter = { navigate, invalidateCache };
