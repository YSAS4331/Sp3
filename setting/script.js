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
  // 保存済み設定をロードして反映
  // ============================
  window.addEventListener("sp3settings-ready", async () => {
    const db = window.SetDB;
    if (!db) return;

    const saved = await db.get();
    if (!saved) return;

    UIs.weapon.value = saved.weapon ?? "";
    UIs.match.value = saved.match ?? "";
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
      weapon: UIs.weapon.value,
      match: UIs.match.value,
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
