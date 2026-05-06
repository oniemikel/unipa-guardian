document.getElementById("save").addEventListener("click", () => {
  const showStatus = document.getElementById("showStatus").checked;

  chrome.storage.local.set({ showStatus }, () => {
    // 保存完了を通知
    console.log("Settings saved");

    // ポップアップ（小窓）を閉じる
    window.close();
  });
});

const versionLabel = document.getElementById("versionLabel");
if (versionLabel) {
  const version = chrome.runtime.getManifest().version;
  versionLabel.textContent = `v${version} - Securely protecting your inputs`;
}

// ロード時に設定を読み込む
chrome.storage.local.get({ showStatus: true }, (items) => {
  document.getElementById("showStatus").checked = items.showStatus;
});
