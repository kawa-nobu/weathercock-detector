$ErrorActionPreference = "Stop"

# content.js と hide.css から Tampermonkey 用の userscript を生成する
$TargetDir = $PSScriptRoot
$OutputDir = Join-Path $TargetDir "package"
$OutputFile = Join-Path $OutputDir "weathercock-detector.user.js"

New-Item -ItemType Directory -Force $OutputDir | Out-Null

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# バージョン番号を manifest から取得
$Manifest = [System.IO.File]::ReadAllText((Join-Path $TargetDir "manifest.json"), $Utf8NoBom)
if ($Manifest -notmatch '"version"\s*:\s*"([^"]+)"') {
    Write-Error "manifest.json からバージョン番号を取得できませんでした"
}
$Version = $Matches[1]
Write-Host "version: $Version"

$HideCss = [System.IO.File]::ReadAllText((Join-Path $TargetDir "hide.css"), $Utf8NoBom)
$ContentJs = [System.IO.File]::ReadAllText((Join-Path $TargetDir "content.js"), $Utf8NoBom)

# テンプレートリテラルに埋め込むため、hide.css にバッククォートや ${ が含まれていないか確認する
if ($HideCss -match '`|\$\{') {
    Write-Error 'hide.css にバッククォートまたは ${ が含まれているため埋め込めません'
}

# 改行コードを LF に揃える
function ConvertTo-Lf([string]$Text) {
    return ($Text -replace "`r`n", "`n")
}

$Header = ConvertTo-Lf @'
// ==UserScript==
// @name         weathercock-detector
// @namespace    https://github.com/kawa-nobu/weathercock-detector
// @version      __VERSION__
// @description  Google検索結果に表示されている詐欺サイトを非表示する
// @match        *://www.google.com/*
// @match        *://www.google.co.jp/*
// @connect      gstatic.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

// このファイルは build_userscript.sh で content.js と hide.css から自動生成しています。直接編集しないでください。

(() => {
  //検索結果を一時的に非表示にするスタイルを追加
  GM_addStyle(`
'@
$Header = $Header.Replace("__VERSION__", $Version) + "`n"

$Middle = ConvertTo-Lf @'
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
'@
$Middle += "`n"

$Footer = ConvertTo-Lf @'
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
'@
$Footer += "`n"

[System.IO.File]::WriteAllText($OutputFile, $Header + $HideCss + $Middle + $ContentJs + $Footer, $Utf8NoBom)

Write-Host "userscriptを生成しました: $OutputFile"
