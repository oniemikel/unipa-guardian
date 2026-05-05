(function () {
  const SAVE_KEY = "unipa_zombie_text";
  const FILE_STORE_KEY = "unipa_zombie_file";
  const PROTECTION_TIME = 3000;
  let isProtected = false;

  // --- 補助関数: 新・指紋作成ロジック ---
  function getElementFingerprint(el, type) {
    const path = window.location.pathname;

    // PrimeFacesのID（動的な部分を除去）からヒントを得る
    // 例: "funcForm:kdiTstAccordion:fileUploader_input" -> "fileUploader"
    const rawId = el.id || el.name || "";
    const idHint = rawId.split(":").slice(-2, -1)[0] || "fixed";

    // ページ内の全同種要素におけるインデックス（フォールバック用）
    const allElements = Array.from(document.querySelectorAll(type));
    let index = allElements.indexOf(el);

    // もし -1 なら、なんとかして見つける（親要素経由など）
    if (index === -1) {
      // changeイベント時、elが一時的にDOMから離れている場合があるための対策
      index = 0; // 単一の入力欄なら0で固定
    }

    return `${path}_${type}_${idHint}_${index}`;
  }

  function processElements() {
    // テキストエリア
    document.querySelectorAll("textarea").forEach((target) => {
      if (target.dataset.guardianProcessed) return;
      const fp = getElementFingerprint(target, "textarea");
      const backup = localStorage.getItem(`${SAVE_KEY}_${fp}`);

      if (backup && backup.trim() !== "") {
        createRestoreButton(target, backup);
        console.log(`%c[Guardian] Text Restored: ${fp}`, "color: #00ff00");
      }
      target.dataset.guardianProcessed = "true";
    });

    // ファイル入力
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      if (input.dataset.guardianProcessed) return;
      const fp = getElementFingerprint(input, 'input[type="file"]');
      const fileDataRaw = localStorage.getItem(`${FILE_STORE_KEY}_${fp}`);

      // デバッグログ
      console.log(
        `[Guardian Debug] Check File FP: ${fp} | Found: ${!!fileDataRaw}`,
      );

      if (fileDataRaw) {
        const primeContainer =
          input.closest(".ui-fileupload") || input.parentNode;
        createFileRescuePanel(primeContainer, JSON.parse(fileDataRaw));
        console.log(`%c[Guardian] File Rescue Ready: ${fp}`, "color: #00ff00");
      }
      input.dataset.guardianProcessed = "true";
    });
  }

  function createRestoreButton(target, backup) {
    const btn = document.createElement("button");
    btn.innerText = "🔄 文章を復元";
    Object.assign(btn.style, {
      display: "block",
      margin: "10px 0",
      padding: "6px 12px",
      background: "#f0ad4e",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "bold",
      zIndex: "9999",
    });
    btn.onclick = (e) => {
      e.preventDefault();
      isProtected = true;
      target.value = backup;
      btn.innerText = "✅ 復元完了";
      setTimeout(() => {
        isProtected = false;
        btn.innerText = "🔄 文章を復元";
      }, PROTECTION_TIME);
    };
    target.parentNode.insertBefore(btn, target);
  }

  function createFileRescuePanel(insertTarget, fileData) {
    const container = document.createElement("div");
    Object.assign(container.style, {
      margin: "10px 0",
      padding: "12px",
      background: "#fff3cd",
      border: "2px solid #ffeeba",
      borderRadius: "6px",
      fontSize: "12px",
      color: "#856404",
    });
    container.innerHTML = `
          <div style="font-weight:bold; margin-bottom:5px;">🚨 救出したファイル: ${fileData.name}</div>
          <button class="g-dl-btn" style="background:#d9534f; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold; width:100%;">
              📥 ダウンロードして再添付
          </button>
      `;
    container.querySelector(".g-dl-btn").onclick = (e) => {
      e.preventDefault();
      const link = document.createElement("a");
      link.href = fileData.data;
      link.download = fileData.name;
      link.click();
    };
    insertTarget.appendChild(container);
  }

  function setupObserverAndEvents() {
    const observer = new MutationObserver(() => processElements());
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("change", (e) => {
      const el = e.target;
      if (el.tagName === "INPUT" && el.type === "file" && el.files.length > 0) {
        // 保存時のFP作成（-1を回避するため一時的にクラスを付与して順番を確定させる）
        const fp = getElementFingerprint(el, 'input[type="file"]');
        const file = el.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const fileInfo = { name: file.name, data: reader.result };
          localStorage.setItem(
            `${FILE_STORE_KEY}_${fp}`,
            JSON.stringify(fileInfo),
          );
          console.log(`[Guardian Save] File FP: ${fp}`);
        };
        reader.readAsDataURL(file);
      }
    });

    document.addEventListener("input", (e) => {
      if (isProtected) return;
      const el = e.target;
      if (el.tagName === "TEXTAREA") {
        const fp = getElementFingerprint(el, "textarea");
        localStorage.setItem(`${SAVE_KEY}_${fp}`, el.value);
      }
    });
  }

  processElements();
  setupObserverAndEvents();
})();
