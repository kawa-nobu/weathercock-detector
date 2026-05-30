(async () => {
  //詐欺サイトが使用するコメリfaviconのSHA-256ハッシュ
  const HASH_RULES = {
    "c2080ff1963e45caf6907e61d48c80e64e9c66eae89828279c7dacc083391cb0":
      "komeri-favicon",
  };

  //コメリ公式ドメインの除外パターン
  const EXCLUSION_URLS =
    /www\.komeri\.com|toyu\.komeri\.com|www\.komeri\.bit\.or\.jp/;

  //検索結果の各faviconを取得
  const TARGET_ELEM = document.querySelectorAll(
    "#center_col a[jsname][data-ved] img[data-csiid]",
  );

  //ハッシュ作成関数
  async function createHash(dataUrl) {
    //dataURLからBase64を抽出
    const base64 = dataUrl.split(",")[1] || dataUrl;

    //base64をバイト列に直す
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    //SHA-256でハッシュ化してArrayBufferにする
    const buf = await crypto.subtle.digest("SHA-256", bytes);

    //ハッシュ文字列の変換する
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  //faviconのdataURLから検出し、対象かどうか検出する関数
  async function detect(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith("data:")) return null;
    const hash = await createHash(dataUrl);
    if (HASH_RULES[hash]) return HASH_RULES[hash];
    return null;
  }

  //各検索結果を検証する
  await Promise.all(
    [...TARGET_ELEM].map(async (elem) => {
      //検索結果からURLを抽出する
      const target_link = elem.closest("a[jsname][data-ved]");
      if (!target_link) return;

      const target_host = new URL(target_link.href).host;

      //公式ドメインはスキップする
      if (EXCLUSION_URLS.test(target_host)) return;

      //公式以外のドメインでfaviconが一致しているかどうか検証する
      const detect_result = await detect(elem.src);
      if (!detect_result) return;

      //faviconが一致した場合は検索結果から非表示にする
      const target_elem = target_link.closest(
        "div[jscontroller][data-hveid][data-ved]",
      );
      if (target_elem) {
        target_elem.style = "display:none;";
      }
    }),
  );
})();
