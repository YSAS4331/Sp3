class Sp3Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<header>
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

    // ============================
    //  ヘッダーが挿入された瞬間に実行
    // ============================
    this.setupAsideToggle();
    this.setupAsideMenu();
  }

  setupAsideToggle() {
    const toggle = this.querySelector('#aside-toggle');
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
  }

  setupAsideMenu() {
    if (!window.Sp3DB) {
      console.warn('Sp3DBが読み込まれていません');
      return;
    }

    const aside = document.getElementById('aside');
    const list = document.createElement('ul');
    const datas = window.Sp3DB.getAllRecords();

    const categories = {
      '武器別': [...new Set(datas.map(d => d.weaponName))],
      'ステージ別': [...new Set(datas.map(d => d.stage))],
      'ルール別': [...new Set(datas.map(d => d.rule))],
      '全データ': datas.map(d => d.id)
    };

    Object.entries(categories).forEach(([label, items]) => {
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
        }

        if (label === 'ステージ別') {
          a.href = `/Sp3/stages/?stage=${encodeURIComponent(item)}`;
          a.textContent = item;
        }

        if (label === 'ルール別') {
          a.href = `/Sp3/rules/?rule=${encodeURIComponent(item)}`;
          a.textContent = item;
        }

        if (label === '全データ') {
          a.href = `/Sp3/battle/?id=${item}`;
          a.textContent = `#${item}`;
        }

        box.appendChild(a);
      });

      acc.appendChild(box);
      list.appendChild(acc);
    });

    aside.appendChild(list);
  }
}

customElements.define('sp3-header', Sp3Header);
