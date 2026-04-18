export function init() {
  // lucide アイコン読み込み
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
  // 保存済み設定を placeholder に反映
  // ============================
  window.addEventListener("sp3settings-ready", async () => {
    const db = window.SetDB;
    if (!db) return;

    const saved = await db.get();
    if (!saved) return;

    // ★ placeholder に反映
    if (saved.weapon) {
      UIs.weapon.placeholder = `現在: ${saved.weapon}`;
    }

    if (saved.match) {
      // セレクトは placeholder が無いので、最初の option を書き換える
      const firstOption = UIs.match.querySelector("option[value='']");
      if (firstOption) {
        firstOption.textContent = `現在: ${saved.match}`;
      }
    }
  });

  // ============================
  // フォーム送信（保存）
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
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました");
    }
  });
}
