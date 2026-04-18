// ===============================
// グローバル変数（最低限）
// ===============================
let db = null;

const DB_NAME = "sp3_battle_log";
const STORE_NAME = "battle_records";
const DB_VERSION = 2; // ★ match インデックス追加のため v2

// ===============================
// init() — DB 初期化
// ===============================
export async function init() {

  async function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        let store;

        // ★ 既存ストアがあるかどうか
        if (db.objectStoreNames.contains(STORE_NAME)) {
          store = event.target.transaction.objectStore(STORE_NAME);
        } else {
          store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
          });
        }

        // ★ 既存インデックスが無ければ作成（互換性維持）
        if (!store.indexNames.contains("weapon"))
          store.createIndex("weapon", "weapon");

        if (!store.indexNames.contains("stage"))
          store.createIndex("stage", "stage");

        if (!store.indexNames.contains("rule"))
          store.createIndex("rule", "rule");

        if (!store.indexNames.contains("result"))
          store.createIndex("result", "result");

        // ★ v2 追加：match インデックス
        if (!store.indexNames.contains("match"))
          store.createIndex("match", "match");

        if (!store.indexNames.contains("weapon_stage"))
          store.createIndex("weapon_stage", ["weapon", "stage"]);

        if (!store.indexNames.contains("weapon_rule"))
          store.createIndex("weapon_rule", ["weapon", "rule"]);

        if (!store.indexNames.contains("stage_rule"))
          store.createIndex("stage_rule", ["stage", "rule"]);

        if (!store.indexNames.contains("weapon_stage_rule"))
          store.createIndex("weapon_stage_rule", ["weapon", "stage", "rule"]);
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // ===============================
  // DB 操作 API
  // ===============================

  function addRecord(record) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add(record).onsuccess = () => resolve(true);
    });
  }

  function getAllRecords() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      const req = store.getAll();
      req.onerror = () => reject(req.error);

      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  function getByIndex(indexName, key) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      tx.objectStore(STORE_NAME).index(indexName).getAll(key).onsuccess =
        (e) => resolve(e.target.result);
    });
  }

  function getByMultiIndex(indexName, keys) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      tx.objectStore(STORE_NAME).index(indexName).getAll(keys).onsuccess =
        (e) => resolve(e.target.result);
    });
  }

  function summarize(records) {
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
    const lose = records.length - win;

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
  }

  function updateRecord(id, newData) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result;

        if (!record) {
          resolve(false);
          return;
        }

        const updated = { ...record, ...newData };

        store.put(updated).onsuccess = () => resolve(true);
      };

      getReq.onerror = (e) => reject(e.target.error);
    });
  }

  // ===============================
  // DB 初期化
  // ===============================
  await openDB();

  window.Sp3DBReady = true;

  // API を公開
  window.Sp3DB = {
    addRecord,
    getAllRecords,
    getByIndex,
    getByMultiIndex,
    summarize,
    updateRecord
  };

  // ★★★ DB 初期化完了イベント ★★★
  window.dispatchEvent(new CustomEvent("sp3db-ready"));
}
