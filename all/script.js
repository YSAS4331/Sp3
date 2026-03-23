export function init() {
  if (!window.Sp3DB) {
    console.error("Sp3DB が読み込まれていません");
    return;
  }

  /* ============================================================
     一覧モード（/all/）
  ============================================================ */
  async function renderAllList() {
    const records = await Sp3DB.getAllRecords();
    const list = document.getElementById("allList");

    if (!records.length) {
      list.innerHTML = `<p>まだ記録がありません。</p>`;
      return;
    }

    records.sort((a, b) => b.timestamp - a.timestamp); // 新しい順

    for (const r of records) {
      const date = new Date(r.timestamp);
      const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

      const linkText = `
        ${r.result.toUpperCase()} ${time} – ${r.rule} / ${r.stage}
      `;

      const card = document.createElement("div");
      card.className = "rule-card";

      card.innerHTML = `
        <div class="rule-name">
          <i data-lucide="list"></i>
          <a href="./?id=${r.id}">
            ${linkText}
          </a>
        </div>

        <div class="rule-stats">
          <div>キル: ${r.kills}</div>
          <div>デス: ${r.deaths}</div>
          <div>スペ: ${r.special}</div>
        </div>
      `;

      list.appendChild(card);
    }

    import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
      createIcons({ icons });
    });
  }

  /* ============================================================
     詳細モード（/all/?id=xxx）
  ============================================================ */
  async function renderRecordDetail(id) {
    const container = document.querySelector(".container");
    container.innerHTML = "";

    const all = await Sp3DB.getAllRecords();
    const record = all.find(r => r.id == id);

    if (!record) {
      container.innerHTML = `
        <h2 class="section-title">
          <i data-lucide="list"></i>
          データが見つかりません
        </h2>
        <a class="btn-primary" href="./">
          <i data-lucide="arrow-left"></i>
          戻る
        </a>
      `;
      return;
    }

    const date = new Date(record.timestamp);
    const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

    container.innerHTML = `
      <h2 class="section-title">
        <i data-lucide="list"></i>
        試合詳細
      </h2>

      <a class="btn-primary" href="./">
        <i data-lucide="arrow-left"></i>
        一覧に戻る
      </a>

      <div class="rule-card" style="margin-top:20px;">
        <div class="rule-name">
          <i data-lucide="list"></i>
          ${record.result.toUpperCase()} ${time} – ${record.rule} / ${record.stage}
        </div>

        <div class="rule-stats">
          <div>キル: ${record.kills}</div>
          <div>デス: ${record.deaths}</div>
          <div>スペ: ${record.special}</div>
          <div>武器: ${record.weapon}</div>
        </div>
      </div>
    `;

    import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
      createIcons({ icons });
    });
  }

  /* ============================================================
     init 本体
  ============================================================ */
  const params = new URLSearchParams(location.search);
  const idParam = params.get("id");

  if (idParam) {
    renderRecordDetail(idParam);
  } else {
    renderAllList();
  }
}
