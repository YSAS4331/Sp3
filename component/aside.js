class aside extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
  /* -----------------------------------
     サイドバー（#aside）
  ----------------------------------- */
  #aside {
    min-width: 240px;
    max-width: 75vh;

    height: 100%;

    background: rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(32px) saturate(180%);
    border-right: 1px solid var(--accent-border);
    box-shadow: var(--glass-inner-shadow);

    padding: 20px;
    padding-top: 30px;
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  #aside a {
    display: flex;
    align-items: center;
    gap: 10px;

    padding: 10px 12px;
    border-radius: 10px;

    color: var(--text-primary);
    text-decoration: none;
    font-weight: 600;

    transition: 0.15s ease;
  }

  #aside a:hover {
    background: rgba(183, 245, 200, 0.22);
    box-shadow: 0 0 10px rgba(183, 245, 200, 0.35);
  }

  /* -----------------------------------
     モバイルレイアウト（レスポンシブ）
  ----------------------------------- */
  @media (max-width: 900px) {
    #aside {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 240px;

      transform: translateX(-100%);
      opacity: 0;

      transition: transform 0.35s ease, opacity 0.35s ease;
      z-index: 30;

      background: #fafafa;
    }

    body.aside-open #aside {
      transform: translateX(0);
      opacity: 1;
    }

    #aside-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.25);
      backdrop-filter: blur(4px);
      opacity: 0;
      pointer-events: none;
      transition: 0.35s ease;
      z-index: 25;
    }

    body.aside-open #aside-backdrop {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>

<aside id="aside">
  <div class="searchBar">
    <i data-lucide="search"></i>
    <input class="searchInput" type="text">
    <kbd>Ctrl</kbd><kbd>K</kbd>
  </div>

  <a href="/Sp3/">
    <i data-lucide="home"></i>
    トップ
  </a>
</aside>
    `;

    const toggle = document.getElementById('aside-toggle');
    const backdrop = document.getElementById('aside-backdrop');

    toggle?.addEventListener('click', () => {
      document.body.classList.toggle('aside-open');
    });

    backdrop?.addEventListener('click', () => {
      document.body.classList.remove('aside-open');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.body.classList.remove('aside-open');
      }
    });

    /* -----------------------------------
       run() をアロー関数にして this を保持
    ----------------------------------- */
    const run = () => {
      const aside = this.querySelector('#aside');
      if (!aside) return;

      // 既存のリストがあれば削除（重複防止）
      aside.querySelector('ul')?.remove();

      const list = document.createElement('ul');
      const datas = window.Sp3DB.getAllRecords();

      const categories = {
        '武器別': [...new Set(datas.map(d => d.weaponName))],
        'ステージ別': [...new Set(datas.map(d => d.stage))],
        'ルール別': [...new Set(datas.map(d => d.rule))],
        '全データ': datas.map(d => d.id)
      };

      Object.entries(categories).forEach(([label, items]) => {
        const li = document.createElement('li');
        const acc = document.createElement('com-accordion');

        const header = document.createElement('p');
        header.slot = 'header';
        header.textContent = label;
        acc.appendChild(header);

        const box = document.createElement('div');
        box.slot = 'item';

        items.forEach(item => {
          const a = document.createElement('a');

          if (label === '武器別') {
            a.href = `/Sp3/weapons/?weapon=${encodeURIComponent(item)}`;
            a.textContent = item;
          } else if (label === 'ステージ別') {
            a.href = `/Sp3/stages/?stage=${encodeURIComponent(item)}`;
            a.textContent = item;
          } else if (label === 'ルール別') {
            a.href = `/Sp3/rules/?rule=${encodeURIComponent(item)}`;
            a.textContent = item;
          } else {
            a.href = `/Sp3/battle/?id=${item}`;
            a.textContent = `#${item}`;
          }

          box.appendChild(a);
        });

        acc.appendChild(box);
        li.appendChild(acc);
        list.appendChild(li);
      });

      aside.appendChild(list);
    };

    /* -----------------------------------
       Sp3DB のロード待ち
    ----------------------------------- */
    if (!window.Sp3DB) {
      console.warn('Sp3DBが読み込まれていません');
      window.addEventListener('sp3db-ready', run, { once: true });
      return;
    }

    run();
  }
}

customElements.define('sp3-aside', aside);

