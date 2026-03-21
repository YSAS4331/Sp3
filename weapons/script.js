/* ============================================================
   weapons/index.html 用スクリプト
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  // DB 初期化（script.js の openDB を使用）
  if (!window.Sp3DB) {
    console.error("Sp3DB が読み込まれていません");
    return;
  }

  const records = await Sp3DB.getAllRecords();

  // 武器名でグループ化
  const groups = {};
  for (const r of records) {
    if (!groups[r.weapon]) groups[r.weapon] = [];
    groups[r.weapon].push(r);
  }

  const list = document.getElementById("weaponList");

  // 武器ごとにカード生成
  Object.keys(groups).forEach((weapon) => {
    const summary = Sp3DB.summarize(groups[weapon]);

    const card = document.createElement("div");
    card.className = "weapon-card";

    card.innerHTML = `
      <div class="weapon-name">
        <i data-lucide="sword"></i>
        ${weapon}
      </div>

      <div class="weapon-stats">
        <div>試合数: ${summary.count}</div>
        <div>勝ち: ${summary.win} / 負け: ${summary.lose}</div>
        <div>勝率: ${(summary.winRate * 100).toFixed(1)}%</div>
        <div>平均キル: ${summary.avgKills.toFixed(2)}</div>
        <div>平均デス: ${summary.avgDeaths.toFixed(2)}</div>
        <div>平均スペ: ${summary.avgSpecial.toFixed(2)}</div>
      </div>

      <div class="winrate-bar">
        <div class="winrate-fill" style="width: ${(summary.winRate * 100)}%"></div>
      </div>
    `;

    // クリックで詳細ページへ
    card.addEventListener("click", () => {
      const encoded = encodeURIComponent(weapon);
      location.href = `./detail.html?weapon=${encoded}`;
    });

    list.appendChild(card);
  });

  // lucide アイコン再描画
  import("https://cdn.skypack.dev/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });
});
