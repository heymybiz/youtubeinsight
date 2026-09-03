/**
 * Golden Keyword Engine
 * -----------------------
 * A "황금키워드" here is not a scraped SEO dump. It is a search phrase that is:
 *   1. Demand: already showing up in currently exploding / ranking videos
 *   2. Specific: long-tail enough to type into YouTube search (not "유튜브", "영상")
 *   3. Actionable: clicking it fills the keyword box and runs Deep Search
 *
 * Source: titles + YouTube searchQuery (and tags when present) already in memory
 * from the category ranking cache and last search results.
 * No extra YouTube search.list calls.
 */
(function (global) {
  const STOP = new Set([
    "그리고", "그래서", "그냥", "진짜", "너무", "있는", "하는", "영상", "shorts", "short",
    "official", "the", "and", "for", "with", "this", "that", "from", "you", "your",
    "video", "youtube", "subscribe", "like", "vs", "ep", "tv", "news", "live", "full",
    "new", "best", "top", "how", "what", "why", "is", "it", "to", "of", "in", "on",
    "a", "an", "의", "을", "를", "이", "가", "은", "는", "에", "와", "과", "도", "로",
    "으로", "하다", "되다", "있다", "없다", "것", "수", "등", "및", "그", "저", "이런",
    "저런", "같은", "더", "잘", "좀", "왜", "뭐", "어떻게", "오늘", "어제", "내일",
    "다시", "한번", "보기", "모음", "하이라이트", "풀영상", "다시보기", "레전드",
    "feat", "ft", "vol", "part", "pt", "hd", "4k", "mv", "ost", "teaser",
  ]);

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[#\[\]()（）【】「」『』<>]/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !STOP.has(t) && !/^\d+$/.test(t) && t !== "shorts");
  }

  function ngrams(tokens, n) {
    const out = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      out.push(tokens.slice(i, i + n).join(" "));
    }
    return out;
  }

  function koreanChunks(text) {
    return (String(text || "").match(/[가-힣]{2,8}/g) || []).filter((w) => !STOP.has(w));
  }

  function phraseOk(p) {
    if (!p || p.length < 2 || p.length > 40) return false;
    if (/^\d+$/.test(p)) return false;
    if (STOP.has(p)) return false;
    return true;
  }

  function parseTags(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return String(raw)
      .split(/[,|]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  /**
   * @param {Array<{displayTitle?:string,title?:string,searchQuery?:string,viewCount?:number,viralScore?:number,tags?:string|string[]}>} videos
   * @returns {Array<{phrase:string,score:number,count:number,views:number}>}
   */
  function extract(videos, limit) {
    const stats = new Map();
    const bump = (phrase, weight, views) => {
      if (!phraseOk(phrase)) return;
      const key = phrase.replace(/\s+/g, " ").trim();
      if (!key) return;
      const cur = stats.get(key) || { phrase: key, score: 0, count: 0, views: 0 };
      cur.score += weight;
      cur.count += 1;
      cur.views += views;
      stats.set(key, cur);
    };

    (videos || []).forEach((v) => {
      const views = Number(v.viewCount) || 0;
      const weight =
        Math.max(0.85, Math.log10(1 + views)) *
        (1 + Math.min(Number(v.viralScore) || 0, 50) / 80);
      const title = v.displayTitle || v.title || "";
      const q = v.searchQuery || "";

      const harvest = (text, w) => {
        const tokens = tokenize(text);
        ngrams(tokens, 2).forEach((g) => bump(g, w * 1.4, views));
        ngrams(tokens, 3).forEach((g) => bump(g, w * 1.8, views));
        tokens.forEach((t) => {
          if (t.length >= 3) bump(t, w * 0.55, views);
        });
        koreanChunks(text).forEach((c) => {
          if (c.length >= 2 && c.length <= 6) bump(c, w * 0.7, views);
        });
      };

      harvest(title, weight);
      harvest(q, weight * 1.05);
      const qTokens = tokenize(q);
      if (q && qTokens.length >= 1 && qTokens.length <= 5) {
        bump(q.replace(/\s+/g, " ").trim(), weight * 2.2, views);
      }
      parseTags(v.tags).forEach((tag) => {
        if (tag.length >= 2 && tag.length <= 24) bump(tag, weight * 0.45, views);
      });
    });

    let list = Array.from(stats.values()).filter((s) => s.count >= 1 && s.phrase.split(" ").length <= 5);
    list.sort((a, b) => b.score - a.score);

    const kept = [];
    list.forEach((item) => {
      const subsumed = kept.some(
        (k) => k.phrase !== item.phrase && k.phrase.includes(item.phrase) && k.score >= item.score * 0.85
      );
      const duplicateLonger = kept.some(
        (k) => item.phrase.includes(k.phrase) && item.phrase !== k.phrase && item.score < k.score * 1.15
      );
      if (subsumed || duplicateLonger) return;
      kept.push(item);
    });

    return kept.slice(0, limit || 16);
  }

  function render(mount, videos, opts) {
    const el = typeof mount === "string" ? document.querySelector(mount) : mount;
    if (!el) return extract(videos, (opts && opts.limit) || 16);
    const keywords = extract(videos, (opts && opts.limit) || 16);
    const onPick = (opts && opts.onPick) || function () {};

    if (!keywords.length) {
      el.innerHTML =
        '<div class="golden-empty">카테고리 순위나 검색 결과가 쌓이면, 지금 뜨는 제목에서 검색용 황금키워드를 뽑습니다.</div>';
      return keywords;
    }

    el.innerHTML =
      '<div class="golden-chips">' +
      keywords
        .map((k, i) => {
          const hot = i < 3 ? " golden-chip-hot" : "";
          return (
            '<button type="button" class="golden-chip' +
            hot +
            '" data-phrase="' +
            String(k.phrase).replace(/"/g, "&quot;") +
            '" title="이 카테고리에서 ' +
            k.count +
            "개 영상에 등장 · 조회 " +
            Math.round(k.views).toLocaleString("ko-KR") +
            '">' +
            '<span class="golden-chip-text">' +
            k.phrase +
            "</span></button>"
          );
        })
        .join("") +
      "</div>";

    el.querySelectorAll(".golden-chip").forEach((btn) => {
      btn.addEventListener("click", () => onPick(btn.getAttribute("data-phrase")));
    });
    return keywords;
  }

  function collectVideosFromTrendState(TrendState, extraVideos) {
    const videos = [];
    const seen = new Set();
    const add = (v) => {
      if (!v) return;
      const key = v.id || v.displayTitle || v.title || v.searchQuery;
      if (!key || seen.has(key)) return;
      seen.add(key);
      videos.push(v);
    };
    if (TrendState && TrendState.categoryData) {
      Object.keys(TrendState.categoryData).forEach((key) => {
        (TrendState.categoryData[key] || []).forEach(add);
      });
    }
    if (TrendState && Array.isArray(TrendState.results)) {
      TrendState.results.forEach(add);
    }
    (extraVideos || []).forEach(add);
    return videos;
  }

  global.GoldenKeywordEngine = { extract, render, collectVideosFromTrendState, tokenize };
})(typeof window !== "undefined" ? window : globalThis);
