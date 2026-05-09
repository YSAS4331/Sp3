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
      trans.ja.weapons.forEach((w,i) => {
        const opt = document.createElement("option");
        opt.value = i;
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

  async function exportSetDB() {
    // SetDB に保存されている全データを取得
    const settings = await window.SetDB.get(); // "settings" の中身
  
    // 他の key も含めたい場合はここで追加
    const extraKeys = ["settings"]; // 必要なら増やす
    const all = {};
  
    for (const key of extraKeys) {
      const value = await window.SetDB.getItem(key);
      all[key] = value;
    }
  
    // JSON をダウンロード
    const blob = new Blob([JSON.stringify(all, null, 2)], {
      type: "application/json"
    });
  
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sp3-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  
  // ---- Import ----
  async function importSetDB(json) {
    // 既存データを全部削除
    await window.SetDB.clear();
  
    // JSON の内容をすべて書き戻す
    for (const key in json) {
      await window.SetDB.setItem(key, json[key]);
    }
  }
  
  // ---- JSON 読み込み ----
  function readJSON(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(JSON.parse(reader.result));
      reader.readAsText(file);
    });
  }
  
  // ===============================
  // ボタンイベント
  // ===============================
  
  document.getElementById("data-export").addEventListener("click", async () => {
    await exportSetDB();
    alert("設定データをエクスポートしました");
  });
  
  document.getElementById("data-import").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
  
    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
  
      const json = await readJSON(file);
      await importSetDB(json);
  
      alert("設定データをインポートしました");
    };
  
    input.click();
  });
}
