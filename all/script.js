export function init() {
  if (!window.Sp3DB) {
    console.error("Sp3DB が読み込まれていません");
    return;
  }

  /* ============================================================
     共通ユーティリティ
  ============================================================ */

  // 時刻フォーマット
  const formatTime = ts => {
    const d = new Date(ts);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // Lucide を一度だけ読み込む
  let lucideLoaded = false;
  const loadIcons = async () => {
    if (lucideLoaded) return;
    const { createIcons, icons } = await import("https://esm.sh/lucide");
    createIcons({ icons });
    lucideLoaded = true;
  };

  // XSS 対策（最低限）
  const escapeHTML = str =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

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

    records.sort((a, b) => b.timestamp - a.timestamp);

    const frag = document.createDocumentFragment();

    for (const r of records) {
      const time = formatTime(r.timestamp);

      const card = document.createElement("div");
      card.className = "common-card";

      card.innerHTML = `
        <div class="common-name">
          <i data-lucide="list"></i>
          <a href="./?id=${encodeURIComponent(r.id)}">
            ${escapeHTML(r.result.toUpperCase())} ${time} – 
            ${escapeHTML(r.rule)} / ${escapeHTML(r.stage)}
          </a>
        </div>

        <div class="common-stats">
          <div>キル: ${r.kills}</div>
          <div>デス: ${r.deaths}</div>
          <div>スペ: ${r.special}</div>
        </div>
      `;

      frag.appendChild(card);
    }

    list.appendChild(frag);
    loadIcons();
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
      loadIcons();
      return;
    }

    const time = formatTime(record.timestamp);
    const url = `/Sp3/edit/#${encodeURIComponent(id)}`;

    container.innerHTML = `
      <h2 class="section-title">
        <i data-lucide="list"></i>
        試合詳細
      </h2>

      <a class="btn-primary" href="./">
        <i data-lucide="arrow-left"></i>
        一覧に戻る
      </a>

      <div class="common-card" style="margin-top:20px;">
        <div class="common-name">
          <i data-lucide="list"></i>
          ${escapeHTML(record.result.toUpperCase())} ${time} – 
          ${escapeHTML(record.rule)} / ${escapeHTML(record.stage)}
        </div>

        <div class="common-stats">
          <div>キル: ${record.kills}</div>
          <div>デス: ${record.deaths}</div>
          <div>スペ: ${record.special}</div>
          <div>武器: ${escapeHTML(record.weapon)}</div>
          <div>メモ: ${escapeHTML(record.note ?? "なし")}</div>
          <a href="${url}">編集する</a>
        </div>
      </div>
    `;

    loadIcons();
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
