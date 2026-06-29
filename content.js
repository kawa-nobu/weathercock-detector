(async () => {
  //詐欺サイトが使用するコメリfaviconのSHA-256ハッシュ
  const HASH_RULES = {
    c2080ff1963e45caf6907e61d48c80e64e9c66eae89828279c7dacc083391cb0:
      "komeri-favicon",
    e72c52e5d1366d96b335496f005631cfff5efe6080d82e55c2ffc7ec0c93fd76:
      "komeri-favicon-small",
    a633dc291107032eaa5ddb02e2b970f2513997cf37a164334251d5601ceaf8a3:
      "ajinomoto-favicon",
    c9955a1a04c5a2a725a46a92e442647b177beed5e2a61f3b6859a9d7a849e57d:
      "rakuma-favicon-small",
    "380538c0ebfabe6586c0314d754f1541eedebc247f56a6577d01a38259e5d357":
      "rakuma-favicon",
    "3cf589e14b7ccac2b844e572b5fbcb43b4ae1ffc4ecc4872de7136e818a2ca28":
      "rakuten-blue-favicon",
    a0a95953233a2d2c0c8003f66af1ee1f892518babed6212fdab6a0811acecdbc:
      "askul-favicon",
    a843a3a3d1563154dc0fb9a19a07cf4804bc76649eba9196d794c825db4ea4c2:
      "askul-favicon-large",
  };

  //コメリ公式ドメインの除外パターン
  const EXCLUSION_URLS =
    /www\.komeri\.com|toyu\.komeri\.com|www\.komeri\.bit\.or\.jp|fril\.jp|rakuten\.co\.jp|www\.askul\.co\.jp|solution\.soloel\.com|ajinomoto\.co\.jp|www\.ajioligos\.com|rakuten\.com|rakuten-card\.co\.jp|rakuten-bank\.co\.jp|rakuten-sec\.co\.jp|rakuten-life\.co\.jp/;

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

  //dataURLでないfaviconを取得してくる関数
  async function getRemoteHash(url) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ url }, async (base64) => {
        if (!base64) return resolve(null);
        resolve(await createHash(`data:image/png;base64,${base64}`));
      });
    });
  }

  async function processAll() {
    //検索結果の各faviconを取得
    const TARGET_ELEM = [
      ...document.querySelectorAll(
        '#search img[src^="data:image"]:not([processed]), #search img[src^="https://"]:not([processed])',
      ),
    ].filter((img) => img.naturalWidth <= 32);

    //各検索結果を検証する
    await Promise.all(
      [...TARGET_ELEM].map(async (elem) => {
        //対応済みのフラグを付与する
        elem.setAttribute("processed", "");
        //検索結果からURLを抽出する
        const target_link = elem.closest(
          'a[jsname][data-ved], a[target="_blank"]',
        );
        if (!target_link) return;

        const target_host = new URL(target_link.href).host;

        const target_elem = target_link.closest(
          "div[jscontroller][data-hveid][data-ved]",
        );

        if (!target_elem) return;

        //公式ドメインはスキップする
        if (EXCLUSION_URLS.test(target_host)) {
          target_elem.setAttribute("verified", "");
          return;
        }

        //公式以外のドメインでfaviconが一致しているかどうか検証する
        const detect_result = elem.src.startsWith("https://")
          ? (HASH_RULES[await getRemoteHash(elem.src)] ?? null)
          : await detect(elem.src);

        //検証して問題なければ戻す
        if (!detect_result) {
          target_elem.setAttribute("verified", "");
          return;
        }

        //faviconが一致した場合は検索結果から非表示にする
        target_elem.style = "display:none;";
      }),
    );
  }

  //各検索結果を検証する
  const observer = new MutationObserver(async (mutations) => {
    //変更されたものがあるかチェックする
    if (!mutations.some((m) => m.addedNodes.length > 0)) return;
    await processAll();
  });

  observer.observe(document.getElementById("search") ?? document.body, {
    childList: true,
    subtree: true,
  });

  await processAll();
})();
