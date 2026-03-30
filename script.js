document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('aside-toggle');
  const backdrop = document.getElementById('aside-backdrop');

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('aside-open');
  });

  backdrop.addEventListener('click', () => {
    document.body.classList.remove('aside-open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.classList.remove('aside-open');
    }
  });

  if (!window.Sp3DB) {
    console.warn('Sp3DBが読み込まれていません');
    return;
  }

  const aside = document.getElementById('aside');
  const list = aside.querySelector('ul');
  list.innerHTML = '';

  const datas = window.Sp3DB.getAllRecords();

  // ============================
  //  4カテゴリのデータを作る
  // ============================
  const categories = {
    '武器別': [...new Set(datas.map(d => d.weaponName))],
    'ステージ別': [...new Set(datas.map(d => d.stage))],
    'ルール別': [...new Set(datas.map(d => d.rule))],
    '全データ': datas.map(d => d.id) // ID一覧など、好きに変えられる
  };

  // ============================
  //  DOM生成
  // ============================
  Object.entries(categories).forEach(([label, items]) => {
    const acc = document.createElement('com-accordion');

    // header
    const header = document.createElement('p');
    header.slot = 'header';
    header.textContent = label;
    acc.appendChild(header);

    // item box
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
});
