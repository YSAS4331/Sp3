export function init() {
  if (!window.Sp3DB) {
    console.error("Sp3DB が読み込まれていません");
    return;
  }

  /* ============================================================
     一覧モード（ローカル関数）
  ============================================================ */
  async function renderStageList() {
    const records = await Sp3DB.getAllRecords();
    const list = document.getElementById("stageList");

    if (!records.length) {
      list.innerHTML = `<p>まだ記録がありません。</p>`;
      return;
    }

    const groups = {};
    for (const r of records) {
      if (!groups[r.stage]) groups[r.stage] = [];
      groups[r.stage].push(r);
    }

    Object.keys(groups).forEach((stage) => {
      const summary = Sp3DB.summarize(groups[stage]);

      const card = document.createElement("div");
      card.className = "stage-card";

      card.innerHTML = `
        <div class="stage-name">
          <i data-lucide="map"></i>
          <a href="./?stage=${encodeURIComponent(stage)}">${stage}</a>
        </div>

        <div class="stage-stats">
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
  async function renderStageDetail(stage) {
    const container = document.querySelector(".container");
    container.innerHTML = "";

    const records = await Sp3DB.getByIndex("stage", stage);

    if (!records.length) {
      container.innerHTML = `
        <h2 class="section-title">
          <i data-lucide="map"></i>
          ${stage}
        </h2>
        <p>このステージの記録はありません。</p>
        <a class="btn-primary" href="./">
          <i data-lucide="arrow-left"></i>
          戻る
        </a>
      `;
      return;
    }

    const summary = Sp3DB.summarize(records);

    const ruleGroups = {};
    for (const r of records) {
      if (!ruleGroups[r.rule]) ruleGroups[r.rule] = [];
      ruleGroups[r.rule].push(r);
    }

    const weaponGroups = {};
    for (const r of records) {
      if (!weaponGroups[r.weapon]) weaponGroups[r.weapon] = [];
      weaponGroups[r.weapon].push(r);
    }

    const html = [];

    html.push(`
      <h2 class="section-title">
        <i data-lucide="map"></i>
        ${stage} の詳細
      </h2>

      <a class="btn-primary" href="./">
        <i data-lucide="arrow-left"></i>
        一覧に戻る
      </a>

      <div class="stage-card" style="margin-top:20px;">
        <div class="stage-name">
          <i data-lucide="bar-chart-3"></i>
          全体サマリー
        </div>

        <div class="stage-stats">
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

    /* -----------------------------
       ルール別
    ----------------------------- */
    html.push(`
      <h3 class="section-title" style="margin-top:30px;">
        <i data-lucide="list"></i>
        ルール別サマリー
      </h3>
    `);

    Object.keys(ruleGroups).forEach(rule => {
      const s = Sp3DB.summarize(ruleGroups[rule]);

      html.push(`
        <div class="stage-card">
          <div class="stage-name">
            <i data-lucide="list"></i>
            ${rule}
          </div>

          <div class="stage-stats">
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

    /* -----------------------------
       武器別
    ----------------------------- */
    html.push(`
      <h3 class="section-title" style="margin-top:30px;">
        <i data-lucide="sword"></i>
        武器別サマリー
      </h3>
    `);

    Object.keys(weaponGroups).forEach(weapon => {
      const s = Sp3DB.summarize(weaponGroups[weapon]);

      html.push(`
        <div class="stage-card">
          <div class="stage-name">
            <i data-lucide="sword"></i>
            ${weapon}
          </div>

          <div class="stage-stats">
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
  const stageParam = params.get("stage");

  if (stageParam) {
    renderStageDetail(stageParam);
  } else {
    renderStageList();
  }
}
