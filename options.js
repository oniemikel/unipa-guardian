const storageArea = globalThis.chrome && chrome.storage && chrome.storage.local;
const SAVE_KEY = "unipa_zombie_text";
const FILE_STORE_KEY = "unipa_zombie_file";

const modalBackdrop = document.getElementById("modalBackdrop");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");
const toast = document.getElementById("toast");

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

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function openModal({ title, message, confirmLabel = "OK", cancelLabel = "キャンセル" }) {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalConfirm.textContent = confirmLabel;
    modalCancel.textContent = cancelLabel;
    modalBackdrop.hidden = false;
    modal.hidden = false;

    const close = (result) => {
      modalBackdrop.hidden = true;
      modal.hidden = true;
      modalConfirm.removeEventListener("click", onConfirm);
      modalCancel.removeEventListener("click", onCancel);
      modalBackdrop.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };

    const onConfirm = () => close(true);
    const onCancel = () => close(false);
    const onKeydown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    modalConfirm.addEventListener("click", onConfirm);
    modalCancel.addEventListener("click", onCancel);
    modalBackdrop.addEventListener("click", onCancel);
    document.addEventListener("keydown", onKeydown);
    modalConfirm.focus();
  });
}

async function confirmAndRun(message, action, doneMessage) {
  const confirmed = await openModal({
    title: "確認",
    message,
    confirmLabel: "削除する",
    cancelLabel: "キャンセル",
  });
  if (!confirmed) return;
  action();
  showToast(doneMessage);
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
