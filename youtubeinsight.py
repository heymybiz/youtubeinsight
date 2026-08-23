#!/usr/bin/env python3
"""YouTube Insight CLI. One search.list page. Numbers from the API only."""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

FACTORY_ROOT = Path(r"D:\Project\stark-workspace\shorts-factory")
INSIGHT_ENV = Path(r"D:\Project\Youtubeinsight\.env")
API_BASE = "https://www.googleapis.com/youtube/v3/"
USAGE = (
    "usage: youtubeinsight.py keywords QUERY "
    "[--date today|1h|24h|7d|30d|1y|all] [--region XX] "
    "[--format all|shorts|long] [--max N] "
    "[--order relevance|viewCount|date] [--json]\n"
    "       youtubeinsight.py popular "
    "[--date today|1h|24h|7d|30d|1y|all] [--region XX] "
    "[--format all|shorts|long] [--max N] [--json]"
)
DATE_CHOICES = ("today", "1h", "24h", "7d", "30d", "1y", "all")
ISO_DURATION = re.compile(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?")


class ApiError(Exception):
    pass


def _reconfigure_stdio():
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if reconf is None:
            continue
        try:
            reconf(encoding="utf-8")
        except (OSError, ValueError):
            pass


def parse_env_file(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    try:
        text = path.read_text(encoding="utf-8-sig")
    except OSError:
        return out
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.lower().startswith("export "):
            line = line[7:].strip()
        if "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        if key:
            out[key] = val
    return out


def load_api_key() -> str | None:
    for name in ("YT_API_KEY", "YOUTUBE_API_KEY"):
        val = (os.environ.get(name) or "").strip()
        if val:
            return val
    for env_path in (FACTORY_ROOT / ".env", INSIGHT_ENV):
        data = parse_env_file(env_path)
        for name in ("YT_API_KEY", "YOUTUBE_API_KEY"):
            val = (data.get(name) or "").strip()
            if val:
                return val
    return None


def redact(text: str, secret: str | None) -> str:
    if not secret:
        return text
    return text.replace(secret, "***")


def published_after_rfc3339(option: str) -> str | None:
    # today = 24h (same window as HTML "오늘")
    if option in ("", "all"):
        return None
    now = datetime.now(timezone.utc)
    if option in ("today", "24h"):
        delta = timedelta(hours=24)
    elif option == "1h":
        delta = timedelta(hours=1)
    elif option == "7d":
        delta = timedelta(days=7)
    elif option == "30d":
        delta = timedelta(days=30)
    elif option == "1y":
        delta = timedelta(days=365)
    else:
        return None
    return (now - delta).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_duration_seconds(duration: str | None) -> int:
    if not duration:
        return 0
    match = ISO_DURATION.search(duration)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


def parse_iso_datetime(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def error_message_from_body(body: str, status: int) -> str:
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return body.strip() or f"HTTP {status}"
    err = data.get("error")
    if isinstance(err, dict):
        msg = err.get("message")
        if msg:
            return str(msg)
    if isinstance(err, str) and err:
        return err
    return body.strip() or f"HTTP {status}"


def api_get(path: str, params: dict, key: str) -> dict:
    query = dict(params)
    query["key"] = key
    url = API_BASE + path.lstrip("/") + "?" + urlencode(query, safe=",")
    req = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "youtubeinsight-cli/1.0",
        },
    )
    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise ApiError(error_message_from_body(body, exc.code)) from None
    except URLError as exc:
        reason = getattr(exc, "reason", None)
        raise ApiError(str(reason) if reason else "network error") from None
    except TimeoutError:
        raise ApiError("request timed out") from None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise ApiError("invalid JSON from YouTube API") from None
    if isinstance(data, dict) and data.get("error"):
        raise ApiError(error_message_from_body(raw, 0))
    return data


def fetch_videos(ids: list[str], key: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    if not ids:
        return out
    for i in range(0, len(ids), 50):
        chunk = ids[i : i + 50]
        data = api_get(
            "videos",
            {
                "part": "snippet,contentDetails,statistics,status",
                "id": ",".join(chunk),
                "maxResults": str(min(len(chunk), 50)),
            },
            key,
        )
        for item in data.get("items") or []:
            vid = item.get("id")
            if vid:
                out[vid] = item
    return out


def fetch_sub_counts(channel_ids: list[str], key: str) -> dict[str, int]:
    out: dict[str, int] = {}
    unique = []
    seen = set()
    for cid in channel_ids:
        if cid and cid not in seen:
            seen.add(cid)
            unique.append(cid)
    for i in range(0, len(unique), 50):
        chunk = unique[i : i + 50]
        data = api_get(
            "channels",
            {
                "part": "statistics",
                "id": ",".join(chunk),
            },
            key,
        )
        for item in data.get("items") or []:
            cid = item.get("id")
            stats = item.get("statistics") or {}
            try:
                subs = int(stats.get("subscriberCount") or 0)
            except (TypeError, ValueError):
                subs = 0
            if cid:
                out[cid] = subs
    return out


def score_video(video: dict, sub_count: int, now: datetime) -> dict:
    snippet = video.get("snippet") or {}
    stats = video.get("statistics") or {}
    details = video.get("contentDetails") or {}
    status = video.get("status") or {}
    vid = video.get("id") or ""
    title = snippet.get("title") or ""
    desc = snippet.get("description") or ""
    try:
        views = int(stats.get("viewCount") or 0)
    except (TypeError, ValueError):
        views = 0
    try:
        subs = int(sub_count or 0)
    except (TypeError, ValueError):
        subs = 0
    viral_score = (views / max(subs, 1)) * 100
    published_at = snippet.get("publishedAt") or ""
    pub = parse_iso_datetime(published_at)
    if pub is not None:
        if pub.tzinfo is None:
            pub = pub.replace(tzinfo=timezone.utc)
        hours_diff = max(1.0, (now - pub).total_seconds() / 3600.0)
    else:
        hours_diff = 1.0
    vph = int(round(views / hours_diff))
    duration_sec = parse_duration_seconds(details.get("duration") or "")
    blob = f"{title} {desc}".lower()
    is_short = duration_sec <= 60 or "#shorts" in blob
    tags = snippet.get("tags") or []
    if not isinstance(tags, list):
        tags = []
    tags = [str(t) for t in tags]
    license_val = status.get("license")
    return {
        "id": vid,
        "title": title,
        "channelTitle": snippet.get("channelTitle") or "",
        "channelId": snippet.get("channelId") or "",
        "url": f"https://www.youtube.com/watch?v={vid}",
        "viewCount": views,
        "subCount": subs,
        "viralScore": viral_score,
        "vph": vph,
        "durationSec": duration_sec,
        "isShort": is_short,
        "publishedAt": published_at,
        "license": license_val,
        "licensedContent": bool(details.get("licensedContent")),
        "tags": tags,
    }


def apply_format(items: list[dict], fmt: str) -> list[dict]:
    if fmt == "shorts":
        return [i for i in items if i.get("isShort")]
    if fmt == "long":
        return [i for i in items if not i.get("isShort")]
    return items


def run_keywords(args, key: str) -> dict:
    query = " ".join(args.query).strip()
    max_results = args.max
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": str(max_results),
        "regionCode": args.region,
        "order": args.order,
    }
    pub_after = published_after_rfc3339(args.date)
    if pub_after:
        params["publishedAfter"] = pub_after
    # Native API short = under 4 min; still post-filter isShort (<=60s or #shorts)
    if args.fmt == "shorts":
        params["videoDuration"] = "short"
    data = api_get("search", params, key)
    ids = []
    for item in data.get("items") or []:
        vid_obj = item.get("id") or {}
        if isinstance(vid_obj, dict):
            vid = vid_obj.get("videoId")
        else:
            vid = vid_obj
        if vid:
            ids.append(vid)
    videos = fetch_videos(ids, key)
    channel_ids = [
        (videos[vid].get("snippet") or {}).get("channelId")
        for vid in ids
        if vid in videos
    ]
    subs = fetch_sub_counts(channel_ids, key)
    now = datetime.now(timezone.utc)
    scored = []
    for vid in ids:
        video = videos.get(vid)
        if not video:
            continue
        cid = (video.get("snippet") or {}).get("channelId") or ""
        scored.append(score_video(video, subs.get(cid, 0), now))
    scored = apply_format(scored, args.fmt)
    return {
        "ok": True,
        "mode": "keywords",
        "query": query,
        "region": args.region,
        "date": args.date,
        "count": len(scored),
        "items": scored,
    }


def run_popular(args, key: str) -> dict:
    max_results = args.max
    params = {
        "part": "snippet,contentDetails,statistics,status",
        "chart": "mostPopular",
        "regionCode": args.region,
        "maxResults": str(max_results),
    }
    data = api_get("videos", params, key)
    videos = []
    for item in data.get("items") or []:
        if item.get("id"):
            videos.append(item)
    channel_ids = [
        (v.get("snippet") or {}).get("channelId") for v in videos
    ]
    subs = fetch_sub_counts(channel_ids, key)
    now = datetime.now(timezone.utc)
    scored = []
    cutoff = published_after_rfc3339(args.date)
    cutoff_dt = parse_iso_datetime(cutoff) if cutoff else None
    for video in videos:
        cid = (video.get("snippet") or {}).get("channelId") or ""
        item = score_video(video, subs.get(cid, 0), now)
        if cutoff_dt is not None:
            pub = parse_iso_datetime(item.get("publishedAt") or "")
            if pub is None:
                continue
            if pub.tzinfo is None:
                pub = pub.replace(tzinfo=timezone.utc)
            if pub < cutoff_dt:
                continue
        scored.append(item)
    scored = apply_format(scored, args.fmt)
    return {
        "ok": True,
        "mode": "popular",
        "query": "",
        "region": args.region,
        "date": args.date,
        "count": len(scored),
        "items": scored,
    }


def clip(text: str, width: int) -> str:
    text = text.replace("\n", " ").strip()
    if len(text) <= width:
        return text
    return text[: width - 1] + "…"


def print_table(payload: dict) -> None:
    items = payload.get("items") or []
    header = (
        f"mode={payload.get('mode')} region={payload.get('region')} "
        f"date={payload.get('date')} count={payload.get('count')}"
    )
    query = payload.get("query") or ""
    if query:
        header += f" query={query}"
    print(header)
    if not items:
        print("(no items)")
        return
    cols = (
        f"{'#':>3}  {'title':<42}  {'channel':<18}  {'views':>10}  "
        f"{'vph':>8}  {'viral':>8}  {'sec':>5}  {'short':<5}  "
        f"{'license':<16}  url"
    )
    print(cols)
    for i, it in enumerate(items, 1):
        lic = it.get("license") or ""
        if it.get("licensedContent"):
            lic = f"{lic}+id" if lic else "id"
        print(
            f"{i:>3}  {clip(it.get('title') or '', 42):<42}  "
            f"{clip(it.get('channelTitle') or '', 18):<18}  "
            f"{int(it.get('viewCount') or 0):>10}  "
            f"{int(it.get('vph') or 0):>8}  "
            f"{float(it.get('viralScore') or 0):>8.1f}  "
            f"{int(it.get('durationSec') or 0):>5}  "
            f"{'yes' if it.get('isShort') else 'no':<5}  "
            f"{clip(str(lic), 16):<16}  "
            f"{it.get('url') or ''}"
        )


def fail(message: str, key: str | None, code: int = 1) -> int:
    payload = {"ok": False, "error": redact(message, key)}
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return code


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="youtubeinsight.py",
        add_help=True,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=USAGE,
    )
    sub = parser.add_subparsers(dest="cmd")

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--date", choices=DATE_CHOICES, default="all")
    common.add_argument("--region", default="KR")
    common.add_argument(
        "--format", dest="fmt", choices=("all", "shorts", "long"), default="all"
    )
    common.add_argument("--max", type=int, default=25)
    common.add_argument("--json", action="store_true")

    keywords = sub.add_parser("keywords", parents=[common])
    keywords.add_argument("query", nargs="*")
    keywords.add_argument(
        "--order",
        choices=("relevance", "viewCount", "date"),
        default="viewCount",
    )

    sub.add_parser("popular", parents=[common])
    return parser


def normalize_args(args) -> None:
    args.region = (args.region or "KR").strip().upper() or "KR"
    try:
        n = int(args.max)
    except (TypeError, ValueError):
        n = 25
    if n < 1:
        n = 1
    if n > 50:
        n = 50
    args.max = n
    if not hasattr(args, "order"):
        args.order = "viewCount"
    if not hasattr(args, "query"):
        args.query = []


def main(argv: list[str] | None = None) -> int:
    _reconfigure_stdio()
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.cmd:
        print(USAGE, file=sys.stderr)
        return 2
    if args.cmd == "keywords" and not " ".join(args.query).strip():
        print(USAGE, file=sys.stderr)
        return 2
    normalize_args(args)
    key = load_api_key()
    if not key:
        return fail("YT_API_KEY not set", None)
    try:
        if args.cmd == "keywords":
            payload = run_keywords(args, key)
        else:
            payload = run_popular(args, key)
    except ApiError as exc:
        return fail(str(exc), key)
    except Exception as exc:
        return fail(str(exc), key)
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print_table(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
