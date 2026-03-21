// ===============================
// グローバル変数（最低限）
// ===============================
let db = null;

const DB_NAME = "sp3_battle_log";
const STORE_NAME = "battle_records";
const DB_VERSION = 1;

// ===============================
// init() — ページ側が呼ぶ
// ===============================
export async function init() {

  /* ============================================================
     IndexedDB を開く（ローカル関数）
  ============================================================ */
  async function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true
        });

        store.createIndex("weapon", "weapon");
        store.createIndex("stage", "stage");
        store.createIndex("rule", "rule");
        store.createIndex("result", "result");

        store.createIndex("weapon_stage", ["weapon", "stage"]);
        store.createIndex("weapon_rule", ["weapon", "rule"]);
        store.createIndex("stage_rule", ["stage", "rule"]);
        store.createIndex("weapon_stage_rule", ["weapon", "stage", "rule"]);
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  /* ============================================================
     DB 操作 API（ローカル関数）
  ============================================================ */
  function addRecord(record) {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add(record).onsuccess = () => resolve(true);
    });
  }

  function getAllRecords() {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      tx.objectStore(STORE_NAME).getAll().onsuccess =
        (e) => resolve(e.target.result);
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

  /* ============================================================
     DB 初期化
  ============================================================ */
  await openDB();

  /* ============================================================
     フォーム保存処理（フォームがあるページのみ）
  ============================================================ */
  const form = document.getElementById("battleForm");
  if (form) {
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
  }

  /* ============================================================
     API を公開（UI 側が使う）
  ============================================================ */
  window.Sp3DB = {
    getAllRecords,
    getByIndex,
    getByMultiIndex,
    summarize
  };
}
