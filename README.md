# weathercock-detector
Google検索から例の「コメリ」アイコンの詐欺サイトを画面上から消し去る拡張機能。  
(自分用に作成した)  
faviconのハッシュで検出するだけなので、faviconに細工されたら精度的に弱くなりそう...

## インストール手順
### 各種WebStore経由インストール
#### Chromium系 (Chrome/Edge/Brave)
以下リンクからChrome WebStoreにアクセスし、「追加ボタン」をクリックして導入する
- https://chromewebstore.google.com/detail/weathercock-detector/pcaaojfdfnokaadmbikniabfppidbdgb

#### Firefox系
以下リンクから　addons.mozilla.org　にアクセスし、「Firefox へ追加」をクリックして導入する
- https://addons.mozilla.org/ja/firefox/addon/weathercock-detector/

### 開発者向け インストール
1. このリポジトリをダウンロードまたは clone する
2. Chrome で `chrome://extensions/` を開く
3. 右上の「デベロッパーモード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック、またはダウンロードしたフォルダを画面にドラッグ&ドロップする
5. 拡張機能が一覧に表示されればインストール完了
6. すでに Google の検索結果を開いているタブがある場合は、再読み込みして拡張機能を反映させる
