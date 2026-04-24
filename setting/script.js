export function init() {
  import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });

  const $ = id => document.getElementById(id);

  // setupFormの中で要素を取得するように変更（確実性を上げるため）
  let UIs = {};

  const form = $('defaultForm');
  if (!form) return;

  UIs = {
    weapon: $('weapon'),
    match: $('match')
  };

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
        if (!res.ok) throw new Error("fetch failed");
        trans = await res.json();
        sessionStorage.setItem(cacheKey, JSON.stringify(trans));
      } catch (e) {
        console.error("翻訳データの取得失敗:", e);
        return;
      }
    }

    if (trans && trans.ja && trans.ja.weapons) {
      // 現在の選択を一時保持
      const currentVal = UIs.weapon.value;
      
      // 初期化
      UIs.weapon.innerHTML = '<option value="">武器を選択...</option>';
      
      const fragment = document.createDocumentFragment();
      trans.ja.weapons.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w;
        opt.textContent = w;
        fragment.appendChild(opt);
      });
      UIs.weapon.appendChild(fragment);
      
      // リスト構築後に値を戻す
      if (currentVal) {
        UIs.weapon.value = currentVal;
      }
    }
  }

  // ============================
  // 設定ロード関数
  // ============================
  async function loadSettings() {
    // 1. まずリストを作る（これがないとvalueをセットできない）
    await setupWeaponList();

    const db = window.SetDB;
    if (!db) return;

    const { default: saved } = await db.get();
    if (!saved) return;

    // 2. DBの値を反映
    if (saved.weapon) {
      UIs.weapon.value = saved.weapon;
    }

    if (saved.match) {
      UIs.match.value = saved.match;
    }

    // 【重要】form.reset() は削除または順番を変更
    // savedの値を反映した後に reset() すると消えてしまうため
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
      // 保存後に再ロードして表示を更新
      await loadSettings();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました");
    }
  });
}
