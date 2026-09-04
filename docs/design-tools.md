# 디자인 레퍼런스 툴 (무료 우선)

Mobbin은 **유료**라 기본 경로에서 뺀다. Refero·Pageflows도 유료 구독형인 경우가 많아서 쓰지 않는다.

레퍼런스는 **공짜로 열 수 있는 실제 화면 + GitHub CSS**만 본다. React 키트 통째 설치는 하지 않는다.

## 1순위: 공짜로 열리는 실제 제품 (가장 AI 티가 안 남)

브라우저로 직접 보고 색·간격·호버만 메모한다.

| 어디 | 왜 |
|------|-----|
| [YouTube Studio](https://studio.youtube.com) | 우리 도메인. 흰/회색 바탕, 액센트 빨강 하나, 이모지 남발 없음 |
| [studio.youtube.com 분석/콘텐츠] | 필터+테이블+칩. 검색창 UI |
| 우리가 이미 클론한 [YouTubeLedger](https://github.com/mbparks/YouTubeLedger) | Vanilla HTML. 로컬 `/tmp/YouTubeLedger/view-ledger.html` |
| GitHub (다크) | 칩, 버튼 press, 한 가지 악센트(초록) |

토큰 잡는 법: 스크린샷보다 **DevTools → computed color**. 배경 2단계 + 액센트 1색이면 충분하다.

## 2순위: 무료 웹 갤러리 (MCP 없음)

홈페이지·사 톤. 과한 어워드 사이트는 모션만 훔친다.

| 툴 | 요금 | 우리 용도 |
|----|------|-----------|
| [Land-book](https://land-book.com) | 브라우즈 무료 | 공개 레이더 랜딩 톤 |
| [Lapa Ninja](https://www.lapa.ninja) | 무료 | 랜딩 레이아웃 |
| [Httpster](https://httpster.net) | 무료 | 담백한 사이트 |
| [Siteinspire](https://www.siteinspire.com) | 무료 브라우즈 | 타이포·여백 |
| [Godly](https://godly.website) | 무료 브라우즈 | 인터랙션 아이디어만 |
| [uiverse.io](https://uiverse.io) | 무료 | **Vanilla HTML/CSS** 호버·press. 여기가 인터랙션 본진 |

## 3순위: GitHub (코드가 있고 무료)

이미 있는 GitHub MCP로 검색·클론 가능.

| 레포 | 가져올 것 | 가져오지 말 것 |
|------|-----------|----------------|
| [uiverse](https://uiverse.io) 개별 CSS | soft press, chip underline, skeleton | 네온 보더 |
| [picocss/pico](https://github.com/picocss/pico) | 다크 시맨틱 폼 | 전체 리셋으로 교체 |
| [open-props/open-props](https://github.com/open-props/open-props) | easing, 그림자 스케일 | 테마 통째 |
| [mbparks/YouTubeLedger](https://github.com/mbparks/YouTubeLedger) | wrap/grid (이미 적용) | 베이지 테마 |
| [fo0/tubetrend](https://github.com/fo0/tubetrend) | focus-visible, reduced-motion (이미 적용) | React/Tailwind |

Magic UI / 21st.dev / shadcn MCP는 **React+유료 쿼터**인 경우가 많다. Vanilla 스튜디오에는 안 넣는다.

## 쓰지 않음 (유료·구독)

- Mobbin (+ 이 워크스페이스 MCP `needsAuth`)
- Refero, Pageflows, Screenlane 프로
- Dribbble에서 “AI dashboard dark purple” 검색 — 지금 목업이랑 같은 티가 남

구독이 생기면 그때만 보조로 켠다.

## “AI 티” 줄이는 규칙 (무료 레퍼런스 공통)

1. 액센트 **한 색** (YouTube 빨강 또는 GitHub 초록). 황금키워드만 앰버.
2. 보라↔핑크 그라데이션 버튼 삭제.
3. 모든 CTA 이모지 제거. 필요한 곳만 1개.
4. 인터랙션: `:hover` 1px, `:active` scale(0.98), 칩 선택 underline. pulse/glow 남발 금지.
5. uiverse에서 고를 것: soft press, skeleton shimmer. 보더 빔 금지.

## 진행 순서 (무료만)

1. YouTube Studio + GitHub 다크에서 배경/보더/버튼 색 3개만 적는다.
2. uiverse에서 버튼·칩 CSS 2개 복사해 목업 HTML에 붙인다.
3. `docs/mockups/studio-*.html` 토큰 갱신 → `studio.html` 이식.
4. Land-book에서 공개 `index.html` 톤만 맞출지 결정.

로컬 레퍼런스:

```bash
# 이미 클론해 둔 적 있으면
python3 -m http.server 8090 --directory /tmp/YouTubeLedger
# http://127.0.0.1:8090/view-ledger.html
```
