(function () {
  // --- 定数・ロジックは維持 ---
  const SAVE_KEY = "unipa_zombie_text";
  const FILE_STORE_KEY = "unipa_zombie_file";
  const PROTECTION_TIME = 3000;
  const SESSION_LIMIT = 15 * 60;
  let timeLeft = SESSION_LIMIT;
  let isProtected = false;
  let indicator = null;
  let timerStarted = false;
  let timerHandle = null;
  let monitorSettings = {
    showStatus: true,
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

  // --- 【新機能】CSSの注入 ---
  const style = document.createElement("style");
  style.textContent = `
      .unipa-rescue-panel {
          backdrop-filter: blur(5px);
          margin: 20px 0;
          padding: 18px;
          background: rgba(255, 255, 255, 0.95);
          border-left: 5px solid #28a745;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          font-family: 'Helvetica Neue', Arial, sans-serif;
          border: 1px solid #e0e0e0;
      }
      .rescue-header {
          display: flex;
          align-items: center;
          font-weight: 800;
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 14px;
          letter-spacing: 0.5px;
      }
      .rescue-header i { margin-right: 8px; font-style: normal; }

      .g-inject-btn, .g-dl-btn, .g-del-btn {
          user-select: none;
      }

      .g-inject-btn:hover { transform: scale(1.05); }
      .g-inject-btn:active { transform: scale(0.95); }
      
      .g-dl-btn:hover { transform: scale(1.05); }
      .g-del-btn:hover { transform: scale(1.05); }
        .g-file-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
          padding: 12px 15px;
          background: #ffffff;
          border: 1px solid #edf2f7;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .g-file-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
          border-color: #28a745;
        }
        .file-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1 1 auto;
        }
        .file-name {
          font-weight: 600;
          color: #4a5568;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
        }
        .file-status {
          font-size: 10px;
          color: #28a745;
          text-transform: uppercase;
          font-weight: bold;
          margin-top: 2px;
          letter-spacing: 0.04em;
        }
        .btn-group {
          display: flex;
          gap: 8px;
          flex: 0 0 auto;
        }
        .g-rescue-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          padding: 0;
          border-radius: 8px;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          -webkit-appearance: none;
          box-sizing: border-box;
          flex: 0 0 auto;
          user-select: none;
        }
        .g-rescue-btn--inject {
          border: none;
          background: #28a745;
          color: white;
        }
        .g-rescue-btn--inject:hover {
          background: #218838;
          transform: scale(1.05);
        }
        .g-rescue-btn--download {
          border: 1px solid #e2e8f0;
          background: #f7fafc;
          color: #718096;
        }
        .g-rescue-btn--download:hover {
          background: #edf2f7;
          color: #2d3748;
          transform: scale(1.05);
        }
        .g-rescue-btn--delete {
          border: 1px solid #fed7d7;
          background: #fff5f5;
          color: #c53030;
        }
        .g-rescue-btn--delete:hover {
          background: #fed7d7;
          color: #9b2c2c;
          transform: scale(1.05);
        }
        .g-rescue-btn:active {
          transform: scale(0.95);
        }

      /* インジケーターのデザイン */
      #zombie-indicator {
          z-index: 2147483647;
          padding: 12px 16px;
          background: rgba(26, 32, 44, 0.9);
          color: #4FD1C5;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          border-radius: 10px;
          border: 1px solid #2D3748;
          pointer-events: none;
          line-break: anywhere;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s ease;
      }
        #zombie-indicator__label {
          color:#A0AEC0;
          font-size:10px;
        }
        #zombie-indicator__time {
          font-size:14px;
          font-weight:bold;
          opacity:60%;
        }
          #zombie-indicator.is-expired {
            color: #FCA5A5;
            border-color: rgba(248, 113, 113, 0.35);
          }
          #zombie-indicator.is-expired #zombie-indicator__label {
            color: #FECACA;
          }
          #zombie-indicator.is-expired #zombie-indicator__time {
            color: #FCA5A5;
            opacity: 1;
          }
          #zombie-indicator[data-theme="glass"] {
                backdrop-filter: blur(14px);
              }
          #zombie-indicator[data-theme="compact"] {
                font-size: 11px;
              }
          #zombie-indicator[data-theme="alert"] {
                border-width: 2px;
                box-shadow: 0 10px 40px rgba(127, 29, 29, 0.35);
              }
          .unipa-feedback {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #28a745;
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }
          .unipa-restore-btn {
            display: block;
            margin: 10px 0;
            padding: 8px 16px;
            background: #f0ad4e;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            transition: 0.2s;
          }
          .unipa-restore-btn:hover {
            background: #ec971f;
          }
  `;
  (document.head || document.documentElement).appendChild(style);

  // --- ロジック ---
  function getElementFingerprint(el, type) {
    const path = window.location.pathname;
    const idHint =
      (el.id || el.name || "").split(":").slice(-2, -1)[0] || "fixed";
    const allElements = Array.from(document.querySelectorAll(type));
    let index = allElements.indexOf(el);
    return `${path}_${type}_${idHint}_${index === -1 ? 0 : index}`;
  }

  function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  function injectFileToInput(inputEl, fileData) {
    const file = dataURLtoFile(fileData.data, fileData.name);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputEl.files = dataTransfer.files;

    const event = new Event("change", { bubbles: true });
    inputEl.dispatchEvent(event);

    // トースト通知のようなフィードバック（alertの代わり）
    const feedback = document.createElement("div");
    feedback.className = "unipa-feedback";
    feedback.innerText = `✅ ${fileData.name} を復旧しました`;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
  }

  function applyRescuePanelStyle(panel) {
    panel.style.backdropFilter = "blur(5px)";
  }

  function applyRescueHeaderStyle(header) {
    void header;
  }

  function applyRescueCardStyle(card) {
    void card;
  }

  function applyRescueInfoStyle(info) {
    void info;
  }

  function applyFileNameStyle(nameEl) {
    void nameEl;
  }

  function applyFileStatusStyle(statusEl) {
    void statusEl;
  }

  function applyButtonGroupStyle(group) {
    void group;
  }

  function applyRescueButtonStyle(button, variant) {
    button.classList.add("g-rescue-btn", `g-rescue-btn--${variant}`);
    void button;
  }

  function refreshMonitorDisplay(settings) {
    monitorSettings = { ...monitorSettings, ...settings };
    const indicatorEl = document.getElementById("zombie-indicator");
    if (!indicatorEl) return;

    indicatorEl.dataset.theme = monitorSettings.monitorTheme;
    indicatorEl.style.background = monitorSettings.monitorBgColor;
    indicatorEl.style.color = monitorSettings.monitorTextColor;
    indicatorEl.style.borderColor = monitorSettings.monitorBorderColor;
    indicatorEl.style.borderWidth = `${monitorSettings.monitorBorderWidth}px`;
    indicatorEl.style.borderStyle = "solid";
    indicatorEl.style.borderRadius = `${monitorSettings.monitorRadius}px`;
    indicatorEl.style.opacity = String(monitorSettings.monitorOpacity);
    indicatorEl.style.boxShadow = `0 12px ${monitorSettings.monitorShadow}px rgba(0,0,0,0.3)`;
    indicatorEl.style.transform = `scale(${monitorSettings.monitorScale})`;
    indicatorEl.style.position = "fixed";

    const positionMap = {
      "bottom-right": { right: "12px", bottom: "12px", left: "auto", top: "auto" },
      "bottom-left": { left: "12px", bottom: "12px", right: "auto", top: "auto" },
      "top-right": { right: "12px", top: "12px", left: "auto", bottom: "auto" },
      "top-left": { left: "12px", top: "12px", right: "auto", bottom: "auto" },
    };

    Object.assign(indicatorEl.style, positionMap[monitorSettings.monitorPosition] || positionMap["bottom-right"]);
  }

  function handleSettingsUpdated(message) {
    if (!message || message.type !== "unipa-guardian:settings-updated") return;
    refreshMonitorDisplay(message.settings || {});
  }

  if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.onMessage?.addListener === "function") {
    chrome.runtime.onMessage.addListener((message) => {
      handleSettingsUpdated(message);
    });
  }

  function ensureModalRoot() {
    let root = document.getElementById("unipa-guardian-modal-root");
    if (root) return root;

    root = document.createElement("div");
    root.id = "unipa-guardian-modal-root";
    root.innerHTML = `
      <div class="ug-modal-backdrop" hidden></div>
      <div class="ug-modal" role="dialog" aria-modal="true" aria-labelledby="ug-modal-title" hidden>
        <div class="ug-modal__card">
          <h2 id="ug-modal-title" class="ug-modal__title"></h2>
          <p class="ug-modal__message"></p>
          <div class="ug-modal__actions">
            <button type="button" class="ug-modal__btn ug-modal__btn--secondary" data-action="cancel">キャンセル</button>
            <button type="button" class="ug-modal__btn ug-modal__btn--primary" data-action="confirm">OK</button>
          </div>
        </div>
      </div>
    `;

    const modalStyle = document.createElement("style");
    modalStyle.textContent = `
      .ug-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        z-index: 2147483646;
      }
      .ug-modal {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        z-index: 2147483647;
        padding: 20px;
      }
      .ug-modal__card {
        width: min(92vw, 420px);
        background: #fff;
        color: #1e293b;
        border-radius: 16px;
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
        padding: 20px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .ug-modal__title {
        margin: 0 0 10px;
        font-size: 16px;
        line-height: 1.4;
      }
      .ug-modal__message {
        margin: 0;
        font-size: 13px;
        line-height: 1.7;
        color: #475569;
        white-space: pre-wrap;
      }
      .ug-modal__actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }
      .ug-modal__btn {
        border: none;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .ug-modal__btn--secondary {
        background: #e2e8f0;
        color: #334155;
      }
      .ug-modal__btn--primary {
        background: #dc2626;
        color: #fff;
      }
    `;

    document.head.appendChild(modalStyle);
    document.body.appendChild(root);
    return root;
  }

  function showModal({ title, message, confirmLabel = "OK", cancelLabel = "キャンセル" }) {
    return new Promise((resolve) => {
      const root = ensureModalRoot();
      const backdrop = root.querySelector(".ug-modal-backdrop");
      const modal = root.querySelector(".ug-modal");
      const titleEl = root.querySelector(".ug-modal__title");
      const messageEl = root.querySelector(".ug-modal__message");
      const confirmBtn = root.querySelector('[data-action="confirm"]');
      const cancelBtn = root.querySelector('[data-action="cancel"]');

      titleEl.textContent = title;
      messageEl.textContent = message;
      confirmBtn.textContent = confirmLabel;
      cancelBtn.textContent = cancelLabel;
      backdrop.hidden = false;
      modal.hidden = false;

      const close = (result) => {
        backdrop.hidden = true;
        modal.hidden = true;
        confirmBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        backdrop.removeEventListener("click", onCancel);
        document.removeEventListener("keydown", onKeydown);
        root.remove();
        resolve(result);
      };

      const onConfirm = () => close(true);
      const onCancel = () => close(false);
      const onKeydown = (event) => {
        if (event.key === "Escape") onCancel();
      };

      confirmBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
      backdrop.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKeydown);
      confirmBtn.focus();
    });
  }

  function createFileRescuePanel(insertTarget, fileList, inputEl) {
    const oldPanel = insertTarget.querySelector(".unipa-rescue-panel");
    if (oldPanel) oldPanel.remove();

    const container = document.createElement("div");
    container.className = "unipa-rescue-panel";
    applyRescuePanelStyle(container);

    const fileItems = fileList
      .map(
        (file, idx) => `
          <div class="g-file-card">
              <div class="file-info">
                  <span class="file-name">${file.name}</span>
                  <span class="file-status">● Protected</span>
              </div>
              <div class="btn-group">
                  <button class="g-inject-btn" data-idx="${idx}" title="復元" aria-label="復元">🔄</button>
                  <button class="g-dl-btn" data-idx="${idx}" title="ダウンロード" aria-label="ダウンロード">⬇️</button>
                  <button class="g-del-btn" data-idx="${idx}" title="削除" aria-label="削除">🗑️</button>
              </div>
          </div>
      `,
      )
      .join("");

    container.innerHTML = `
          <div class="rescue-header"><i>🛡️</i> 復元可能なファイル一覧</div>
          ${fileItems}
      `;

    const header = container.querySelector(".rescue-header");
    if (header) applyRescueHeaderStyle(header);

    container.querySelectorAll(".g-file-card").forEach((card) => {
      applyRescueCardStyle(card);
    });

    container.querySelectorAll(".file-info").forEach((info) => {
      applyRescueInfoStyle(info);
    });

    container.querySelectorAll(".file-name").forEach((nameEl) => {
      applyFileNameStyle(nameEl);
    });

    container.querySelectorAll(".file-status").forEach((statusEl) => {
      applyFileStatusStyle(statusEl);
    });

    container.querySelectorAll(".btn-group").forEach((group) => {
      applyButtonGroupStyle(group);
    });

    container.querySelectorAll(".g-inject-btn").forEach((btn) => {
      applyRescueButtonStyle(btn, "inject");
      btn.onclick = (e) => {
        e.preventDefault();
        injectFileToInput(inputEl, fileList[btn.dataset.idx]);
      };
    });


  const UPDATE_CONFIG = {
    storageKey: "unipa_guardian_update_notice",
    bannerId: "unipa-guardian-update-banner",
    styleId: "unipa-guardian-update-banner-style",
    versionUrl: "https://oniemikel.github.io/unipa-guardian/update.json",
  };

  function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
  }

  function compareVersions(leftVersion, rightVersion) {
    const leftParts = String(leftVersion)
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);
    const rightParts = String(rightVersion)
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);
    const length = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < length; index += 1) {
      const left = leftParts[index] || 0;
      const right = rightParts[index] || 0;
      if (left > right) return 1;
      if (left < right) return -1;
    }

    return 0;
  }

  function getStorageValue(keys) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(keys, (result) => {
          resolve(result || {});
        });
      } catch (error) {
        resolve({});
      }
    });
  }

  function setStorageValue(items) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set(items, () => resolve());
      } catch (error) {
        resolve();
      }
    });
  }

  function ensureUpdateBannerStyle() {
    if (document.getElementById(UPDATE_CONFIG.styleId)) return;

    const styleEl = document.createElement("style");
    styleEl.id = UPDATE_CONFIG.styleId;
    styleEl.textContent = `
      #${UPDATE_CONFIG.bannerId} {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2147483647;
        box-sizing: border-box;
        padding: 14px 16px;
        background: rgba(15, 23, 42, 0.96);
        color: #e2e8f0;
        border-bottom: 1px solid rgba(148, 163, 184, 0.24);
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.24);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__inner {
        display: flex;
        align-items: center;
        gap: 14px;
        justify-content: space-between;
        width: min(1120px, 100%);
        margin: 0 auto;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__message {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        flex: 1 1 auto;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__title {
        font-size: 14px;
        font-weight: 700;
        line-height: 1.4;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__detail {
        font-size: 12px;
        line-height: 1.5;
        color: #cbd5e1;
        white-space: pre-wrap;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__actions {
        display: flex;
        gap: 8px;
        flex: 0 0 auto;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__btn {
        appearance: none;
        border: none;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__btn:hover {
        transform: translateY(-1px);
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__btn:active {
        transform: translateY(0);
        opacity: 0.9;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__btn--primary {
        background: #38bdf8;
        color: #082f49;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__btn--secondary {
        background: #334155;
        color: #e2e8f0;
      }
      #${UPDATE_CONFIG.bannerId} .ug-update-banner__btn--ghost {
        background: rgba(148, 163, 184, 0.16);
        color: #e2e8f0;
      }
      body.ug-update-banner-open {
        padding-top: 76px;
      }
    `;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  function removeUpdateBanner() {
    const banner = document.getElementById(UPDATE_CONFIG.bannerId);
    if (banner) banner.remove();
    document.body.classList.remove("ug-update-banner-open");
  }

  function showUpdateBanner(updateInfo, currentVersion) {
    if (document.getElementById(UPDATE_CONFIG.bannerId)) return;

    ensureUpdateBannerStyle();

    const banner = document.createElement("div");
    banner.id = UPDATE_CONFIG.bannerId;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = `
      <div class="ug-update-banner__inner">
        <div class="ug-update-banner__message">
          <div class="ug-update-banner__title"></div>
          <div class="ug-update-banner__detail"></div>
        </div>
        <div class="ug-update-banner__actions">
          <button type="button" class="ug-update-banner__btn ug-update-banner__btn--primary" data-action="download">ダウンロード</button>
          <button type="button" class="ug-update-banner__btn ug-update-banner__btn--secondary" data-action="later">後で通知</button>
          <button type="button" class="ug-update-banner__btn ug-update-banner__btn--ghost" data-action="mute">通知しない</button>
        </div>
      </div>
    `;

    const titleEl = banner.querySelector(".ug-update-banner__title");
    const detailEl = banner.querySelector(".ug-update-banner__detail");
    const downloadBtn = banner.querySelector('[data-action="download"]');
    const laterBtn = banner.querySelector('[data-action="later"]');
    const muteBtn = banner.querySelector('[data-action="mute"]');

    titleEl.textContent = `新しいバージョン ${updateInfo.version} が利用できます`;
    detailEl.textContent = updateInfo.message || `現在のバージョン: ${currentVersion}`;

    downloadBtn.addEventListener("click", () => {
      if (updateInfo.release_url) {
        window.open(updateInfo.release_url, "_blank", "noopener,noreferrer");
      }
      removeUpdateBanner();
    });

    laterBtn.addEventListener("click", () => {
      removeUpdateBanner();
    });

    muteBtn.addEventListener("click", async () => {
      await setStorageValue({ [UPDATE_CONFIG.storageKey]: getTodayDateString() });
      removeUpdateBanner();
    });

    document.body.appendChild(banner);
    document.body.classList.add("ug-update-banner-open");
  }

  async function checkForUpdate() {
    try {
      const today = getTodayDateString();
      const stored = await getStorageValue(UPDATE_CONFIG.storageKey);
      if (stored[UPDATE_CONFIG.storageKey] === today) return;

      const response = await fetch(UPDATE_CONFIG.versionUrl, { cache: "no-store" });
      if (!response.ok) return;

      const updateInfo = await response.json();
      const currentVersion = chrome.runtime.getManifest().version;
      if (!updateInfo || typeof updateInfo.version !== "string") return;

      if (compareVersions(updateInfo.version, currentVersion) > 0) {
        showUpdateBanner(updateInfo, currentVersion);
      }
    } catch (error) {
      console.warn("[UNIPA Guardian] Update check failed:", error);
    }
  }

  checkForUpdate();
    container.querySelectorAll(".g-dl-btn").forEach((btn) => {
      applyRescueButtonStyle(btn, "download");
      btn.onclick = (e) => {
        e.preventDefault();
        const file = fileList[btn.dataset.idx];
        const link = document.createElement("a");
        link.href = file.data;
        link.download = file.name;
        link.click();
      };
    });

    container.querySelectorAll(".g-del-btn").forEach((btn) => {
      applyRescueButtonStyle(btn, "delete");
      btn.onclick = (e) => {
        e.preventDefault();
        const idx = Number(btn.dataset.idx);
        const file = fileList[idx];
        showModal({
          title: "保存済みファイルを削除しますか？",
          message: `${file.name}\n\nこの操作は元に戻せません。`,
          confirmLabel: "削除する",
          cancelLabel: "キャンセル",
        }).then((confirmed) => {
          if (!confirmed) return;

          const fp = getElementFingerprint(inputEl, 'input[type="file"]');
          const raw = localStorage.getItem(`${FILE_STORE_KEY}_${fp}`);
          let list = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(list)) list = [list];

          const nextList = list.filter((item) => item && item.name !== file.name);
          if (nextList.length > 0) {
            localStorage.setItem(`${FILE_STORE_KEY}_${fp}`, JSON.stringify(nextList));
          } else {
            localStorage.removeItem(`${FILE_STORE_KEY}_${fp}`);
          }

          createFileRescuePanel(insertTarget, nextList, inputEl);
        });
      };
    });

    insertTarget.appendChild(container);
  }

  // --- その他、文章復元・監視・タイマーは完成版を継承 ---
  function processElements() {
    document.querySelectorAll("textarea").forEach((target) => {
      if (target.dataset.guardianProcessed) return;
      const fp = getElementFingerprint(target, "textarea");
      const backup = localStorage.getItem(`${SAVE_KEY}_${fp}`);
      if (backup && backup.trim() !== "") {
        const btn = document.createElement("button");
        btn.className = "unipa-restore-btn";
        btn.innerText = "🔄 文章を復元";
        btn.onclick = (e) => {
          e.preventDefault();
          target.value = backup;
        };
        target.parentNode.insertBefore(btn, target);
      }
      target.dataset.guardianProcessed = "true";
    });

    document.querySelectorAll('input[type="file"]').forEach((input) => {
      if (input.dataset.guardianProcessed) return;
      const fp = getElementFingerprint(input, 'input[type="file"]');
      const data = localStorage.getItem(`${FILE_STORE_KEY}_${fp}`);
      if (data) {
        try {
          let list = JSON.parse(data);
          if (!Array.isArray(list)) list = [list];
          const container = input.closest(".ui-fileupload") || input.parentNode;
          createFileRescuePanel(container, list, input);
        } catch (e) {}
      }
      input.dataset.guardianProcessed = "true";
    });
  }

  function setupEventListeners() {
    const observer = new MutationObserver((mutations) => {
      let shouldReset = false;

      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;

        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;

          if (
            node.matches(
              ".ui-dialog, .ui-widget-overlay, .modal, .dialog, [role='dialog'], [aria-modal='true'], .popover, .tooltip, .popup",
            ) ||
            node.querySelector(
              ".ui-dialog, .ui-widget-overlay, .modal, .dialog, [role='dialog'], [aria-modal='true'], .popover, .tooltip, .popup",
            )
          ) {
            shouldReset = true;
            break;
          }

          if (node.querySelector("button, a[href], input, select, textarea, iframe, table, [data-command], [data-action]")) {
            shouldReset = true;
            break;
          }
        }

        if (shouldReset) break;
      }

      processElements();
      if (shouldReset) resetSessionTimer();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("change", (e) => {
      const el = e.target;
      if (el.tagName === "INPUT" && el.type === "file" && el.files.length > 0) {
        const fp = getElementFingerprint(el, 'input[type="file"]');
        const raw = localStorage.getItem(`${FILE_STORE_KEY}_${fp}`);
        let list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [list];

        Array.from(el.files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            const newF = { name: file.name, data: reader.result };
            const idx = list.findIndex((f) => f.name === file.name);
            if (idx > -1) list[idx] = newF;
            else list.push(newF);
            localStorage.setItem(
              `${FILE_STORE_KEY}_${fp}`,
              JSON.stringify(list),
            );
            el.dataset.guardianProcessed = "";
            processElements();
          };
          reader.readAsDataURL(file);
        });
      }
    });

    document.addEventListener("input", (e) => {
      if (isProtected) return;
      if (e.target.tagName === "TEXTAREA") {
        const fp = getElementFingerprint(e.target, "textarea");
        localStorage.setItem(`${SAVE_KEY}_${fp}`, e.target.value);
      }
    });
  }

  function createStatusIndicator() {
    if (indicator && document.contains(indicator)) return;

    const existing = document.getElementById("zombie-indicator");
    if (existing) {
      indicator = existing;
      return;
    }

    indicator = document.createElement("div");
    indicator.id = "zombie-indicator";
    indicator.dataset.theme = monitorSettings.monitorTheme;
    applyMonitorStyle(indicator, monitorSettings);
    indicator.innerHTML = `
      <span id="zombie-indicator__label">UNIPA SESSION</span><br>
      <span id="zombie-indicator__time">⏳ 15:00</span>
    `;
    (document.body || document.documentElement).appendChild(indicator);
  }

  function applyMonitorStyle(target, settings) {
    const positionMap = {
      "bottom-right": { right: "15px", bottom: "15px", left: "auto", top: "auto" },
      "bottom-left": { left: "15px", bottom: "15px", right: "auto", top: "auto" },
      "top-right": { right: "15px", top: "15px", left: "auto", bottom: "auto" },
      "top-left": { left: "15px", top: "15px", right: "auto", bottom: "auto" },
    };

    const base = {
      position: "fixed",
      pointerEvents: "none",
      lineBreak: "anywhere",
      opacity: String(settings.monitorOpacity),
      transform: `scale(${settings.monitorScale})`,
      background: settings.monitorBgColor,
      color: settings.monitorTextColor,
      borderRadius: `${settings.monitorRadius}px`,
      borderStyle: "solid",
      borderWidth: `${settings.monitorBorderWidth}px`,
      borderColor: settings.monitorBorderColor,
      boxShadow: `0 8px ${settings.monitorShadow}px rgba(0,0,0,0.3)`,
    };

    Object.assign(target.style, base, positionMap[settings.monitorPosition] || positionMap["bottom-right"]);

    if (settings.monitorCorner === "minimal") {
      target.style.padding = "10px 12px";
      target.style.fontSize = "11px";
    } else if (settings.monitorCorner === "alert") {
      target.style.padding = "14px 16px";
      target.style.boxShadow = `0 10px ${settings.monitorShadow}px rgba(127, 29, 29, 0.35)`;
    } else {
      target.style.padding = "12px 16px";
    }
  }

  function resetSessionTimer() {
    if (timeLeft <= 0) return;
    timeLeft = SESSION_LIMIT;
    renderStatusIndicator();
  }

  function renderStatusIndicator() {
    if (!indicator) return;

    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const timeEl = indicator.querySelector("#zombie-indicator__time");
    const labelEl = indicator.querySelector("#zombie-indicator__label");

    if (timeLeft <= 0) {
      indicator.classList.add("is-expired");
      if (labelEl) labelEl.textContent = "SESSION EXPIRED";
      if (timeEl) timeEl.textContent = "⛔ セッション切れです";
      return;
    }

    indicator.classList.remove("is-expired");
    if (labelEl) labelEl.textContent = "UNIPA SESSION";
    if (timeEl) timeEl.textContent = `⏳ ${min}:${sec.toString().padStart(2, "0")}`;
  }

  function startTimer() {
    if (timerHandle !== null) return;

    renderStatusIndicator();
    timerHandle = setInterval(() => {
      timeLeft--;
      if (timeLeft < 0) timeLeft = 0;
      renderStatusIndicator();
    }, 1000);
  }

  function trackSuccessfulRequest() {
    const nativeFetch = globalThis.fetch;
    if (typeof nativeFetch === "function" && !nativeFetch.__unipaWrapped) {
      const wrappedFetch = (...args) =>
        nativeFetch(...args)
          .then((response) => {
            if (response && response.ok) resetSessionTimer();
            return response;
          })
          .catch((error) => {
            throw error;
          });
      wrappedFetch.__unipaWrapped = true;
      globalThis.fetch = wrappedFetch;
    }

    const XhrProto = globalThis.XMLHttpRequest && globalThis.XMLHttpRequest.prototype;
    if (!XhrProto || XhrProto.__unipaWrapped) return;

    const nativeSend = XhrProto.send;
    XhrProto.send = function (...args) {
      this.addEventListener("load", () => {
        if (this.status >= 200 && this.status < 400) {
          resetSessionTimer();
        }
      });
      return nativeSend.apply(this, args);
    };
    XhrProto.__unipaWrapped = true;
  }

  function trackFormSubmissions() {
    document.addEventListener(
      "submit",
      (event) => {
        if (timeLeft <= 0) return;
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;

        const submitter = event.submitter;
        if (submitter instanceof Element) {
          const type = submitter.getAttribute("type");
          if (type === "button") return;
        }

        resetSessionTimer();
      },
      true,
    );
  }

  function trackProgrammaticNavigationButtons() {
    document.addEventListener(
      "click",
      (event) => {
        if (timeLeft <= 0) return;
        if (!(event.target instanceof Element)) return;

        const control = event.target.closest(
          "button, input[type='submit'], input[type='button'], [role='button'], [data-command], [data-action]",
        );
        if (!control) return;

        const form = control.closest("form");
        if (form) return;

        resetSessionTimer();
      },
      true,
    );
  }

  function isVisibleElement(element) {
    if (!(element instanceof Element)) return false;
    const style = globalThis.getComputedStyle(element);
    if (!style) return false;
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      element.getClientRects().length > 0
    );
  }

  function trackPopupOpen() {
    const popupSelectors =
      ".ui-dialog, .ui-widget-overlay, .modal, .dialog, [role='dialog'], [aria-modal='true'], .popover, .tooltip, .popup";

    const observer = new MutationObserver((mutations) => {
      if (timeLeft <= 0) return;

      let opened = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          const matchesPopup =
            node.matches?.(popupSelectors) || node.querySelector?.(popupSelectors);
          if (matchesPopup && isVisibleElement(node)) {
            opened = true;
            break;
          }
        }
        if (opened) break;
      }

      if (opened) resetSessionTimer();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"],
    });
  }

  const storageArea = globalThis.chrome && chrome.storage && chrome.storage.local;
  const loadSettings = (callback) => {
    if (storageArea && typeof storageArea.get === "function") {
      storageArea.get({ showStatus: true, ...monitorSettings }, callback);
      return;
    }
    callback({ showStatus: true, ...monitorSettings });
  };

  loadSettings((s) => {
    monitorSettings = { ...monitorSettings, ...s };
    if (s.showStatus) {
      createStatusIndicator();
      startTimer();
      trackSuccessfulRequest();
      trackFormSubmissions();
      trackProgrammaticNavigationButtons();
      trackPopupOpen();
    }

    const boot = () => {
      createStatusIndicator();
      if (indicator) applyMonitorStyle(indicator, monitorSettings);
      processElements();
    };

    boot();
    setupEventListeners();

    window.addEventListener("pageshow", boot);
    window.addEventListener("popstate", boot);
  });
})();
