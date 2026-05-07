const storageArea = globalThis.chrome && chrome.storage && chrome.storage.local;

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
