class Sp3Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
/* ====== ヘッダー専用 CSS ====== */
#global-header {
  height: 60px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(28px) saturate(180%);
  border-bottom: 1px solid var(--accent-border);
  box-shadow: var(--glass-inner-shadow), var(--accent-glow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-sizing: border-box;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 20;
}

#header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  box-shadow: var(--glass-inner-shadow);
}

#header-title h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

#header-title img {
  height: 32px;
  width: 32px;
  border-radius: 8px;
}

#global-header a {
  color: var(--accent-strong);
  text-decoration: none;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: var(--radius);
  transition: 0.15s ease;
}

#global-header a:hover {
  background: rgba(183, 245, 200, 0.25);
  backdrop-filter: blur(10px);
  box-shadow: 0 0 8px rgba(183, 245, 200, 0.4);
}

#aside-toggle {
  display: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid var(--accent-border);
  box-shadow: var(--glass-inner-shadow);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  transition: 0.2s ease;
  color: var(--text-primary);
}

#aside-toggle:hover {
  background: rgba(183, 245, 200, 0.25);
  box-shadow: 0 0 10px rgba(183, 245, 200, 0.35);
}

@media (max-width: 900px) {
  #aside-toggle {
    display: block;
    margin-right: 12px;
  }
}

@media (max-width: 500px) {
  #header-title h1 {
    display: none;
  }
}
</style>

<header id="global-header">
  <button id="aside-toggle" aria-label="Toggle Sidebar">
    <i data-lucide="menu"></i>
  </button>

  <a href="/Sp3/" id="header-title">
    <img src="/imgs/favicon.png" alt="アイコン Splatoon3 Battle Logger" />
    <h1>Splatoon3 Battle Logger</h1>
  </a>

  <div style="display: flex; flex-direction: row-reverse">
    <a href="/Sp3/history">更新履歴</a>
  </div>
</header>
    `;
  }
}

customElements.define('sp3-header', Sp3Header);
