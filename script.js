const $ = s => document.getElementById(s);
let UIs = {};

export function init() {
  const db = window.Sp3DB;
  if (!db) {
    console.warn("Sp3DB がまだ初期化されていません");
    return;
  }

  setupForm();

  // lucide アイコン描画（UI が描画された後に必ず実行）
  import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });
}

/* ============================================================
   トップページのフォーム処理
============================================================ */
function setupForm() {
  const form = document.getElementById("battleForm");
  if (!form) return;

  if (UIs.length === 0) {
    UIs = {
      kills: $('kills'),
      deaths: $('deaths'),
      special: $('special'),
      weapon: $('weapon'),
      stage: $('weapon'),
      rule: $('rule'),
      result: $('result'),
      note: $('memo-text')
    };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const db = window.Sp3DB;
    if (!db) {
      alert("DB がまだ初期化されていません");
      return;
    }

    const record = {
      kills: Number(UIs.kills.value),
      deaths: Number(UIs.deaths.value),
      special: Number(UIs.special.value),
      weapon: UIs.weapon.value,
      stage: UIs.stage.value,
      rule: UIs.rule.value,
      result: UIs.result.value,
      note: UIs.note.value,
      timestamp: Date.now()
    };

    await db.addRecord(record);
    alert("保存しました！");
    form.reset();
  });
}
