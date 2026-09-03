#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"
HOST="${HOST:-127.0.0.1}"
PAGE="${1:-studio.html}"
URL="http://${HOST}:${PORT}/${PAGE}"
SERVER_LOG="${ROOT_DIR}/.local-server.log"
PID_FILE="${ROOT_DIR}/.local-server.pid"

if [[ ! -f "${ROOT_DIR}/${PAGE}" ]]; then
  echo "페이지를 찾을 수 없습니다: ${PAGE}" >&2
  echo "예시: ./run-local.sh studio.html" >&2
  exit 1
fi

is_running() {
  local pid="$1"
  kill -0 "$pid" 2>/dev/null
}

start_server() {
  if [[ -f "$PID_FILE" ]]; then
    local existing_pid
    existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "${existing_pid}" ]] && is_running "${existing_pid}"; then
      echo "로컬 서버 재사용: PID ${existing_pid}"
      return
    fi
  fi

  echo "로컬 서버 시작: http://${HOST}:${PORT}/"
  (
    cd "$ROOT_DIR"
    nohup python3 -m http.server "$PORT" --bind "$HOST" >"$SERVER_LOG" 2>&1 &
    echo $! >"$PID_FILE"
  )

  local pid
  pid="$(cat "$PID_FILE")"
  for _ in {1..30}; do
    if curl -fsS "http://${HOST}:${PORT}/" >/dev/null 2>&1; then
      echo "서버 준비 완료: PID ${pid}"
      return
    fi
    sleep 0.5
  done

  echo "서버 시작 확인에 실패했습니다. 로그를 확인하세요: ${SERVER_LOG}" >&2
  exit 1
}

open_browser() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 &
    return
  fi
  if command -v google-chrome >/dev/null 2>&1; then
    google-chrome "$URL" >/dev/null 2>&1 &
    return
  fi
  if command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser "$URL" >/dev/null 2>&1 &
    return
  fi
  if command -v chromium >/dev/null 2>&1; then
    chromium "$URL" >/dev/null 2>&1 &
    return
  fi

  echo "브라우저를 자동으로 열 수 없습니다. 아래 주소를 직접 여세요:"
  echo "$URL"
}

start_server
open_browser

echo "열기 완료: $URL"
echo "서버 로그: $SERVER_LOG"
