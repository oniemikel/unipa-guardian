# UNIPA Guardian

日本語版は[こちら](#jp)

## English

### Overview
UNIPA Guardian is a browser extension for the UNIPA portal at `https://unipa.u-hyogo.ac.jp/`. It helps protect form input by keeping local backups of text and file entries in browser storage so you can restore them if a page refreshes, navigates unexpectedly, or loses state as much as possible.

### Features
- Automatically saves textarea drafts locally in your browser.
- Shows a restore button when a saved draft is available.
- Stores uploaded files locally and lets you restore or download them later.
- Optionally displays a session monitor in the corner of the page.
- Works only on the UNIPA domain.

### Installation (Advanced)
1. Download the zip file from the GitHub Releases page, or download the source code zip from the Code button and extract it to any folder.
2. Open Chrome or another Chromium-based browser.
3. Open the extensions management page.
4. Enable Developer mode.
5. Click Load unpacked.
6. Select the extracted project folder.

> Note
> If you delete or move the extracted folder, the extension may stop working correctly. If needed, load the extension again or reinstall it.

### Usage
After installation, open UNIPA and use the site as usual. When you enter text or choose a file, the extension keeps a local backup in browser storage. If a restore button appears, you can use it to recover the saved content.

### Settings
Open the extension popup or the options page to toggle the session monitor display.

### Permissions
- `storage`: used to save extension settings locally.
- Access to `https://unipa.u-hyogo.ac.jp/*`: used to inject the content script on the UNIPA portal.

### Notes
- Saved data stays in your browser and is not sent to an external server.
- This project is intended for use on the UNIPA portal only.

<div name="jp" style="display:none"></div>

## 日本語

### 概要
UNIPA Guardian は、`https://unipa.u-hyogo.ac.jp/` 向けのブラウザ拡張機能です。入力した文字列やファイルをローカルに保存しておき、ページ更新や予期しない遷移で内容が失われたときに可能な限り復元します。

### 主な機能
- テキストエリアの入力内容をブラウザ内に自動保存します。
- 保存済みの下書きがある場合は復元ボタンを表示します。
- アップロードしたファイルをローカルに保存し、あとから復元・ダウンロードできます。
- 画面の隅にセッションモニターを任意で表示できます。
- UNIPA ドメイン上でのみ動作します。

### インストール方法（上級者向け）
1. Github 内の **Code** ボタンからzipをダウンロードし、任意のフォルダに展開する  
   もしくは、Github 内の Release ページからファイルをダウンロード、もしくは以下のリンクからダウンロードする
   [リンクはこちら](https://github.com/oniemikel/unipa-guardian/releases)
   （`Source Code (zip)`をクリックするとzipファイルがダウンロードされる）
2. Chrome などの Chromium 系ブラウザを開く
3. 拡張機能の管理画面を開く
4. デベロッパーモードを有効にする
5. 「パッケージ化されていない拡張機能を読み込む」をクリックする
6. 展開したプロジェクトのフォルダを選択する
> 注意
  展開したフォルダを削除したり移動したりすると、拡張機能が正常に動作しなくなる可能性があります。必要に応じて、拡張機能を再度読み込むか、インストールし直してください。


### 使い方
インストール後に UNIPA を開いて通常どおり利用してください。テキスト入力やファイル選択を行うと、拡張機能がローカルのブラウザストレージにバックアップを保持します。復元ボタンが表示された場合は、バックアップされた保存済みの内容を戻せます。

### 設定
拡張機能のポップアップ、またはオプション画面から、セッションモニターの表示・非表示を切り替えられます。

### 権限
- `storage`: 拡張機能の設定をローカルに保存するために使用する
- `https://unipa.u-hyogo.ac.jp/*` へのアクセス: UNIPA 画面にコンテンツスクリプトを注入するために使用する

### 補足
- 保存データはブラウザ内に保持され、外部サーバーには送信されません。
- このプロジェクトは UNIPA ポータル専用です。
