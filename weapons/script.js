export function init() {
  if (!window.Sp3DB) {
    console.error("Sp3DB が読み込まれていません");
    return;
  }

  /* ============================================================
     一覧モード（ローカル関数）
  ============================================================ */
  async function renderWeaponList() {
    const records = await Sp3DB.getAllRecords();
    const list = document.getElementById("weaponList");

    if (!records.length) {
      list.innerHTML = `<p>まだ記録がありません。</p>`;
      return;
    }

    const groups = {};
    for (const r of records) {
      if (!groups[r.weapon]) groups[r.weapon] = [];
      groups[r.weapon].push(r);
    }

    Object.keys(groups).forEach((weapon) => {
      const summary = Sp3DB.summarize(groups[weapon]);

      const card = document.createElement("div");
      card.className = "weapon-card";

      card.innerHTML = `
        <div class="weapon-name">
          <i data-lucide="sword"></i>
          <a href="./?weapon=${encodeURIComponent(weapon)}">${weapon}</a>
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

      list.appendChild(card);
    });

    import("https://cdn.skypack.dev/lucide").then(({ createIcons, icons }) => {
      createIcons({ icons });
    });
  }

  /* ============================================================
     詳細モード（ローカル関数）
  ============================================================ */
  async function renderWeaponDetail(weapon) {
    const container = document.querySelector(".container");
    container.innerHTML = "";

    const records = await Sp3DB.getByIndex("weapon", weapon);

    if (!records.length) {
      container.innerHTML = `
        <h2 class="section-title">
          <i data-lucide="sword"></i>
          ${weapon}
        </h2>
        <p>この武器の記録はありません。</p>
        <button class="btn-primary" onclick="location.href='./index.html'">
          <i data-lucide="arrow-left"></i>
          戻る
        </button>
      `;
      return;
    }

    const summary = Sp3DB.summarize(records);

    const ruleGroups = {};
    for (const r of records) {
      if (!ruleGroups[r.rule]) ruleGroups[r.rule] = [];
      ruleGroups[r.rule].push(r);
    }

    const stageGroups = {};
    for (const r of records) {
      if (!stageGroups[r.stage]) stageGroups[r.stage] = [];
      stageGroups[r.stage].push(r);
    }

    const html = [];

    html.push(`
      <h2 class="section-title">
        <i data-lucide="sword"></i>
        ${weapon} の詳細
      </h2>

      <button class="btn-primary" onclick="location.href='./index.html'">
        <i data-lucide="arrow-left"></i>
        一覧に戻る
      </button>

      <div class="weapon-card" style="margin-top:20px;">
        <div class="weapon-name">
          <i data-lucide="bar-chart-3"></i>
          全体サマリー
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
      </div>
    `);

    html.push(`
      <h3 class="section-title" style="margin-top:30px;">
        <i data-lucide="list"></i>
        ルール別サマリー
      </h3>
    `);

    Object.keys(ruleGroups).forEach(rule => {
      const s = Sp3DB.summarize(ruleGroups[rule]);

      html.push(`
        <div class="weapon-card">
          <div class="weapon-name">
            <i data-lucide="list"></i>
            ${rule}
          </div>

          <div class="weapon-stats">
            <div>試合数: ${s.count}</div>
            <div>勝ち: ${s.win} / 負け: ${s.lose}</div>
            <div>勝率: ${(s.winRate * 100).toFixed(1)}%</div>
            <div>平均キル: ${s.avgKills.toFixed(2)}</div>
            <div>平均デス: ${s.avgDeaths.toFixed(2)}</div>
            <div>平均スペ: ${s.avgSpecial.toFixed(2)}</div>
          </div>

          <div class="winrate-bar">
            <div class="winrate-fill" style="width: ${(s.winRate * 100)}%"></div>
          </div>
        </div>
      `);
    });

    html.push(`
      <h3 class="section-title" style="margin-top:30px;">
        <i data-lucide="map"></i>
        ステージ別サマリー
      </h3>
    `);

    Object.keys(stageGroups).forEach(stage => {
      const s = Sp3DB.summarize(stageGroups[stage]);

      html.push(`
        <div class="weapon-card">
          <div class="weapon-name">
            <i data-lucide="map"></i>
            ${stage}
          </div>

          <div class="weapon-stats">
            <div>試合数: ${s.count}</div>
            <div>勝ち: ${s.win} / 負け: ${s.lose}</div>
            <div>勝率: ${(s.winRate * 100).toFixed(1)}%</div>
            <div>平均キル: ${s.avgKills.toFixed(2)}</div>
            <div>平均デス: ${s.avgDeaths.toFixed(2)}</div>
            <div>平均スペ: ${s.avgSpecial.toFixed(2)}</div>
          </div>

          <div class="winrate-bar">
            <div class="winrate-fill" style="width: ${(s.winRate * 100)}%"></div>
          </div>
        </div>
      `);
    });

    container.innerHTML = html.join("");

    import("https://cdn.skypack.dev/lucide").then(({ createIcons, icons }) => {
      createIcons({ icons });
    });
  }

  /* ============================================================
     init 本体の処理
  ============================================================ */
  const params = new URLSearchParams(location.search);
  const weaponParam = params.get("weapon");

  if (weaponParam) {
    renderWeaponDetail(weaponParam);
  } else {
    renderWeaponList();
  }
}
