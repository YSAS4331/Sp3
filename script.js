/* ============================================================
   Splatoon3 Battle Logger - 共通 IndexedDB 管理スクリプト
   全ページ（トップ / weapons / stages / rules）で動作
============================================================ */

const DB_NAME = "sp3_battle_log";
const STORE_NAME = "battle_records";
const DB_VERSION = 1;

let db = null;

/* ============================================================
   IndexedDB 初期化
============================================================ */

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true
      });

      // 単体 index
      store.createIndex("weapon", "weapon");
      store.createIndex("stage", "stage");
      store.createIndex("rule", "rule");
      store.createIndex("result", "result");

      // 複合 index
      store.createIndex("weapon_stage", ["weapon", "stage"]);
      store.createIndex("weapon_rule", ["weapon", "rule"]);
      store.createIndex("stage_rule", ["stage", "rule"]);
      store.createIndex("weapon_stage_rule", ["weapon", "stage", "rule"]);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

/* ============================================================
   レコード追加
============================================================ */

const addRecord = (record) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.add(record);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e);
  });
};

/* ============================================================
   全件取得
============================================================ */

const getAllRecords = () => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e);
  });
};

/* ============================================================
   単一 index 取得
============================================================ */

const getByIndex = (indexName, key) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(indexName);

    const request = index.getAll(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e);
  });
};

/* ============================================================
   複合 index 取得
============================================================ */

const getByMultiIndex = (indexName, keys) => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(indexName);

    const request = index.getAll(keys);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e);
  });
};

/* ============================================================
   集計ロジック
============================================================ */

const summarize = (records) => {
  if (!records.length) {
    return {
      count: 0,
      win: 0,
      lose: 0,
      winRate: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgSpecial: 0
    };
  }

  const win = records.filter(r => r.result === "win").length;
  const lose = records.filter(r => r.result === "lose").length;

  const avg = (sum) => sum / records.length;

  return {
    count: records.length,
    win,
    lose,
    winRate: win / records.length,
    avgKills: avg(records.reduce((a, b) => a + b.kills, 0)),
    avgDeaths: avg(records.reduce((a, b) => a + b.deaths, 0)),
    avgSpecial: avg(records.reduce((a, b) => a + b.special, 0))
  };
};

/* ============================================================
   DOMContentLoaded → フォームがあるページだけ保存処理を実行
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  await openDB();

  const form = document.getElementById("battleForm");

  // フォームが無いページ（weapons/stages/rules）はここで終了
  if (!form) return;

  // フォームがあるページ（トップページ）だけ保存処理を実行
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const record = {
      kills: Number(document.getElementById("kills").value),
      deaths: Number(document.getElementById("deaths").value),
      special: Number(document.getElementById("special").value),
      weapon: document.getElementById("weapon").value,
      stage: document.getElementById("stage").value,
      rule: document.getElementById("rule").value,
      result: document.getElementById("result").value,
      timestamp: Date.now()
    };

    await addRecord(record);

    alert("保存しました！");
    form.reset();
  });
});

/* ============================================================
   外部ページ用 API
============================================================ */

window.Sp3DB = {
  getAllRecords,
  getByIndex,
  getByMultiIndex,
  summarize
};
