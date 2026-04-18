export function init() {
  if (!window.Sp3DB) {
    console.error("Sp3DB が読み込まれていません");
    return;
  }

  /* ============================================================
     一覧モード（マッチ一覧）
  ============================================================ */
  async function renderMatchList() {
    const records = await Sp3DB.getAllRecords();
    const list = document.getElementById("matchList");

    if (!records.length) {
      list.innerHTML = `<p>まだ記録がありません。</p>`;
      return;
    }

    const groups = {};
    for (const r of records) {
      if (!groups[r.match]) groups[r.match] = [];
      groups[r.match].push(r);
    }

    Object.keys(groups).forEach((match) => {
      const summary = Sp3DB.summarize(groups[match]);

      const card = document.createElement("div");
      card.className = "common-card";

      card.innerHTML = `
        <div class="common-name">
          <i data-lucide="swords"></i>
          <a href="./?match=${encodeURIComponent(match)}">${match}</a>
        </div>

        <div class="common-stats">
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

    import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
      createIcons({ icons });
    });
  }

  /* ============================================================
     詳細モード（マッチ詳細）
  ============================================================ */
  async function renderMatchDetail(match) {
    const container = document.querySelector(".container");
    container.innerHTML = "";

    const records = await Sp3DB.getByIndex("match", match);

    if (!records.length) {
      container.innerHTML = `
        <h2 class="section-title">
          <i data-lucide="swords"></i>
          ${match}
        </h2>
        <p>このマッチの記録はありません。</p>
        <a class="btn-primary" href="./">
          <i data-lucide="arrow-left"></i>
          戻る
        </a>
      `;
      return;
    }

    const summary = Sp3DB.summarize(records);

    const stageGroups = {};
    for (const r of records) {
      if (!stageGroups[r.stage]) stageGroups[r.stage] = [];
      stageGroups[r.stage].push(r);
    }

    const weaponGroups = {};
    for (const r of records) {
      if (!weaponGroups[r.weapon]) weaponGroups[r.weapon] = [];
      weaponGroups[r.weapon].push(r);
    }

    const html = [];

    html.push(`
      <h2 class="section-title">
        <i data-lucide="swords"></i>
        ${match} の詳細
      </h2>

      <a class="btn-primary" href="./">
        <i data-lucide="arrow-left"></i>
        一覧に戻る
      </a>

      <div class="common-card" style="margin-top:20px;">
        <div class="common-name">
          <i data-lucide="bar-chart-3"></i>
          全体サマリー
        </div>

        <div class="common-stats">
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
       ステージ別
    ----------------------------- */
    html.push(`
      <h3 class="section-title" style="margin-top:30px;">
        <i data-lucide="map"></i>
        ステージ別サマリー
      </h3>
    `);

    Object.keys(stageGroups).forEach(stage => {
      const s = Sp3DB.summarize(stageGroups[stage]);

      html.push(`
        <div class="common-card">
          <div class="common-name">
            <i data-lucide="map"></i>
            ${stage}
          </div>

          <div class="common-stats">
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
        <div class="common-card">
          <div class="common-name">
            <i data-lucide="sword"></i>
            ${weapon}
          </div>

          <div class="common-stats">
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

    import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
      createIcons({ icons });
    });
  }

  /* ============================================================
     init 本体の処理
  ============================================================ */
  const params = new URLSearchParams(location.search);
  const matchParam = params.get("match");

  if (matchParam) {
    renderMatchDetail(matchParam);
  } else {
    renderMatchList();
  }
}
