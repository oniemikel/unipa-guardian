(function () {
  if (window.top !== window) {
    return;
  }

  const OWNER = "oniemikel";
  const REPO = "unipa-guardian";
  const UPDATE_URL = `https://${OWNER}.github.io/${REPO}/update.json`;
  const IGNORE_KEY = "update_ignore_until";
  const HOST_ID = "unipa-guardian-update-banner-host";
  const Z_INDEX = "2147483647";
  const EXTENSION_NAME = "UNIPA Guardian";

  const BANNER_CSS = `
    :host {
      position: fixed;
      inset: 0 0 auto 0;
      display: block;
      z-index: ${Z_INDEX};
      pointer-events: none;
      all: initial;
    }

    .banner {
      pointer-events: auto;
      box-sizing: border-box;
      width: 100%;
      padding: 12px 16px;
      color: #f8fafc;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
      border-bottom: 1px solid rgba(148, 163, 184, 0.28);
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.32);
      backdrop-filter: blur(12px);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .badge {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 6px 18px rgba(34, 197, 94, 0.28);
    }

    .content {
      min-width: 0;
      flex: 1 1 auto;
      display: grid;
      gap: 4px;
    }

    .title {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.4;
      letter-spacing: 0.01em;
    }

    .message {
      font-size: 13px;
      line-height: 1.5;
      color: #e2e8f0;
      word-break: break-word;
    }

    .actions {
      flex: 0 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .button {
      appearance: none;
      border: 0;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease;
      white-space: nowrap;
    }

    .button:hover {
      transform: translateY(-1px);
    }

    .button:active {
      transform: translateY(0);
      opacity: 0.92;
    }

    .button--primary {
      background: linear-gradient(135deg, #f59e0b, #fb7185);
      color: #ffffff;
    }

    .button--secondary {
      background: rgba(148, 163, 184, 0.16);
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.24);
    }

    .button--ghost {
      background: transparent;
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.24);
    }

    @media (max-width: 720px) {
      .inner {
        align-items: flex-start;
        flex-direction: column;
      }

      .actions {
        width: 100%;
      }

      .button {
        flex: 1 1 0;
      }
    }
  `;

  const waitForStorageGet = (keys) =>
    new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });

  const waitForStorageSet = (items) =>
    new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

  const todayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const closeBanner = (host) => {
    if (host && host.isConnected) {
      host.remove();
    }
  };

  const createButton = (label, className, onClick) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `button ${className}`;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  };

  const mountBanner = async (remote) => {
    if (document.getElementById(HOST_ID)) {
      return;
    }

    const host = document.createElement("div");
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = BANNER_CSS;

    const banner = document.createElement("div");
    banner.className = "banner";

    const inner = document.createElement("div");
    inner.className = "inner";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = "!";

    const content = document.createElement("div");
    content.className = "content";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = `${EXTENSION_NAME} の新しいバージョン v${remote.version} が公開されています`;

    const message = document.createElement("div");
    message.className = "message";
    message.textContent = remote.message || `${EXTENSION_NAME} の更新版が利用できます。`;

    const actions = document.createElement("div");
    actions.className = "actions";

    const openButton = createButton("今すぐ更新", "button--primary", () => {
      window.open(remote.release_url, "_blank", "noopener,noreferrer");
    });

    const laterButton = createButton("後で", "button--secondary", () => {
      closeBanner(host);
    });

    const ignoreButton = createButton("今日は表示しない", "button--ghost", async () => {
      try {
        await waitForStorageSet({ [IGNORE_KEY]: todayString() });
      } catch (_error) {
        // 保存に失敗しても静かに閉じる
      }
      closeBanner(host);
    });

    actions.append(openButton, laterButton, ignoreButton);
    content.append(title, message);
    inner.append(badge, content, actions);
    banner.append(inner);
    shadow.append(style, banner);

    const mountTarget = document.body || document.documentElement;
    mountTarget.prepend(host);
  };

  const shouldDisplay = async (remote) => {
    const manifestVersion = chrome.runtime.getManifest().version;
    if (remote.version === manifestVersion) {
      return false;
    }

    const result = await waitForStorageGet([IGNORE_KEY]);
    return result[IGNORE_KEY] !== todayString();
  };

  const main = async () => {
    try {
      const response = await fetch(UPDATE_URL, { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const remote = await response.json();
      if (!remote || typeof remote !== "object") {
        return;
      }

      if (
        typeof remote.version !== "string" ||
        typeof remote.release_url !== "string" ||
        typeof remote.message !== "string"
      ) {
        return;
      }

      if (!(await shouldDisplay(remote))) {
        return;
      }

      await mountBanner(remote);
    } catch (_error) {
      // fetch / storage / parsing の失敗は何も表示せず終了する
    }
  };

  void main();
})();