#!/bin/bash
set -euo pipefail

# content.js と hide.css から Tampermonkey 用の userscript を生成する
TARGET_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$TARGET_DIR/package"
OUTPUT_FILE="$OUTPUT_DIR/weathercock-detector.user.js"

mkdir -p "$OUTPUT_DIR"

# バージョン番号を manifest から取得
VERSION="$(grep -oE '"version"\s*:\s*"[^"]+"' "$TARGET_DIR/manifest.json" | sed -E 's/.*"([^"]+)"/\1/')"
echo "version: $VERSION"

# テンプレートリテラルに埋め込むため、hide.css にバッククォートや ${ が含まれていないか確認する
if grep -qE '`|\$\{' "$TARGET_DIR/hide.css"; then
    echo "hide.css にバッククォートまたは \${ が含まれているため埋め込めません" >&2
    exit 1
fi

{
cat <<EOF
// ==UserScript==
// @name         weathercock-detector
// @namespace    https://github.com/kawa-nobu/weathercock-detector
// @version      ${VERSION}
// @description  Google検索結果に表示されている詐欺サイトを非表示する
// @match        *://www.google.com/*
// @match        *://www.google.co.jp/*
// @connect      gstatic.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

// このファイルは build_userscript.sh によって content.js と hide.css を用いて自動的に移植されました。

(() => {
  //検索結果を一時的に非表示にするスタイルを追加
  GM_addStyle(\`
EOF
cat "$TARGET_DIR/hide.css"
cat <<'EOF'
`);

  //dataURLでないfaviconを取得してbase64で返す
  const chrome = {
    runtime: {
      sendMessage: ({ url }, sendResponse) => {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          responseType: "arraybuffer",
          onload: (res) => {
            if (res.status !== 200) return sendResponse(null);
            sendResponse(btoa(String.fromCharCode(...new Uint8Array(res.response))));
          },
          onerror: () => sendResponse(null),
          ontimeout: () => sendResponse(null),
        });
      },
    },
  };

  //DOMの読み込みが完了してから検索結果を検証する
  const run = () => {
EOF
cat "$TARGET_DIR/content.js"
cat <<'EOF'
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
EOF
} > "$OUTPUT_FILE"

echo "userscriptを生成しました: $OUTPUT_FILE"
