(function () {
  // --- 定数・ロジックは維持 ---
  const SAVE_KEY = "unipa_zombie_text";
  const FILE_STORE_KEY = "unipa_zombie_file";
  const PROTECTION_TIME = 3000;
  const SESSION_LIMIT = 15 * 60;
  let timeLeft = SESSION_LIMIT;
  let isProtected = false;
  let indicator = null;

  // --- 【新機能】CSSの注入 ---
  const style = document.createElement("style");
  style.textContent = `
      .unipa-rescue-panel {
          margin: 20px 0 !important;
          padding: 18px !important;
          background: rgba(255, 255, 255, 0.95) !important;
          border-left: 5px solid #28a745 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
          font-family: 'Helvetica Neue', Arial, sans-serif !important;
          backdrop-filter: blur(5px);
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
      
      .g-file-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding: 12px 15px;
          background: #ffffff;
          border: 1px solid #edf2f7;
          border-radius: 8px;
          transition: all 0.2s ease;
      }
      .g-file-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #28a745;
      }
      .file-info {
          display: flex;
          flex-direction: column;
          max-width: 60%;
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
      }
      
      .btn-group { display: flex; gap: 8px; }
      
      .g-inject-btn, .g-dl-btn {
          padding: 8px 14px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
      }
      .g-inject-btn {
          background: #28a745;
          color: white;
      }
      .g-inject-btn:hover { background: #218838; transform: scale(1.05); }
      .g-inject-btn:active { transform: scale(0.95); }
      
      .g-dl-btn {
          background: #f7fafc;
          color: #718096;
          border: 1px solid #e2e8f0;
      }
      .g-dl-btn:hover { background: #edf2f7; color: #2d3748; }

        .g-del-btn {
          padding: 8px 14px;
          border: 1px solid #fed7d7;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          background: #fff5f5;
          color: #c53030;
        }
        .g-del-btn:hover { background: #fed7d7; color: #9b2c2c; }

      /* インジケーターのデザイン */
      #zombie-indicator {
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s ease;
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
    feedback.innerText = `✅ ${fileData.name} を復旧しました`;
    Object.assign(feedback.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#28a745",
      color: "white",
      padding: "12px 24px",
      borderRadius: "50px",
      zIndex: "10000",
      fontWeight: "bold",
      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    });
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
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

    container.querySelectorAll(".g-inject-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        injectFileToInput(inputEl, fileList[btn.dataset.idx]);
      };
    });

    container.querySelectorAll(".g-dl-btn").forEach((btn) => {
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
        btn.innerText = "🔄 文章を復元";
        Object.assign(btn.style, {
          display: "block",
          margin: "10px 0",
          padding: "8px 16px",
          background: "#f0ad4e",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "bold",
          transition: "0.2s",
        });
        btn.onmouseover = () => (btn.style.background = "#ec971f");
        btn.onmouseout = () => (btn.style.background = "#f0ad4e");
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
    const observer = new MutationObserver(() => processElements());
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
    if (indicator) return;
    indicator = document.createElement("div");
    indicator.id = "zombie-indicator";
    Object.assign(indicator.style, {
      position: "fixed",
      bottom: "15px",
      right: "15px",
      zIndex: "2147483647",
      padding: "12px 16px",
      background: "rgba(26, 32, 44, 0.9)",
      color: "#4FD1C5",
      fontSize: "12px",
      fontFamily: "'Courier New', monospace",
      borderRadius: "10px",
      border: "1px solid #2D3748",
      pointerEvents: "none",
      lineBreak: "anywhere",
    });
    (document.body || document.documentElement).appendChild(indicator);
  }

  function startTimer() {
    setInterval(() => {
      timeLeft--;
      if (timeLeft < 0) timeLeft = 0;
      const min = Math.floor(timeLeft / 60),
        sec = timeLeft % 60;
      if (indicator)
        indicator.innerHTML = `<span style="color:#A0AEC0;font-size:10px;">SYSTEM MONITOR</span><br><span style="font-size:14px;font-weight:bold;">⏳ ${min}:${sec.toString().padStart(2, "0")}</span>`;
    }, 1000);
    ["mousedown", "keydown", "input"].forEach((evt) =>
      document.addEventListener(evt, () => (timeLeft = SESSION_LIMIT)),
    );
  }

  const storageArea = globalThis.chrome && chrome.storage && chrome.storage.local;
  const loadSettings = (callback) => {
    if (storageArea && typeof storageArea.get === "function") {
      storageArea.get({ showStatus: true }, callback);
      return;
    }
    callback({ showStatus: true });
  };

  loadSettings((s) => {
    if (s.showStatus) {
      createStatusIndicator();
      startTimer();
    }
    processElements();
    setupEventListeners();
  });
})();
