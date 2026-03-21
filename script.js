// script.js — UI ロジック（各ページ共通の初期化フレーム）

// DB 初期化完了を待ってから UI.init() を実行
window.addEventListener("sp3db-ready", () => {
  init();
});

// SPA 遷移時にも再実行される
export function init() {
  const db = window.Sp3DB;
  if (!db) {
    console.warn("Sp3DB がまだ初期化されていません");
    return;
  }

  // ページごとの init を自動判定
  runPageLogic();

  // lucide アイコン描画（UI が描画された後に必ず実行）
  import("https://cdn.skypack.dev/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });
}

/* ============================================================
   ページごとの処理を自動判定
============================================================ */
function runPageLogic() {
  const path = location.pathname;

  if (path.includes("/weapons/")) {
    import("./weapons.js").then(mod => mod.init?.());
    return;
  }

  if (path.includes("/stages/")) {
    import("./stages.js").then(mod => mod.init?.());
    return;
  }

  if (path.includes("/rules/")) {
    import("./rules.js").then(mod => mod.init?.());
    return;
  }

  // トップページ（フォーム）
  if (document.getElementById("battleForm")) {
    setupForm();
  }
}

/* ============================================================
   トップページのフォーム処理
============================================================ */
function setupForm() {
  const form = document.getElementById("battleForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const db = window.Sp3DB;
    if (!db) {
      alert("DB がまだ初期化されていません");
      return;
    }

    const record = {
      kills: Number(document.getElementById("kills").value),
      deaths: Number(document.getElementById("deaths").value),
      special: Number(document.getElementById("special").value),
      weapon: document.getElementById("weapon").value,
      stage: document.getElementById("stage").value,
      rule: document.getElementById("rule").value,
      result: document.getElementById("result").value,
      timestamp: Date.now()
    };

    await db.addRecord(record);
    alert("保存しました！");
    form.reset();
  });
}
