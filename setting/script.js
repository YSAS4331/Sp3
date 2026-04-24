export function init() {
  import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });

  const $ = id => document.getElementById(id);

  let UIs = {
    weapon: $('weapon'),
    match: $('match')
  };

  const form = $('defaultForm');
  if (!form) return;

  // ============================
  // 翻訳データのロードとセレクトボックス反映
  // ============================
  async function setupWeaponList() {
    const cacheKey = "sp3_translations";
    let trans = sessionStorage.getItem(cacheKey);

    if (trans) {
      trans = JSON.parse(trans);
    } else {
      try {
        const res = await fetch("/Sp3/datas/translate.json");
        trans = await res.json();
        sessionStorage.setItem(cacheKey, JSON.stringify(trans));
      } catch (e) {
        console.error("翻訳データの取得失敗:", e);
        return;
      }
    }

    if (trans && trans.ja && trans.ja.weapons) {
      // 既存の内容をクリア（「選択してください」などの初期値を残したい場合は調整してね）
      const currentVal = UIs.weapon.value;
      UIs.weapon.innerHTML = '<option value="">武器を選択...</option>';
      
      const fragment = document.createDocumentFragment();
      trans.ja.weapons.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w;
        opt.textContent = w;
        fragment.appendChild(opt);
      });
      UIs.weapon.appendChild(fragment);
      
      // 値を戻す
      if (currentVal) UIs.weapon.value = currentVal;
    }
  }

  // ============================
  // 設定ロード関数
  // ============================
  async function loadSettings() {
    // 武器リストを先に作っておく
    await setupWeaponList();

    const db = window.SetDB;
    if (!db) return;

    const { default: saved } = await db.get();
    if (!saved) return;

    // weapon → 反映
    if (saved.weapon) {
      UIs.weapon.value = saved.weapon;
    }

    // match → select の最初の option を書き換え
    if (saved.match) {
      const firstOption = UIs.match.querySelector("option[value='']");
      if (firstOption) {
        UIs.match.value = saved.match
      }
    }

    form.reset();
  }

  // ============================
  // DB ready を待つ
  // ============================
  if (window.SetDB) {
    loadSettings();
  } else {
    window.addEventListener("sp3settings-ready", loadSettings);
  }

  // ============================
  // 保存処理
  // ============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const db = window.SetDB;
    if (!db) {
      alert("設定DB がまだ初期化されていません");
      return;
    }

    const record = {
      default: {
        weapon: UIs.weapon.value || null,
        match: UIs.match.value || null,
        timestamp: Date.now()
      }
    };

    try {
      await db.set(record);
      alert("設定を保存しました！");
      loadSettings();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました");
    }
  });
}
