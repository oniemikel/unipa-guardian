/**
 * UNIPA Guardian - Service Worker
 * アイコンクリック時に設定画面を直接開く
 */
chrome.action.onClicked.addListener((tab) => {
  // 拡張機能のオプションページを新しいタブ、またはダイアログ形式で開く
  chrome.runtime.openOptionsPage();
});
