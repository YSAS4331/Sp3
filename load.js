import '/Sp3/component/accordion.js';
import '/Sp3/component/header.js';
import '/Sp3/component/aside.js';
import '/Sp3/SETTING.js';
import { createIcons, icons } from "https://esm.sh/lucide";
createIcons({ icons });

import { init } from '/Sp3/db.js';
init();

(async () => {
  await Promise.all([
    loadJsonWithVersion("/Sp3/datas/ids.json", "ids", window.SETTINGS.IDS_VERSION),
    loadJsonWithVersion("/Sp3/datas/translate.json", "translate", window.SETTINGS.TRANSLATE_VERSION)
  ]);
})();

async function loadJsonWithVersion(url, key, requiredVersion) {
  const existing = await window.SetDB.getItem(key);

  if (existing && existing.VERSION === requiredVersion) {
    console.log(`[${key}] version OK → skip`);
    return;
  }

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch ${url}`);
    return;
  }

  const data = await res.json();

  const saveObj = {
    VERSION: requiredVersion,
    data
  };

  await window.SetDB.setItem(key, saveObj);
  console.log(`[${key}] saved with version ${requiredVersion}`);
}
