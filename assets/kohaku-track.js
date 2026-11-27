/* こはくラボ ツール集：Umami イベント送信ヘルパー
 * 使い方（ゲームページ）：
 *   <script defer src="https://cloud.umami.is/script.js" data-website-id="82fb71aa-b25e-463a-a982-ad14ba26fe72" data-domains="kohaku-ai-lab.github.io"></script>
 *   <script src="../assets/kohaku-track.js"></script>   ← 置き場所は既存構成に合わせる
 *   開始時：  kohakuTrack.start('10sec')
 *   再挑戦時：kohakuTrack.retry('10sec')
 *   シェア時：kohakuTrack.share('10sec')   （任意）
 * 個人情報・自由入力・スコアは送らない。プロパティは game / src / n のみ。
 */
(function () {
  var KNOWN = { yt: 1, x: 1, threads: 1, test: 1 };
  var MAX_RETRY = 10; // 1セッションあたり game_retry の送信上限

  function store() { try { return window.sessionStorage; } catch (e) { return null; } }

  function detectSrc() {
    var s = store();
    var cached = s && s.getItem('kohaku_src');
    if (cached) return cached;
    var src = 'direct';
    try {
      var u = new URLSearchParams(location.search).get('utm_source');
      if (u) {
        u = u.toLowerCase();
        src = KNOWN[u] ? u : 'other';
      } else if (document.referrer) {
        var h = new URL(document.referrer).hostname;
        if (h === location.hostname) src = 'internal';
        else if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(h)) src = 'yt';
        else if (/(^|\.)x\.com$|(^|\.)twitter\.com$|(^|\.)t\.co$/.test(h)) src = 'x';
        else if (/(^|\.)threads\.(net|com)$/.test(h)) src = 'threads';
        else src = 'other';
      }
    } catch (e) {}
    if (s) s.setItem('kohaku_src', src);
    return src;
  }

  function send(name, data, tries) {
    tries = tries || 0;
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(name, data);
    } else if (tries < 20) {
      setTimeout(function () { send(name, data, tries + 1); }, 250); // script.js は defer なので読み込み待ち
    }
  }

  var src = detectSrc();

  window.kohakuTrack = {
    src: src,
    start: function (game) { send('game_start', { game: game, src: src }); },
    retry: function (game) {
      var s = store(), key = 'kohaku_retry_' + game;
      var n = (s ? parseInt(s.getItem(key) || '0', 10) : 0) + 1;
      if (s) s.setItem(key, String(n));
      if (n <= MAX_RETRY) send('game_retry', { game: game, src: src, n: n });
    },
    share: function (game) { send('game_share', { game: game, src: src }); }
  };
})();
