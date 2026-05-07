const storageArea = globalThis.chrome && chrome.storage && chrome.storage.local;
const SAVE_KEY = "unipa_zombie_text";
const FILE_STORE_KEY = "unipa_zombie_file";
const DEFAULT_MONITOR_SETTINGS = {
  monitorTheme: "classic",
  monitorPosition: "bottom-right",
  monitorScale: 1,
  monitorOpacity: 0.9,
  monitorRadius: 10,
  monitorBorderWidth: 1,
  monitorBgColor: "#1a202c",
  monitorTextColor: "#4fd1c5",
  monitorBorderColor: "#2d3748",
  monitorShadow: 32,
  monitorCorner: "session",
};

const modalBackdrop = document.getElementById("modalBackdrop");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");
const toast = document.getElementById("toast");
const presetGrid = document.getElementById("presetGrid");
const monitorPreview = document.getElementById("monitorPreview");
const monitorPreviewBox = document.getElementById("monitorPreviewBox");

const monitorFields = {
  monitorTheme: document.getElementById("monitorTheme"),
  monitorPosition: document.getElementById("monitorPosition"),
  monitorScale: document.getElementById("monitorScale"),
  monitorOpacity: document.getElementById("monitorOpacity"),
  monitorRadius: document.getElementById("monitorRadius"),
  monitorBorderWidth: document.getElementById("monitorBorderWidth"),
  monitorBgColor: document.getElementById("monitorBgColor"),
  monitorTextColor: document.getElementById("monitorTextColor"),
  monitorBorderColor: document.getElementById("monitorBorderColor"),
  monitorShadow: document.getElementById("monitorShadow"),
  monitorCorner: document.getElementById("monitorCorner"),
};

const monitorValueLabels = {
  monitorScaleValue: document.getElementById("monitorScaleValue"),
  monitorOpacityValue: document.getElementById("monitorOpacityValue"),
  monitorRadiusValue: document.getElementById("monitorRadiusValue"),
  monitorBorderWidthValue: document.getElementById("monitorBorderWidthValue"),
  monitorShadowValue: document.getElementById("monitorShadowValue"),
};

const THEME_PRESETS = {
  classic: {
    monitorTheme: "classic",
    monitorPosition: "bottom-right",
    monitorScale: 1,
    monitorOpacity: 0.9,
    monitorRadius: 10,
    monitorBorderWidth: 1,
    monitorBgColor: "#1a202c",
    monitorTextColor: "#4fd1c5",
    monitorBorderColor: "#2d3748",
    monitorShadow: 32,
    monitorCorner: "session",
  },
  glass: {
    monitorTheme: "glass",
    monitorPosition: "bottom-right",
    monitorScale: 1,
    monitorOpacity: 0.78,
    monitorRadius: 14,
    monitorBorderWidth: 1,
    monitorBgColor: "#0f172a",
    monitorTextColor: "#ecfeff",
    monitorBorderColor: "#ffffff",
    monitorShadow: 24,
    monitorCorner: "session",
  },
  compact: {
    monitorTheme: "compact",
    monitorPosition: "bottom-left",
    monitorScale: 0.88,
    monitorOpacity: 0.92,
    monitorRadius: 8,
    monitorBorderWidth: 1,
    monitorBgColor: "#111827",
    monitorTextColor: "#a7f3d0",
    monitorBorderColor: "#334155",
    monitorShadow: 20,
    monitorCorner: "minimal",
  },
  alert: {
    monitorTheme: "alert",
    monitorPosition: "top-right",
    monitorScale: 1.02,
    monitorOpacity: 0.96,
    monitorRadius: 12,
    monitorBorderWidth: 1,
    monitorBgColor: "#7f1d1d",
    monitorTextColor: "#fecaca",
    monitorBorderColor: "#fca5a5",
    monitorShadow: 36,
    monitorCorner: "alert",
  },
};

function getMonitorSettingsFromForm() {
  return Object.keys(DEFAULT_MONITOR_SETTINGS).reduce((settings, key) => {
    const field = monitorFields[key];
    if (!field) return settings;

    settings[key] = field.type === "range" ? Number(field.value) : field.value;
    return settings;
  }, {});
}

function applyMonitorSettingsToForm(settings) {
  const merged = { ...DEFAULT_MONITOR_SETTINGS, ...settings };

  Object.entries(monitorFields).forEach(([key, field]) => {
    if (!field) return;
    field.value = merged[key];
  });

  updateMonitorValueLabels();
  updateMonitorPreview(merged);
}

function updateMonitorValueLabels() {
  if (monitorValueLabels.monitorScaleValue && monitorFields.monitorScale) {
    monitorValueLabels.monitorScaleValue.textContent = `${Number(monitorFields.monitorScale.value).toFixed(2)}x`;
  }
  if (monitorValueLabels.monitorOpacityValue && monitorFields.monitorOpacity) {
    monitorValueLabels.monitorOpacityValue.textContent = `${Math.round(Number(monitorFields.monitorOpacity.value) * 100)}%`;
  }
  if (monitorValueLabels.monitorRadiusValue && monitorFields.monitorRadius) {
    monitorValueLabels.monitorRadiusValue.textContent = `${monitorFields.monitorRadius.value}px`;
  }
  if (monitorValueLabels.monitorBorderWidthValue && monitorFields.monitorBorderWidth) {
    monitorValueLabels.monitorBorderWidthValue.textContent = `${monitorFields.monitorBorderWidth.value}px`;
  }
  if (monitorValueLabels.monitorShadowValue && monitorFields.monitorShadow) {
    monitorValueLabels.monitorShadowValue.textContent = `${monitorFields.monitorShadow.value}`;
  }
}

function updateMonitorPreview(settings = getMonitorSettingsFromForm()) {
  if (!monitorPreview || !monitorPreviewBox) return;

  const merged = { ...DEFAULT_MONITOR_SETTINGS, ...settings };
  const cornerMap = {
    session: { borderRadius: `${merged.monitorRadius}px`, padding: "12px 16px", minWidth: "160px" },
    alert: { borderRadius: `${merged.monitorRadius}px`, padding: "14px 16px", minWidth: "170px" },
    minimal: { borderRadius: `${Math.max(merged.monitorRadius - 4, 0)}px`, padding: "10px 12px", minWidth: "140px" },
  };

  const positionMap = {
    "bottom-right": { right: "12px", bottom: "12px", left: "auto", top: "auto" },
    "bottom-left": { left: "12px", bottom: "12px", right: "auto", top: "auto" },
    "top-right": { right: "12px", top: "12px", left: "auto", bottom: "auto" },
    "top-left": { left: "12px", top: "12px", right: "auto", bottom: "auto" },
  };

  Object.assign(monitorPreview.style, {
    backgroundColor: merged.monitorBgColor,
    color: merged.monitorTextColor,
    borderStyle: "solid",
    borderWidth: `${merged.monitorBorderWidth}px`,
    borderColor: merged.monitorBorderColor,
    opacity: merged.monitorOpacity,
    transform: `scale(${merged.monitorScale})`,
    boxShadow: `0 12px ${merged.monitorShadow}px rgba(15, 23, 42, 0.25)`,
    ...cornerMap[merged.monitorCorner],
    ...positionMap[merged.monitorPosition],
  });

  monitorPreview.dataset.theme = merged.monitorTheme;
  monitorPreviewBox.dataset.theme = merged.monitorTheme;
}

function applyPreset(presetName) {
  const preset = THEME_PRESETS[presetName];
  if (!preset) return;

  applyMonitorSettingsToForm(preset);
  if (presetGrid) {
    presetGrid.querySelectorAll(".preset-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.preset === presetName);
    });
  }
}

function getStoragePayload(showStatus) {
  return {
    showStatus,
    ...getMonitorSettingsFromForm(),
  };
}

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
  const payload = getStoragePayload(showStatus);

  if (storageArea && typeof storageArea.set === "function") {
    storageArea.set(payload, () => {
      // 保存完了を通知
      console.log("Settings saved");
      if (globalThis.chrome && chrome.tabs && typeof chrome.tabs.query === "function" && typeof chrome.tabs.sendMessage === "function") {
        chrome.tabs.query({ url: ["https://unipa.u-hyogo.ac.jp/*", "https://*.u-hyogo.ac.jp/*"] }, (tabs) => {
          (tabs || []).forEach((tab) => {
            if (tab && typeof tab.id === "number") {
              chrome.tabs.sendMessage(tab.id, {
                type: "unipa-guardian:settings-updated",
                settings: payload,
              });
            }
          });
        });
      }

      // ポップアップ（小窓）を閉じる
      window.close();
    });
    return;
  }

  window.close();
});

Object.values(monitorFields).forEach((field) => {
  if (!field) return;
  const eventName = field.type === "select-one" || field.type === "color" ? "change" : "input";
  field.addEventListener(eventName, () => {
    updateMonitorValueLabels();
    updateMonitorPreview();
    if (field.id === "monitorTheme" && THEME_PRESETS[field.value]) {
      const preset = THEME_PRESETS[field.value];
      Object.entries(preset).forEach(([key, value]) => {
        const target = monitorFields[key];
        if (target) target.value = value;
      });
      updateMonitorValueLabels();
      updateMonitorPreview(preset);
    }
  });
});

if (presetGrid) {
  presetGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".preset-btn");
    if (!button) return;
    applyPreset(button.dataset.preset);
  });
}

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
  storageArea.get({ showStatus: true, ...DEFAULT_MONITOR_SETTINGS }, (items) => {
    document.getElementById("showStatus").checked = items.showStatus;
    applyMonitorSettingsToForm(items);
    if (items.monitorTheme && THEME_PRESETS[items.monitorTheme]) {
      applyPreset(items.monitorTheme);
    } else if (presetGrid) {
      presetGrid.querySelectorAll(".preset-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.preset === items.monitorTheme);
      });
    }
  });
} else {
  document.getElementById("showStatus").checked = true;
  applyMonitorSettingsToForm(DEFAULT_MONITOR_SETTINGS);
  applyPreset(DEFAULT_MONITOR_SETTINGS.monitorTheme);
}
