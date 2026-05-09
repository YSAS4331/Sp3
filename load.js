// 1. 静的インポート（これらはトップレベルに必須）
// もしこれらのファイルが存在しない場合、ここで実行が止まりエラーが出ます
import '/Sp3/component/accordion.js';
import '/Sp3/component/header.js';
import '/Sp3/component/aside.js';
import '/Sp3/SETTING.js';
import { createIcons, icons } from "https://esm.sh/lucide";
import { init } from '/Sp3/db.js';

console.log("%c[Debug] 1. 静的インポート完了", "color: orange; font-weight: bold;");

// 2. メイン処理
(async () => {
    console.log("[Debug] 2. 非同期IIFEが起動しました");

    try {
        // DBの初期化
        await init();
        createIcons({ icons });
        console.log("[Debug] 3. DB初期化 & アイコン生成完了");

        // SETTINGSの存在確認
        if (!window.SETTINGS) {
            throw new Error("window.SETTINGS が未定義です。SETTING.js 内の記述を確認してください。");
        }

        // JSONの読み込み開始
        console.log("[Debug] 4. データ読み込みを開始します...");
        
        await Promise.all([
            loadJsonWithVersion('/Sp3/datas/ids.json', 'ids', window.SETTINGS['IDS_VERSION']),
            loadJsonWithVersion('/Sp3/datas/translate.json', 'translate', window.SETTINGS['TRANSLATE_VERSION'])
        ]);

        console.log("%c[Debug] 5. すべての処理が正常に終了しました", "color: cyan; font-weight: bold;");

    } catch (e) {
        console.error("%c[Debug] 実行エラーが発生しました:", "color: red; font-weight: bold;", e);
    }
})();

// 3. ロジック関数
async function loadJsonWithVersion(url, key, requiredVersion) {
    console.log(`[loadJsonWithVersion] 実行開始: ${key} (Ver: ${requiredVersion})`);
    
    if (!window.SetDB) {
        throw new Error(`window.SetDB が見つかりません。db.js 内での代入を確認してください。`);
    }

    const existing = await window.SetDB.getItem(key);

    if (existing && existing.VERSION === requiredVersion) {
        console.log(`%c[${key}]%c キャッシュ利用 (Ver: ${requiredVersion})`, "color: #4CAF50; font-weight: bold", "color: inherit");
        return;
    }

    console.log(`[${key}] 新規フェッチ中: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${key} の取得に失敗しました (Status: ${res.status})`);

    const data = await res.json();
    await window.SetDB.setItem(key, { VERSION: requiredVersion, data });
    console.log(`%c[${key}]%c 保存完了`, "color: #2196F3; font-weight: bold", "color: inherit");
}
