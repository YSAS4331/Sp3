/* shortcut utils */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const create = (e) => document.createElement(e);
const event = (detail) =>
  window.dispatchEvent(new CustomEvent("spa:router", { detail }));

/* ---- normalize ---- */
function normalize(input) {
  const u = new URL(input, location.href);
  u.hash = "";
  u.searchParams.sort();
  return u.pathname + u.search;
}

/* state */
let activeStyles = [];
let activeModules = [];
let navId = 0;
let controller;
const htmlCache = new Map();
const scrollMap = new Map();
const executedOnceScripts = new Set();

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

/* ---- baseUrl ---- */
function deriveBaseUrl(responseUrl) {
  const u = new URL(responseUrl);
  const last = u.pathname.split("/").pop();

  if (last.includes(".")) {
    u.pathname = u.pathname.substring(0, u.pathname.lastIndexOf("/") + 1);
  } else if (!u.pathname.endsWith("/")) {
    u.pathname += "/";
  }

  u.search = "";
  u.hash = "";

  return u.href;
}

function resolveBase(doc, responseUrl) {
  const baseEl = $("base[href]", doc);
  if (baseEl) {
    return new URL(baseEl.getAttribute("href"), responseUrl).href;
  }
  return deriveBaseUrl(responseUrl);
}

/* ---- fetch html ---- */
async function fetchPage(pathWithQuery) {
  const key = normalize(pathWithQuery);
  console.log("[fetchPage] key:", key);

  if (htmlCache.has(key)) {
    console.log("[fetchPage] cache hit:", key);
    const cached = htmlCache.get(key);
    const doc = new DOMParser().parseFromString(cached.html, "text/html");
    return { doc, baseUrl: resolveBase(doc, cached.responseUrl), responseUrl: cached.responseUrl };
  }

  controller?.abort();
  controller = new AbortController();

  const res = await fetch(key, { signal: controller.signal });
  console.log("[fetchPage] response:", res.url);

  if (!res.ok) throw new Error(res.status);

  const html = await res.text();

  htmlCache.set(key, { html, responseUrl: res.url });

  const doc = new DOMParser().parseFromString(html, "text/html");
  return { doc, baseUrl: resolveBase(doc, res.url), responseUrl: res.url };
}

/* キャッシュ破棄 */
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
  const to = normalize(url.href);
  const from = normalize(location.href);

  console.log("[click]", "from:", from, "to:", to);

  if (
    url.origin !== location.origin ||
    a.target === "_blank" ||
    a.hasAttribute("download") ||
    e.metaKey ||
    e.ctrlKey
  )
    return;

  if (url.hash && to === from) {
    e.preventDefault();
    location.hash = url.hash;
    return;
  }

  if (to === from) return;

  e.preventDefault();
  navigate(to, true, url.hash);
});

/* スクロール位置を常時記録 */
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
  const from = normalize(location.href);

  console.log("[navigate]", "from:", from, "to:", key);

  const id = ++navId;

  scrollMap.set(normalize(location.href), scrollY);

  event({ type: "before" });

  const main = $("main");
  document.body.classList.add("load");

  const pTransition = waitTransition(main);
  const pFetch = fetchPage(key);

  try {
    const [{ doc, baseUrl, responseUrl }] = await Promise.all([pFetch, pTransition]);

    if (id !== navId) return;

    const nextMain = $("main", doc);
    if (!main || !nextMain) {
      document.body.classList.remove("load");
      return;
    }

    const nextScripts = $$("page-script[src]", doc);
    const nextStyleLinks = $$("link[data-page]", doc);

    cleanup();

    const adopted = document.adoptNode(nextMain);
    main.replaceWith(adopted);

    document.title = doc.title;
    syncMeta(doc);

    loadStyles(nextStyleLinks, baseUrl);

    if (push) history.pushState(null, "", key + hash);

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
      await loadPageScripts(nextScripts, baseUrl, responseUrl);
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

  nextStyleLinks.forEach((l) => {
    const href = new URL(l.getAttribute("href"), base).href;
    nextHrefs.add(href);
  });

  $$("link[data-page]").forEach((existing) => {
    if (!nextHrefs.has(existing.href)) {
      existing.remove();
    }
  });

  const newActiveStyles = [];

  nextHrefs.forEach((href) => {
    let existing = null;
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

/* onceスクリプトのキー */
function getScriptKey(rawHref) {
  const u = new URL(rawHref);
  return u.origin + u.pathname;
}

/* ---- ページスクリプト読み込み（script と同じ挙動） ---- */
async function loadPageScripts(scriptElements, base, responseUrl) {
  for (const s of scriptElements) {
    const raw = s.getAttribute("src");

    let resolved;
    if (raw.startsWith("/")) {
      resolved = new URL(raw, location.origin);
    } else {
      resolved = new URL(raw, responseUrl);
    }

    console.log("[script]", raw, "→", resolved.href);

    const isOnce = s.hasAttribute("once");
    const scriptKey = getScriptKey(resolved.href);

    if (isOnce && executedOnceScripts.has(scriptKey)) continue;

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
  const to = normalize(location.href);
  console.log("[popstate]", "to:", to);
  navigate(to, false);
});

/* prefetch on hover */
document.addEventListener("mouseover", (e) => {
  const a = e.target.closest("a");
  if (!a || !a.href) return;

  const url = new URL(a.href);
  const to = normalize(url.href);

  console.log("[prefetch]", "to:", to);

  if (url.origin !== location.origin) return;

  fetchPage(to).catch(() => {});
});

/* ---- init ---- */
window.addEventListener("DOMContentLoaded", () => {
  activeStyles = $$("link[data-page]");
  history.replaceState(null, "", normalize(location.href) + location.hash);

  const initBase = resolveBase(document, location.href);
  console.log("[init]", "base:", initBase);

  loadPageScripts($$("page-script[src]"), initBase, location.href);
});

/* 外部公開 */
window.spaRouter = { navigate, invalidateCache };
