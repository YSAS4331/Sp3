// ===============================
// 戦績DB（sp3_battle_log）
// ===============================
let battleDB = null;

const BATTLE_DB_NAME = "sp3_battle_log";
const BATTLE_STORE_NAME = "battle_records";
const BATTLE_DB_VERSION = 2; // match インデックス追加

// ===============================
// 設定DB（sp3_settings）
// ===============================
let settingsDB = null;

const SET_DB_NAME = "sp3_settings";
const SET_STORE_NAME = "settings";
const SET_DB_VERSION = 1;

// ===============================
// 初期化（両方）
// ===============================
export async function init() {
  await Promise.all([
    initBattleDB(),
    initSettingsDB()
  ]);

  // 初期化完了イベント
  window.dispatchEvent(new CustomEvent("sp3db-ready"));
  window.dispatchEvent(new CustomEvent("sp3settings-ready"));
}

/* ============================================================
   戦績DB 初期化
============================================================ */
async function initBattleDB() {
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(BATTLE_DB_NAME, BATTLE_DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        let store;

        // 既存ストアがあるか？
        if (db.objectStoreNames.contains(BATTLE_STORE_NAME)) {
          store = event.target.transaction.objectStore(BATTLE_STORE_NAME);
        } else {
          store = db.createObjectStore(BATTLE_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
          });
        }

        // 既存インデックスが無ければ作成
        if (!store.indexNames.contains("weapon"))
          store.createIndex("weapon", "weapon");

        if (!store.indexNames.contains("stage"))
          store.createIndex("stage", "stage");

        if (!store.indexNames.contains("rule"))
          store.createIndex("rule", "rule");

        if (!store.indexNames.contains("result"))
          store.createIndex("result", "result");

        // ★ v2 追加：match
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
        battleDB = event.target.result;
        resolve(battleDB);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  await openDB();

  // API 公開
  window.Sp3DB = {
    addRecord,
    getAllRecords,
    getByIndex,
    getByMultiIndex,
    summarize,
    updateRecord
  };
}

/* ============================================================
   戦績DB API
============================================================ */
function addRecord(record) {
  return new Promise((resolve) => {
    const tx = battleDB.transaction(BATTLE_STORE_NAME, "readwrite");
    tx.objectStore(BATTLE_STORE_NAME).add(record).onsuccess = () => resolve(true);
  });
}

function getAllRecords() {
  return new Promise((resolve, reject) => {
    const tx = battleDB.transaction(BATTLE_STORE_NAME, "readonly");
    const store = tx.objectStore(BATTLE_STORE_NAME);

    const req = store.getAll();
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

function getByIndex(indexName, key) {
  return new Promise((resolve) => {
    const tx = battleDB.transaction(BATTLE_STORE_NAME, "readonly");
    tx.objectStore(BATTLE_STORE_NAME).index(indexName).getAll(key).onsuccess =
      (e) => resolve(e.target.result);
  });
}

function getByMultiIndex(indexName, keys) {
  return new Promise((resolve) => {
    const tx = battleDB.transaction(BATTLE_STORE_NAME, "readonly");
    tx.objectStore(BATTLE_STORE_NAME).index(indexName).getAll(keys).onsuccess =
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
    const tx = battleDB.transaction(BATTLE_STORE_NAME, "readwrite");
    const store = tx.objectStore(BATTLE_STORE_NAME);

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

/* ============================================================
   設定DB 初期化
============================================================ */
async function initSettingsDB() {
  function openSettingsDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(SET_DB_NAME, SET_DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(SET_STORE_NAME)) {
          db.createObjectStore(SET_STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        settingsDB = event.target.result;
        resolve(settingsDB);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  await openSettingsDB();

  // API 公開
  window.SetDB = {
    get: getSettings,
    set: setSettings,
    clear: clearSettings,

    setItem,
    getItem,
    deleteItem
  };
}

/* ============================================================
   設定DB API
============================================================ */
function setSettings(json) {
  return new Promise((resolve) => {
    const tx = settingsDB.transaction(SET_STORE_NAME, "readwrite");
    const store = tx.objectStore(SET_STORE_NAME);

    store.put({
      key: "settings",
      value: json
    }).onsuccess = () => resolve(true);
  });
}

function getSettings() {
  return new Promise((resolve) => {
    const tx = settingsDB.transaction(SET_STORE_NAME, "readonly");
    const store = tx.objectStore(SET_STORE_NAME);

    store.get("settings").onsuccess = (e) => {
      resolve(e.target.result?.value ?? null);
    };
  });
}

function clearSettings() {
  return new Promise((resolve) => {
    const tx = settingsDB.transaction(SET_STORE_NAME, "readwrite");
    tx.objectStore(SET_STORE_NAME).delete("settings").onsuccess =
      () => resolve(true);
  });
}

function setItem(key, value) {
  return new Promise((resolve) => {
    const tx = settingsDB.transaction(SET_STORE_NAME, "readwrite");
    const store = tx.objectStore(SET_STORE_NAME);

    store.put({ key, value }).onsuccess = () => resolve(true);
  });
}

function getItem(key) {
  return new Promise((resolve) => {
    const tx = settingsDB.transaction(SET_STORE_NAME, "readonly");
    const store = tx.objectStore(SET_STORE_NAME);

    store.get(key).onsuccess = (e) => {
      resolve(e.target.result?.value ?? null);
    };
  });
}

function deleteItem(key) {
  return new Promise((resolve) => {
    const tx = settingsDB.transaction(SET_STORE_NAME, "readwrite");
    const store = tx.objectStore(SET_STORE_NAME);

    store.delete(key).onsuccess = () => resolve(true);
  });
}

async function convertRulesToEnglish() {
  const map = {
    "ナワバリ": "TurfWar",
    "ガチエリア": "SplatZones",
    "ガチヤグラ": "TowerControl",
    "ガチホコ": "Rainmaker",
    "ガチアサリ": "ClamBlitz"
  };

  const records = await getAllRecords();

  for (const rec of records) {
    const jp = rec.rule;
    if (map[jp]) {
      await updateRecord(rec.id, { rule: map[jp] });
    }
  }
}

(async () => {
  await convertRulesToEnglish();
  console.log('Rules to Englished');
})();
