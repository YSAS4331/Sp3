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
  // 設定ロード関数（イベントでも即実行でもOK）
  // ============================
  async function loadSettings() {
    const db = window.SetDB;
    if (!db) return;

    const saved = await db.get();
    if (!saved) return;

    // weapon → placeholder
    if (saved.weapon) {
      UIs.weapon.placeholder = `現在: ${saved.weapon}`;
    }

    // match → select の最初の option を書き換え
    if (saved.match) {
      const firstOption = UIs.match.querySelector("option[value='']");
      if (firstOption) {
        firstOption.textContent = `現在: ${saved.match}`;
      }
    }
  }

  // ============================
  // DB ready を待つ
  // ============================
  if (window.SetDB) {
    // すでに初期化済みなら即ロード
    loadSettings();
  } else {
    // まだならイベントを待つ
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
      weapon: UIs.weapon.value || null,
      match: UIs.match.value || null,
      timestamp: Date.now()
    };

    try {
      await db.set(record);
      alert("設定を保存しました！");

      // 保存後に placeholder を更新
      loadSettings();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました");
    }
  });
}
