const $ = s => document.getElementById(s);
let UIs = {};
let formInitialized = false;

const map = {
  "regular": "regular",
  "anarchy-o": "bankara_open",
  "anarchy-c": "bankara_challenge",
  "x": "x",
  "event": "event"
};
const RuleMap = {
  "TURF_WAR": "TurfWar",
  "AREA": "SplatZones",
  "LOFT": "TowerControl",
  "GOAL": "Rainmaker",
  "CLAM": "ClamBlitz"
};

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
// 翻訳データの取得（sessionStorageキャッシュ付き）
// ===============================
async function loadTranslations() {
  const cacheKey = "sp3_translations";
  const cachedData = sessionStorage.getItem(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  try {
    const res = await fetch("/Sp3/datas/translate.json");
    if (!res.ok) throw new Error("翻訳ファイルの取得に失敗");
    const data = await res.json();
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (e) {
    console.error("[Index.js]", e.message);
    return null;
  }
}

// セレクトボックスへの反映
function populateSelect(element, items) {
  if (!element || !items) return;
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    fragment.appendChild(opt);
  });
  element.innerHTML = "";
  element.appendChild(fragment);
}

// ===============================
// スケジュール取得（キャッシュ付き）
// ===============================
async function getStagesData() {
  const db = window.SetDB;
  const cache = await db.getItem("cache_stages");

  if (cache && Date.now() < cache.cache_end) {
    return cache.content;
  }

  const res = await fetch("https://spla3.yuu26.com/api/schedule");
  const json = await res.json();

  const result = json.result;
  const cache_end = new Date(result.regular[0].end_time).getTime();

  await db.setItem("cache_stages", {
    content: result,
    cache_end
  });

  return result;
}

// ===============================
// ルール更新（match変更時）
// ===============================
async function updateRuleUI() {
  const content = await getStagesData();
  const match = UIs.match.value;

  const key = map[match] ?? match;
  const data = content[key]?.[0];
  if (!data) return;

  if (data.rule) {
    UIs.rule.value = RuleMap[data.rule.key];
  } else {
    UIs.rule.value = "";
  }
}

// ===============================
// フォーム初期化
// ===============================
async function setupForm() {
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
      stage: $('stage'),
      match: $('match'),
      rule: $('rule'),
      result: $('result'),
      note: $('memo-text')
    };
  }

  // 翻訳データのロードと反映
  const trans = await loadTranslations();
  if (trans && trans.ja) {
    populateSelect(UIs.weapon, trans.ja.weapons);
    populateSelect(UIs.stage, trans.ja.stages);
  }

  async function formReset() {
    form.reset();

    const data = window.SetDB;
    if (!data) return;

    const { default: setting } = await data.get();
    if (!setting) return;

    if (setting.weapon) {
      UIs.weapon.value = setting.weapon;
    }

    if (setting.match) {
      UIs.match.value = setting.match;
    }

    try {
      await updateRuleUI();
    } catch (e) {
      console.error(e.message);
    }
  }

  await formReset();

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
