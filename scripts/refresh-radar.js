#!/usr/bin/env node
/**
 * Fetch mostPopular charts (videos.list + channels.list only).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const API = "https://www.googleapis.com/youtube/v3";
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const RUNS_PER_DAY = 4; // every 6 hours
const UNITS_PER_REGION_PER_RUN = 2; // videos.list + channels.list

function parseDurationToSeconds(durationStr) {
  if (!durationStr) return 0;
  const match = String(durationStr).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] || "0", 10) * 3600 +
    parseInt(match[2] || "0", 10) * 60 +
    parseInt(match[3] || "0", 10)
  );
}

function tokenizeTitle(title) {
  return String(title || "")
    .split(/[\s|/\\,.\-–—·~!?:;()\[\]{}"'`]+/)
    .map((t) => t.replace(/^#+/, "").trim())
    .filter(Boolean);
}

function isStopTerm(term) {
  if (!term) return true;
  if (term.length <= 1) return true;
  if (/^\d+$/.test(term)) return true;
  if (term.toLowerCase() === "shorts") return true;
  return false;
}

function buildKeywords(videos) {
  const counts = new Map();
  const samples = new Map();
  for (const v of videos) {
    const terms = new Set([
      ...tokenizeTitle(v.title),
      ...(Array.isArray(v.tags) ? v.tags : []),
    ]);
    for (const raw of terms) {
      const term = String(raw).replace(/^#/, "").trim();
      if (isStopTerm(term)) continue;
      counts.set(term, (counts.get(term) || 0) + 1);
      if (!samples.has(term)) samples.set(term, []);
      const list = samples.get(term);
      if (list.length < 3) list.push(v.id);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, 20)
    .map(([term, count]) => ({
      term,
      count,
      sampleVideoIds: samples.get(term) || [],
    }));
}

function scoreVideo(item, subCount, nowMs) {
  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const details = item.contentDetails || {};
  const viewCount = parseInt(stats.viewCount || "0", 10) || 0;
  const subs = Math.max(1, parseInt(subCount || "1", 10) || 1);
  const publishedAt = snippet.publishedAt || new Date(nowMs).toISOString();
  const hoursDiff = Math.max(
    1,
    (nowMs - new Date(publishedAt).getTime()) / (1000 * 60 * 60)
  );
  const durationSec = parseDurationToSeconds(details.duration);
  const titleStr = String(snippet.title || "").toLowerCase();
  const descStr = String(snippet.description || "").toLowerCase();
  const thumbs = snippet.thumbnails || {};
  const thumb =
    (thumbs.high && thumbs.high.url) ||
    (thumbs.medium && thumbs.medium.url) ||
    (thumbs.default && thumbs.default.url) ||
    "";
  return {
    id: item.id,
    title: snippet.title || "",
    channelId: snippet.channelId || "",
    channelTitle: snippet.channelTitle || "",
    publishedAt,
    thumbnail: thumb,
    viewCount,
    subCount: subs,
    viralScore: (viewCount / subs) * 100,
    vph: Math.round(viewCount / hoursDiff),
    deltaVph: null,
    deltaRank: null,
    isShort:
      durationSec <= 60 ||
      titleStr.includes("#shorts") ||
      descStr.includes("#shorts"),
    tags: Array.isArray(snippet.tags) ? snippet.tags : [],
    url: `https://www.youtube.com/watch?v=${item.id}`,
  };
}

function applyDeltas(videos, prev) {
  if (!prev || !Array.isArray(prev.videos)) return videos;
  const prevById = new Map(prev.videos.map((v, i) => [v.id, { v, rank: i + 1 }]));
  return videos.map((v, i) => {
    const old = prevById.get(v.id);
    if (!old) return v;
    return {
      ...v,
      deltaVph: v.vph - (old.v.vph || 0),
      deltaRank: old.rank - (i + 1),
    };
  });
}

async function apiGet(pathname, params, key) {
  const url = new URL(`${API}/${pathname}`);
  for (const [k, val] of Object.entries(params)) url.searchParams.set(k, val);
  url.searchParams.set("key", key);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${pathname} ${res.status}: ${body.slice(0, 240)}`);
  }
  return res.json();
}

async function fetchRegion(region, key, nowMs) {
  const videoData = await apiGet(
    "videos",
    {
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      regionCode: region,
      maxResults: "50",
    },
    key
  );
  const items = videoData.items || [];
  const channelIds = [...new Set(items.map((i) => i.snippet && i.snippet.channelId).filter(Boolean))];
  const subMap = {};
  if (channelIds.length) {
    const chData = await apiGet(
      "channels",
      {
        part: "statistics",
        id: channelIds.join(","),
      },
      key
    );
    for (const ch of chData.items || []) {
      subMap[ch.id] = (ch.statistics && ch.statistics.subscriberCount) || "1";
    }
  }
  let videos = items.map((item) =>
    scoreVideo(item, subMap[item.snippet && item.snippet.channelId], nowMs)
  );
  videos.sort((a, b) => b.vph - a.vph);
  return videos;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

async function buildRegionPayload(region, key, nowMs, latestPath) {
  const prev = readJson(latestPath);
  const videos = applyDeltas(await fetchRegion(region, key, nowMs), prev);
  return {
    fetchedAt: new Date(nowMs).toISOString(),
    region,
    quotaEstimate: UNITS_PER_REGION_PER_RUN * RUNS_PER_DAY * 2,
    quotaEstimateRegion: UNITS_PER_REGION_PER_RUN * RUNS_PER_DAY,
    videos,
    keywords: buildKeywords(videos),
    prevFetchedAt: prev && prev.fetchedAt ? prev.fetchedAt : null,
  };
}

async function main() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.error("YOUTUBE_API_KEY is missing");
    process.exit(1);
  }

  const nowMs = Date.now();
  const day = new Date(nowMs).toISOString().slice(0, 10);

  const krPath = path.join(DATA, "kr-latest.json");
  const kr = await buildRegionPayload("KR", key, nowMs, krPath);
  kr.quotaEstimate = 16;
  writeJson(krPath, kr);
  writeJson(path.join(DATA, "kr", `${day}.json`), kr);

  try {
    const jpPath = path.join(DATA, "jp-latest.json");
    const jp = await buildRegionPayload("JP", key, nowMs, jpPath);
    jp.quotaEstimate = 16;
    writeJson(jpPath, jp);
    writeJson(path.join(DATA, "jp", `${day}.json`), jp);
  } catch (err) {
    console.error("JP fetch failed; KR cache was written:", err.message);
  }
}

module.exports = {
  parseDurationToSeconds,
  tokenizeTitle,
  isStopTerm,
  buildKeywords,
  scoreVideo,
  applyDeltas,
  UNITS_PER_REGION_PER_RUN,
  RUNS_PER_DAY,
};

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
