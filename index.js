const $ = s => document.getElementById(s);
let UIs = {};
let formInitialized = false;

export function init() {
  const db = window.Sp3DB;
  if (!db) {
    console.warn("[Index.js] Sp3DB がまだ初期化されていません");
    return;
  }

  setupForm();

  import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });
}

// ===============================
// スケジュール取得（キャッシュ付き）
// ===============================
async function getStagesData() {
  const db = window.SetDB;
  const cache = await db.getItem("cache_stages");

  console.log('[Index.js] ', cache);
  if (cache && Date.now() < cache.cache_end) {
    return cache.content;
  }

  const res = await fetch("https://spla3.yuu26.com/api/schedule");
  const content = await res.json();

  const cache_end = new Date(content.regular.end_time).getTime();

  await db.setItem("cache_stages", {
    content,
    cache_end
  });

  return content;
}

// ===============================
// ルール更新（match変更時）
// ===============================
async function updateRuleUI() {
  const content = await getStagesData();
  const match = UIs.match.value;

  const data = content[match];
  if (!data) return;

  if (data.rule) {
    UIs.rule.value = data.rule.name || data.rule;
  }

  // ============================================
  // 🟡 ステージ更新部分（ここに後で書く）
  // ============================================
  /*
  UIs.stage.innerHTML = "";

  data.stages.forEach(stage => {
    const opt = document.createElement("option");
    opt.value = stage.name;
    opt.textContent = stage.name;
    UIs.stage.appendChild(opt);
  });
  */
}

// ===============================
// フォーム初期化
// ===============================
async function setupForm() {
  if (formInitialized) return;
  formInitialized = true;

  const form = $('battleForm');
  if (!form) return;

  async function formReset() {
    form.reset();

    const data = window.SetDB;
    if (!data) return;

    const setting = await data.get();
    if (!setting) return;

    if (setting.weapon) {
      UIs.weapon.value = setting.weapon;
    }

    if (setting.match) {
      UIs.match.value = setting.match;
    }

    // 初期ルール反映
    await updateRuleUI();
  }

  if (Object.keys(UIs).length === 0) {
    UIs = {
      kills: $('kills'),
      deaths: $('deaths'),
      special: $('special'),
      weapon: $('weapon'),
      stage: $('stage'),
      match: $('match'),
      rule: $('rule'),
      result: $('result'),
      note: $('memo-text')
    };

    await formReset();
  }

  // 🎯 match変更時にルール更新
  UIs.match.addEventListener("change", async () => {
    await updateRuleUI();
  });

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
      match: UIs.match.value,
      rule: UIs.rule.value,
      result: UIs.result.value,
      note: UIs.note.value,
      timestamp: Date.now()
    };

    try {
      await db.addRecord(record);
      alert("保存しました！");
      await formReset();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました");
    }
  });
}
