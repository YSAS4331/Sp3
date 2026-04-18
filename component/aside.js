class aside extends HTMLElement {
  connectedCallback() {
    console.log('[sp3-aside] connected');
    
    this.innerHTML = `
<style>
  /* -----------------------------------
     サイドバー（#aside）
  ----------------------------------- */
  #aside {
    min-width: 240px;
    max-width: 75vh;
    height: 100%;

    /* ★ ガラスを濃くして視認性UP */
    background: rgba(255, 255, 255, 0.32);
    backdrop-filter: blur(28px) saturate(180%);

    /* ★ 境界線を強める */
    border-right: 1px solid rgba(255, 255, 255, 0.45);

    /* ★ 内側の白シャドウを少し強める */
    box-shadow:
      inset 0 0 1px rgba(255, 255, 255, 0.9),
      inset 0 0 14px rgba(255, 255, 255, 0.35);
    
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    align-items: center;
  }

  .aside-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    gap: 12px;

    padding: 20px;
    padding-top: 30px;
  }

  /* -----------------------------------
     リンク
  ----------------------------------- */
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

  /* ★ hover をもっと見やすく */
  #aside a:hover {
    background: rgba(183, 245, 200, 0.32);
    box-shadow: 0 0 10px rgba(183, 245, 200, 0.45);
  }

  /* -----------------------------------
     カテゴリリスト
  ----------------------------------- */
  #aside ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  #aside li {
    margin: 0;
    padding: 0;
  }

  /* -----------------------------------
     アコーディオン全体
  ----------------------------------- */
  #aside com-accordion {
    display: block;
    border-radius: 10px;
    overflow: hidden;

    /* ★ 背景を濃くしてカード感UP */
    background: rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(16px);

    /* ★ 境界線を強める */
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  /* -----------------------------------
     アコーディオンのヘッダー
  ----------------------------------- */
  #aside com-accordion p[slot="header"] {
    margin: 0;
    padding: 10px 12px;
    font-weight: 700;
    font-size: 14px;
    color: var(--text-primary);
    cursor: pointer;

    /* ★ 背景を少し付けて見やすく */
    background: rgba(255, 255, 255, 0.18);
  }

  /* -----------------------------------
     アコーディオン内のリンク
  ----------------------------------- */
  #aside com-accordion div[slot="item"] a {
    display: block;
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 6px;
    color: var(--text-primary);
    text-decoration: none;
    transition: 0.15s ease;
  }

  /* ★ hover を強める */
  #aside com-accordion div[slot="item"] a:hover {
    background: rgba(183, 245, 200, 0.32);
    box-shadow: 0 0 6px rgba(183, 245, 200, 0.45);
  }

  /* -----------------------------------
     モバイルレイアウト
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

      /* モバイルはガラスより白背景の方が見やすい */
      background: #f0f0f0;
      backdrop-filter: none;
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
  <div class="aside-content">
    <div class="searchBar">
      <i data-lucide="search"></i>
      <input class="searchInput" type="text">
      <kbd>Ctrl</kbd><kbd>K</kbd>
    </div>
  
    <a href="/Sp3/">
      <i data-lucide="home"></i>
      トップ
    </a>
    <a href="/Sp3/setting/">
      <i data-lucide="settings"></i>
      設定
    </a>
  </div>
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
       run() — DB 読み込み後に実行
    ----------------------------------- */
    const run = async () => {
      console.log('[sp3-aside] run start');

      const aside = this.querySelector('#aside > .aside-content');
      if (!aside) {
        console.warn('[sp3-aside] aside not found');
        return;
      }

      // 既存のリストを削除
      aside.querySelector('ul')?.remove();

      // ★ Promise を await する（超重要）
      const datas = await window.Sp3DB.getAllRecords();
      console.log('[sp3-aside] datas length:', datas.length);

      const list = document.createElement('ul');

      const categories = {
        '武器別': [...new Set(datas.map(d => d.weapon))],
        'ステージ別': [...new Set(datas.map(d => d.stage))],
        'ルール別': [...new Set(datas.map(d => d.rule))],
        'マッチ別': [...new Set(datas.map(d => d.match))],
        '全データ': datas.map(d => d.id)
      };

      Object.entries(categories).forEach(([label, items]) => {
        const li = document.createElement('li');
        const acc = document.createElement('com-accordion');

        acc.setAttribute('group', 'aside');

        const header = document.createElement('p');
        header.slot = 'header';
        header.textContent = label;
        acc.appendChild(header);

        const box = document.createElement('div');
        box.slot = 'item';

        items.forEach(item => {
          if (!item) return;
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
          } else if (label === 'マッチ別') {
            a.href = `/Sp3/matches/?match=${encodeURIComponent(item)}`;
            a.textContent = item;
          } else {
            a.href = `/Sp3/all/?id=${item}`;
            a.textContent = `#${item}`;
          }

          box.appendChild(a);
        });

        acc.appendChild(box);
        li.appendChild(acc);
        list.appendChild(li);
      });

      aside.appendChild(list);
      console.log('[sp3-aside] list appended');
    };

    /* -----------------------------------
       Sp3DB のロード待ち
    ----------------------------------- */
    if (!window.Sp3DBReady) {
      console.warn('Sp3DBが読み込まれていません');
      window.addEventListener('sp3db-ready', () => run(), { once: true });
      return;
    }

    run();
  }
}

customElements.define('sp3-aside', aside);
