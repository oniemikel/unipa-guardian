const storageArea = globalThis.chrome && chrome.storage && chrome.storage.local;
const SAVE_KEY = "unipa_zombie_text";
const FILE_STORE_KEY = "unipa_zombie_file";

function getAllLocalKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

function deleteBackupEntries(prefix) {
  getAllLocalKeys()
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => localStorage.removeItem(key));
}

function confirmAndRun(message, action, doneMessage) {
  if (!window.confirm(message)) return;
  action();
  window.alert(doneMessage);
}

document.getElementById("save").addEventListener("click", () => {
  const showStatus = document.getElementById("showStatus").checked;

  if (storageArea && typeof storageArea.set === "function") {
    storageArea.set({ showStatus }, () => {
      // 保存完了を通知
      console.log("Settings saved");

      // ポップアップ（小窓）を閉じる
      window.close();
    });
    return;
  }

  window.close();
});

document.getElementById("deleteTextBackups").addEventListener("click", () => {
  confirmAndRun(
    "バックアップ済みのテキストデータを削除します。よろしいですか？",
    () => deleteBackupEntries(`${SAVE_KEY}_`),
    "バックアップ済みのテキストデータを削除しました。",
  );
});

document.getElementById("deleteFileBackups").addEventListener("click", () => {
  confirmAndRun(
    "バックアップ済みのファイルデータを削除します。よろしいですか？",
    () => deleteBackupEntries(`${FILE_STORE_KEY}_`),
    "バックアップ済みのファイルデータを削除しました。",
  );
});

document.getElementById("deleteAllBackups").addEventListener("click", () => {
  confirmAndRun(
    "バックアップ済みの全データを削除します。よろしいですか？",
    () => {
      deleteBackupEntries(`${SAVE_KEY}_`);
      deleteBackupEntries(`${FILE_STORE_KEY}_`);
    },
    "バックアップ済みの全データを削除しました。",
  );
});

const versionLabel = document.getElementById("versionLabel");
if (versionLabel) {
  const version = globalThis.chrome && chrome.runtime ? chrome.runtime.getManifest().version : "unknown";
  versionLabel.textContent = `v${version} - Securely protecting your inputs`;
}

// ロード時に設定を読み込む
if (storageArea && typeof storageArea.get === "function") {
  storageArea.get({ showStatus: true }, (items) => {
    document.getElementById("showStatus").checked = items.showStatus;
  });
} else {
  document.getElementById("showStatus").checked = true;
}
