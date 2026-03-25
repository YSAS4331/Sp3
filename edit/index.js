export function init() {
  if (!window.Sp3DB) {
    console.error("Sp3DB が読み込まれていません");
    return;
  }

  /* ============================================================
     共通ユーティリティ
  ============================================================ */
  const escapeHTML = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  let lucideLoaded = false;
  const loadIcons = async () => {
    if (lucideLoaded) return;
    const { createIcons, icons } = await import("https://esm.sh/lucide");
    createIcons({ icons });
    lucideLoaded = true;
  };

  /* ============================================================
     レコード取得
  ============================================================ */
  async function loadRecord(id) {
    const all = await Sp3DB.getAllRecords();
    return all.find((r) => r.id == id);
  }

  /* ============================================================
     編集画面描画
  ============================================================ */
  async function renderEdit(id) {
    const container = document.querySelector(".container");
    container.innerHTML = "";

    const record = await loadRecord(id);

    if (!record) {
      container.innerHTML = `
        <h2 class="section-title">
          <i data-lucide="edit"></i>
          データが見つかりません
        </h2>
        <a class="btn-primary" href="../all/">
          <i data-lucide="arrow-left"></i>
          戻る
        </a>
      `;
      loadIcons();
      return;
    }

    container.innerHTML = `
      <h2 class="section-title">
        <i data-lucide="edit"></i>
        編集
      </h2>

      <a class="btn-primary" href="../all/?id=${encodeURIComponent(id)}">
        <i data-lucide="arrow-left"></i>
        詳細に戻る
      </a>

      <form id="editForm" class="form card glass" style="margin-top:20px; padding:20px;">
        
        <div class="form-group">
          <label>結果</label>
          <div class="input-wrap">
            <i data-lucide="flag"></i>
            <select name="result">
              <option value="win" ${record.result === "win" ? "selected" : ""}>WIN</option>
              <option value="lose" ${record.result === "lose" ? "selected" : ""}>LOSE</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>キル</label>
          <div class="input-wrap">
            <i data-lucide="sword"></i>
            <input type="number" name="kills" value="${record.kills}">
          </div>
        </div>

        <div class="form-group">
          <label>デス</label>
          <div class="input-wrap">
            <i data-lucide="skull"></i>
            <input type="number" name="deaths" value="${record.deaths}">
          </div>
        </div>

        <div class="form-group">
          <label>スペシャル</label>
          <div class="input-wrap">
            <i data-lucide="zap"></i>
            <input type="number" name="special" value="${record.special}">
          </div>
        </div>

        <div class="form-group">
          <label>武器</label>
          <div class="input-wrap">
            <i data-lucide="crosshair"></i>
            <input type="text" name="weapon" value="${escapeHTML(record.weapon)}">
          </div>
        </div>

        <div class="form-group">
          <label>メモ</label>
          <div class="input-wrap" style="align-items:flex-start;">
            <i data-lucide="file-text"></i>
            <textarea name="note" style="flex:1; padding:10px; background:transparent; border:none; outline:none;">${escapeHTML(record.note ?? "")}</textarea>
          </div>
        </div>

        <button class="btn-primary" type="submit">
          <i data-lucide="save"></i>
          保存する
        </button>
      </form>
    `;

    loadIcons();

    /* ============================================================
       保存処理
    ============================================================ */
    const form = document.getElementById("editForm");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      const updated = {
        ...record,
        result: formData.get("result"),
        kills: Number(formData.get("kills")),
        deaths: Number(formData.get("deaths")),
        special: Number(formData.get("special")),
        weapon: formData.get("weapon"),
        note: formData.get("note"),
      };

      await Sp3DB.updateRecord(id, updated);

      alert("保存しました！");
      location.href = `../all/?id=${encodeURIComponent(id)}`;
    });
  }

  /* ============================================================
     init 本体
  ============================================================ */
  const id = location.hash.replace("#", "");
  if (!id) {
    console.error("ID が指定されていません");
    return;
  }

  renderEdit(id);
}
