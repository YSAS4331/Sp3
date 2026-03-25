const $ = s => document.getElementById(s);
let UIs = {};
let formInitialized = false;

export function init() {
  const db = window.Sp3DB;
  if (!db) {
    console.warn("Sp3DB がまだ初期化されていません");
    return;
  }

  setupForm();

  import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });
}

function setupForm() {
  if (formInitialized) return;
  formInitialized = true;

  const form = $('battleForm');
  if (!form) return;

  if (Object.keys(UIs).length === 0) {
    UIs = {
      kills: $('kills'),
      deaths: $('deaths'),
      special: $('special'),
      weapon: $('weapon'),
      stage: $('stage'), // ← 修正
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

    try {
      await db.addRecord(record);
      alert("保存しました！");
      form.reset();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました");
    }
  });
}
