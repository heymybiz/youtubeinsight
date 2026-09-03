(function () {
  var pathName = location.pathname;
  var last = pathName.split("/").pop();
  if (last && last.indexOf(".") === -1 && pathName.slice(-1) !== "/") {
    location.replace(pathName + "/" + location.search + location.hash);
    return;
  }

  const root = document.documentElement;
  const cfg = window.RADAR_CONFIG || {};
  if (cfg.ADSENSE_CLIENT) {
    const s = document.createElement("script");
    s.async = true;
    s.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(cfg.ADSENSE_CLIENT);
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }

  function $(id) {
    return document.getElementById(id);
  }

  function formatNum(n) {
    const x = Number(n) || 0;
    if (x >= 1000000) return (x / 1000000).toFixed(1) + "M";
    if (x >= 1000) return (x / 1000).toFixed(1) + "K";
    return String(Math.round(x));
  }

  function fmtDelta(n) {
    if (n === null || n === undefined) return "";
    const v = Math.round(n);
    if (v > 0) return "+" + formatNum(v);
    return String(v);
  }

  function nextRefreshHint(fetchedAt) {
    if (!fetchedAt) return "다음 갱신 시각을 알 수 없습니다.";
    const t = new Date(fetchedAt).getTime() + 6 * 60 * 60 * 1000;
    return "다음 갱신 예정: " + new Date(t).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  }

  function factsHtml(videos) {
    const top = [...videos].sort((a, b) => b.vph - a.vph).slice(0, 3);
    if (!top.length) return "";
    const lines = top.map(function (v, i) {
      return (
        (i + 1) +
        "위 " +
        v.title +
        " (" +
        formatNum(v.vph) +
        "/h)"
      );
    });
    return (
      "이번 갱신에서 VPH 1위는 " +
      top[0].title +
      " (" +
      formatNum(top[0].vph) +
      "/h) 입니다. " +
      "상위 3: " +
      lines.join("; ") +
      "."
    );
  }

  function cardHtml(v) {
    const delta =
      v.deltaVph === null || v.deltaVph === undefined
        ? ""
        : '<span>ΔVPH ' + fmtDelta(v.deltaVph) + "</span>";
    const short = v.isShort ? '<span class="badge">쇼츠</span>' : "";
    return (
      '<article class="card">' +
      '<img src="' +
      escapeAttr(v.thumbnail) +
      '" alt="">' +
      "<div>" +
      "<h2>" +
      escapeHtml(v.title) +
      "</h2>" +
      '<div class="meta">' +
      escapeHtml(v.channelTitle) +
      "</div>" +
      '<div class="stats">' +
      "<span>조회 " +
      formatNum(v.viewCount) +
      "</span>" +
      "<span>기여도 " +
      formatNum(v.viralScore) +
      "%</span>" +
      "<span>VPH " +
      formatNum(v.vph) +
      "/h</span>" +
      delta +
      short +
      "</div>" +
      '<div class="actions">' +
      '<a href="' +
      escapeAttr(v.url) +
      '" target="_blank" rel="noopener" data-ad-trigger="open">영상 열기</a>' +
      '<button type="button" data-ad-trigger="copy" data-title="' +
      escapeAttr(v.title) +
      '">제목 복사</button>' +
      "</div>" +
      "</div></article>"
    );
  }

  function escapeHtml(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(t) {
    return escapeHtml(t);
  }

  const state = {
    payload: null,
    sort: "vph",
    keyword: null,
    filter: document.body.getAttribute("data-filter") || "all",
  };

  function visibleVideos() {
    let list = (state.payload && state.payload.videos) || [];
    if (state.filter === "shorts") list = list.filter(function (v) { return v.isShort; });
    if (state.filter === "delta") {
      list = list.filter(function (v) {
        return v.deltaVph !== null && v.deltaVph !== undefined;
      });
    }
    if (state.keyword) {
      const k = state.keyword.toLowerCase();
      list = list.filter(function (v) {
        const tags = (v.tags || []).join(" ").toLowerCase();
        return (
          String(v.title).toLowerCase().indexOf(k) !== -1 ||
          tags.indexOf(k) !== -1
        );
      });
    }
    const key = state.sort;
    return list.slice().sort(function (a, b) {
      return (b[key] || 0) - (a[key] || 0);
    });
  }

  function render() {
    const listEl = $("video-list");
    const factsEl = $("facts");
    const kwEl = $("keyword-list");
    if (!state.payload) return;
    if (factsEl) factsEl.textContent = factsHtml(state.payload.videos || []);
    if (kwEl && state.payload.keywords) {
      kwEl.innerHTML = state.payload.keywords
        .map(function (k) {
          const pressed = state.keyword === k.term ? "true" : "false";
          return (
            '<button type="button" data-term="' +
            escapeAttr(k.term) +
            '" aria-pressed="' +
            pressed +
            '">' +
            escapeHtml(k.term) +
            " · " +
            k.count +
            "</button>"
          );
        })
        .join("");
    }
    const rows = visibleVideos();
    listEl.innerHTML = rows.map(cardHtml).join("");
    if ($("ad-slot-action") && !$("ad-slot-action").parentElement) {
      /* keep slot in page, not per card */
    }
  }

  function bind() {
    document.querySelectorAll("[data-sort]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.sort = btn.getAttribute("data-sort");
        document.querySelectorAll("[data-sort]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        render();
      });
    });
    const kwEl = $("keyword-list");
    if (kwEl) {
      kwEl.addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-term]");
        if (!btn) return;
        const term = btn.getAttribute("data-term");
        state.keyword = state.keyword === term ? null : term;
        render();
      });
    }
    document.addEventListener("click", function (e) {
      const copyBtn = e.target.closest("button[data-ad-trigger='copy']");
      if (!copyBtn) return;
      const title = copyBtn.getAttribute("data-title") || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(title);
      }
    });
  }

  async function loadPayload() {
    const src = document.body.getAttribute("data-src");
    const embedName = document.body.getAttribute("data-embed");
    try {
      const res = await fetch(src, { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch (err) {
      /* file:// or Pages 404 — fall through to embed */
    }
    if (embedName && window[embedName]) return window[embedName];
    throw new Error("no data");
  }

  async function boot() {
    const status = $("status");
    bind();
    try {
      state.payload = await loadPayload();
      if (status) {
        status.textContent =
          "갱신 " +
          (state.payload.fetchedAt || "") +
          " · " +
          nextRefreshHint(state.payload.fetchedAt);
      }
      render();
    } catch (err) {
      if (status) {
        status.className = "error";
        status.textContent = nextRefreshHint(null) + " (데이터를 불러오지 못했습니다)";
      }
    }
  }

  boot();
})();
