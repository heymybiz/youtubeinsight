# PRD v0.5 — YouTube Insight 반응형 웹 UI

**상태:** 초안 (목업·구현의 기준 문서)  
**작성일:** 2026-09-03  
**대상 제품:** YouTube Insight V6.1 (공개 급등 보드 + BYOK 스튜디오)  
**원칙:** 기능은 유지하고, **웹+모바일 반응형**으로 다시 짠다. React/Next로 스택을 바꾸지 않는다.

이 문서가 확정된 뒤에 Desktop 1장 + Mobile 1장 와이어 목업을 그린다. 목업이 PRD를 이기면 안 되고, PRD의 Must만 목업에 넣는다.

---

## 1. 배경

지금 제품은 두 층으로 나뉜다.

| 층 | 파일 | 사용자 |
|----|------|--------|
| 공개 레이더 | `index.html`, `keywords/`, `shorts/`, `vs-yesterday/`, `jp/` | API 키 없이 급등 보드 |
| BYOK 스튜디오 | `studio.html`, `youtube_insight.html` | YouTube + Gemini 키로 Deep Search / 황금키워드 / AI 분석 |

문제:

- `studio.html`에 `@media`가 거의 없었고, 검색줄·티커·버튼이 모바일에서 겹치거나 가로로 밀렸다.
- 공개 보드는 `radar.css`에 640px 규칙 1개만 있었다.
- 스튜디오 상단에 **같은 Top 20 CTA가 두 개** 붙어 있었다 → 이미 티커(순위표) / 금색 버튼(황금키워드)으로 분리함.
- 키워드 검색창에 **뭘 넣을지** 몰랐다 → 급등 제목에서 황금키워드 칩을 뽑는 엔진을 붙임.

이미 들어간 기반:

- `assets/golden-keywords.js` — 황금키워드 엔진
- `assets/responsive.css` — YouTubeLedger + tubetrend 패턴의 1차 반응형
- `./start-studio.sh` — 로컬 서버 + 브라우저

이 PRD는 **그 기반 위에서 “웹을 제대로” 만들기 위한 다음 단계**다. GitHub 레퍼런스를 장식용 링크가 아니라 **화면별 구현 플레이북**으로 쓴다.

---

## 2. 목표

### 제품 목표

1. **한 코드베이스로 웹과 모바일**을 커버한다. 네이티브 앱, 앱스토어, 별도 `m.` 사이트는 없다.
2. 폰에서도 **검색 → 황금키워드 칩 → Deep Search → 카드 결과**가 한 손으로 된다.
3. 공개 보드는 **키 없이**, 스튜디오는 **키 있을 때만** 무거운 기능을 연다. UI는 두 층이 같은 톤을 쓴다.

### 비목표 (이번에 안 함)

- React / Next / Tailwind 빌드 도입
- PWA 설치 프롬프트, 푸시, 오프라인 캐시
- 라이트 테마 토글 (tubetrend 패턴은 나중에 Should)
- YouTube `search.list`를 공개 홈에 붙이기
- 외부 SEO 키워드 덤프 스크래핑

---

## 3. 사용자와 핵심 작업

| 페르소나 | 기기 | 핵심 작업 (Job) |
|----------|------|-----------------|
| 방문 크리에이터 | 폰 Safari/Chrome | 오늘 KR 급등 보드를 스크롤하고, 제목/영상을 연다 |
| 작업 크리에이터 | 노트북 | 스튜디오에서 키워드를 넣고 떡상지수·VPH로 정렬한다 |
| 작업 크리에이터 | 폰 | 황금키워드 칩을 눌러 검색어를 채우고, 결과는 1열 카드로 본다 |

성공의 기준은 “예쁜 대시보드”가 아니라 **위 Job이 가로 스크롤 없이 끝나는 것**이다.

---

## 4. GitHub 레퍼런스를 어떻게 쓰는가

**전체 프로젝트를 npm 설치하거나 포크로 갈아끼우지 않는다.**  
우리 스택은 Vanilla JS + 정적 HTML이다. 레퍼런스는 **패턴 추출 → `assets/`에 이식**한다.

로컬에서 레퍼런스를 열어보는 방법:

```bash
git clone --depth 1 https://github.com/mbparks/YouTubeLedger.git /tmp/YouTubeLedger
git clone --depth 1 https://github.com/fo0/tubetrend.git /tmp/tubetrend
# 브라우저에서 /tmp/YouTubeLedger/view-ledger.html 을 연다 (빌드 없음)
```

### 4.1 반드시 따라갈 레포 (Must 플레이북)

#### A. [mbparks/YouTubeLedger](https://github.com/mbparks/YouTubeLedger)

왜: 단일 HTML, YouTube Data API v3, 빌드 없음. 우리 스튜디오와 구조가 가장 같다.

| 가져올 것 | 어디에 심을지 |
|-----------|----------------|
| `clamp()` 타이포, `max-width` 컨테이너 | `h1`, `.container`, `.wrap` |
| `flex-wrap` + `minmax` 그리드 | KPI(`.dashboard`), 필터, 카드 |
| `overflow-x: auto` 스크롤 레인 | 카테고리 탭, 정렬 칩, 공개 보드 `nav` |
| 입력은 항상 `width: 100%` (`.field`) | `#keyword`, 네이티브 필터 select |
| 탭은 wrap, 좁으면 가로 스크롤 | `.trend-category-tabs`, `.tabs` |
| sticky 헤더가 있는 표는 `.tbl-wrap`으로 감싸기 | 랭킹 모달 리스트 |

가져오지 말 것: 라이트 페이퍼 테마, Fraunces 서체, Chart.js 전면 도입, 인쇄 원페이저.

구현 시 열어볼 파일: `/tmp/YouTubeLedger/view-ledger.html` 상단 `<style>` (대략 `.row`, `.stats`, `.tabs`, `.tbl-wrap`).

#### B. [fo0/tubetrend](https://github.com/fo0/tubetrend)

왜: YouTube 트렌드 도구. Tailwind 앱이지만 **접근성·다크 UI 토큰**이 바로 쓸 만하다.

| 가져올 것 | 어디에 심을지 |
|-----------|----------------|
| 다크 스크롤바 | 전역 (`responsive.css`에 1차 반영됨) |
| `:focus-visible` 파란 링 | 버튼, 칩, input, select |
| `prefers-reduced-motion` | 티커 애니메이션, pulse, hover translate |
| 카드 하이라이트(fresh border) 아이디어 | 급등 카드의 VPH/기여도 강조 |
| 모바일에서 네비 아이템 wrap / sticky | 공개 보드 `nav`, 스튜디오 헤더 |

가져오지 말 것: React 컴포넌트, Electron, Chrome extension, i18n 전체.

구현 시 열어볼 파일: `src/styles/index.css`의 scrollbar / `:focus-visible` / reduced-motion 블록.

### 4.2 화면 설계만 참고할 레포 (Should 플레이북)

스택이 달라 **코드를 복사하지 않는다.** 목업과 CSS 레이아웃 결정할 때 스크린샷·README의 반응형 규칙을 본다.

| 레포 | 배울 레이아웃 규칙 | 우리 화면에 옮기는 법 |
|------|-------------------|------------------------|
| [hrithikBiswas/Analytics-Dashboard](https://github.com/hrithikBiswas/Analytics-Dashboard) | Mobile: 카드 세로 스택, 사이드바는 오버레이. Tablet: 2열. Desktop: 멀티컬럼 | 스튜디오에 사이드바는 없다. 대신 **헤더 액션을 모바일에서 풀너비 스택**, KPI는 1열 |
| [makara4code/next-shadcn-dashboard](https://github.com/makara4code/next-shadcn-dashboard) | Mobile-first, 컴포넌트 단위(칩/테이블/차트) | 황금키워드 칩·모달을 **재사용 블록**처럼 CSS 클래스로 고정 |
| [uzicodes/Stats-Tube](https://github.com/uzicodes/Stats-Tube) | sticky 네비, 폭이 줄면 배지 위치 조정 | 공개 보드 `nav`를 상단 sticky, 좁으면 가로 스와이프 |
| [erickouassi/ytubestats](https://github.com/erickouassi/ytubestats) | 채널 숫자 4개를 한눈에 | `.dash-card`를 “숫자 + 라벨”만 남기고 장식 줄이기 |

### 4.3 레퍼런스 사용 규칙 (개발자가 헷갈리지 않게)

1. 새 UI를 넣을 때 **먼저 YouTubeLedger에서 같은 패턴이 있는지** 본다. 있으면 CSS만 이식한다.
2. 애니메이션·포커스·모션은 **tubetrend 규칙을 이긴다.** (접근성)
3. Next/React 템플릿의 JSX는 이식하지 않는다. “몇 열인가 / 무엇이 접히는가”만 가져온다.
4. 레퍼런스 때문에 YouTube `search.list`를 공개 페이지에 넣지 않는다.
5. 출처는 `docs/ui-references.md`에 한 줄로 남긴다.

---

## 5. 정보 구조와 화면

### 5.1 사이트맵

```
공개
  /                 오늘 KR 급등 보드
  /keywords/        키워드 보드 (같은 캐시)
  /shorts/          쇼츠 필터
  /vs-yesterday/    어제 대비
  /jp/              일본 보드
  /kr/YYYY-MM-DD/   날짜 스냅샷

스튜디오
  /studio.html      BYOK 작업 화면 (youtube_insight.html 은 동일 사본)
```

### 5.2 스튜디오 블록 순서 (모바일 우선)

위에서 아래로, **한 손 엄지로 닿는 순서**:

1. 제목 + API 키 상태 (접을 수 있으면 Should)
2. LIVE TREND — 국가, 카테고리 칩(가로 스크롤), 티커, **황금키워드로 검색**
3. 검색 필터 (날짜/정렬/길이) — 아코디언 Should
4. 검색줄 — 모드 + 키워드 + Deep Search (나머지는 2줄 Should)
5. 황금키워드 칩 패널
6. KPI 4장
7. 롱폼/쇼츠 탭 + 정렬
8. 결과 카드 1열(모바일) / 2~3열(데스크톱)

### 5.3 CTA 역할 (이미 구현, PRD에서 고정)

| UI | 동작 | 하면 안 되는 것 |
|----|------|-----------------|
| 롤링 티커 | 카테고리 Top 20 **영상 순위** 모달 | 황금키워드 패널을 열지 않음 |
| 금색 버튼 `황금키워드로 검색` | 칩 패널로 스크롤 | 같은 순위 모달을 다시 열지 않음 |
| 황금키워드 칩 | `#keyword` 채우고 Deep Search | 새 `search.list` 없이 캐시 제목에서만 추출 |
| `실시간 검색 랭킹` | 기존 랭킹 모달 | 티커와 문구를 똑같이 쓰지 않음 |

---

## 6. 반응형 규칙

YouTubeLedger의 “줄 바꿈 + 스크롤 레인”, Analytics-Dashboard의 “폭별 열 수”를 우리 숫자에 맞춘다.

| 이름 | 폭 | 레이아웃 |
|------|-----|----------|
| Phone | `< 480px` | 1열, 버튼 풀너비, 터치 44px, 카테고리 가로 스와이프 |
| Mobile | `480–768px` | 1열, KPI 2열 가능하면 2열 |
| Tablet | `768–1024px` | 카드 2열, 검색줄은 줄바꿈 허용 |
| Desktop | `> 1024px` | 현재 와이드 레이아웃 유지, 카드 `minmax(280px, 1fr)` |

공통:

- `html, body { overflow-x: clip; }` — 페이지 단위 가로 스크롤 금지
- 탭/칩만 `overflow-x: auto` (YouTubeLedger `.tbl-wrap`과 같은 역할)
- `env(safe-area-inset-*)` — 노치
- 모달: 모바일에서 하단 시트 (`align-items: flex-end`), 데스크톱은 중앙
- 터치 타겟 최소 **44×44px** (tubetrend/Stats-Tube 계열 관례)

검증 뷰포트: **390×844**, **768×1024**, **1440×900**.

---

## 7. 화면별 요구사항

### Must (이번 UI 사이클)

- [ ] Phone 390px에서 `document.documentElement.scrollWidth === clientWidth` (스튜디오 + 공개 홈)
- [ ] 검색 input `min-width` 고정값 제거, 부모 너비 100%
- [ ] 카테고리 탭·공개 `nav`는 가로 스크롤만, 페이지를 밀어내지 않음
- [ ] 황금키워드 칩이 검색창 바로 아래 보이고, 탭하면 검색어가 채워짐
- [ ] 결과 카드 모바일 1열, 썸네일 16:9 가득
- [ ] 모달이 화면 밖으로 안 나가고, 닫기 버튼 44px
- [ ] API 키 모달이 폰에서도 입력·저장 가능
- [ ] `responsive.css` 한 파일이 스튜디오와 공개 보드를 같이 담당

### Should (다음 스프린트)

- [ ] 스튜디오 헤더 액션(태그랭킹/키/CSV/토큰)을 모바일에서 **더보기**로 접기 (Analytics-Dashboard 오버레이 메뉴의 Vanilla 버전)
- [ ] 필터 3종을 `<details>` 아코디언
- [ ] 공개 보드 `nav` sticky
- [ ] 빈 상태 / 로딩 스켈레톤 (tubetrend fade-in 대신 정적 플레이스홀더)
- [ ] `favicon.ico` 추가로 콘솔 404 제거

### Won’t

- [ ] shadcn/Radix를 npm으로 넣기
- [ ] ToolJet, CoreUI 같은 어드민 템플릿 통째 설치
- [ ] 다크/라이트 토글 (명시적으로 다음 문서로 미룸)
- [ ] 하단 고정 탭바 네이티브 앱 흉내 (지금은 스크롤 한 장이 우선)

---

## 8. 시각·카피 가이드 (레퍼런스에 맞추되 우리 톤 유지)

- **배경:** `#0f1015` 유지 (공개·스튜디오 동일). YouTubeLedger의 베이지 테마는 쓰지 않음.
- **포인트:** 액센트 블루 `#3b82f6`, 황금키워드 앰버 `#fbbf24` (이미 있는 토큰).
- **타이포:** Pretendard / system-ui. Ledger의 Fraunces는 넣지 않음. 제목만 `clamp()`.
- **카피:** 버튼은 기능이 드러나게. “Top 20 전체 순위표”를 두 곳에 반복하지 않음.
- **황금키워드 설명 한 줄:** “웹에서 키워드를 긁지 않고, 지금 급등 중인 제목에서 검색 문구를 뽑습니다.”

---

## 9. 기술 제약 (제품과 충돌하면 UI를 접는다)

- 공개 홈: 프론트에 API 키 없음. `videos.list?chart=mostPopular` + `channels.list` 캐시만.
- 스튜디오: BYOK, Deep Search는 `search.list` 사용 가능. 황금키워드 추출은 **추가 search.list 금지**.
- `studio.html`과 `youtube_insight.html`은 동일 사본으로 유지.
- 정적 GitHub Pages. 빌드 스텝 없음.

---

## 10. 성공 기준

| ID | 기준 | 측정 |
|----|------|------|
| S1 | 390px 스튜디오 가로 스크롤 없음 | Puppeteer / DevTools |
| S2 | 390px 공개 홈 가로 스크롤 없음 | 동일 |
| S3 | 칩 탭 → `#keyword`에 문구 입력 | 기존 헤드리스 테스트 |
| S4 | 티커와 금색 버튼 동작이 다름 | 모달 vs 패널 |
| S5 | 터치 타겟 주요 CTA ≥ 44px | computed style |
| S6 | 키보드만으로 검색·칩·모달 닫기 | `:focus-visible` 링 보임 |

S1은 `assets/responsive.css` 1차 적용에서 이미 통과한 상태다. PRD 이후 목업·리파인에서도 **회귀하면 머지하지 않는다.**

---

## 11. 목업으로 넘기는 방법 (이 PRD 다음)

PRD Must만 담아 **와이어 2장**.

1. **Desktop 1440** — YouTubeLedger처럼 넓은 콘솔: 헤더 / LIVE TREND / 검색+칩 / KPI / 카드 그리드
2. **Phone 390** — Analytics-Dashboard 모바일처럼 전부 세로. 카테고리는 Stats-Tube식 가로 칩 레인.

목업에 넣지 말 것: 새 기능, 라이트 테마, 사이드바, 로그인.

목업 툴: Excalidraw / Figma 어디든. 파일은 나중에 `docs/mockups/`에 링크만 건다.

---

## 12. 구현 순서 (레퍼런스 활용)

1. YouTubeLedger `view-ledger.html`을 옆에 띄워 두고, 우리 `.search-row` / `.dashboard`가 그 `.row` / `.stats`와 같은 줄바꿈 규칙을 쓰는지 대조한다.
2. tubetrend `index.css`의 focus/motion 블록과 `responsive.css`가 어긋나면 tubetrend를 이긴다.
3. 공개 보드 `nav`는 Stats-Tube README의 sticky + wrap 설명을 스케치한 뒤 CSS만 넣는다.
4. 한 화면이 끝날 때마다 390 / 768 / 1440 스크린샷.
5. `studio.html` 수정 후 `youtube_insight.html`에 복사.

---

## 13. 열린 결정 (목업에서 고른다)

- 스튜디오 헤더를 모바일에서 **더보기**로 접을지, 그냥 풀너비 버튼 스택으로 둘지.
- Deep Search 옆 Gemini/블루오션 버튼을 2줄로 내릴지, 메뉴로 숨길지.
- 공개 보드와 스튜디오 헤더를 얼마나 같은 컴포넌트처럼 보이게 할지 (지금은 CSS 토큰만 공유).

이 세 가지는 PRD Must가 아니다. 목업에서 고르고 v1.0에 적는다.

---

## 부록. 관련 파일

| 파일 | 역할 |
|------|------|
| `docs/ui-references.md` | 레포 출처·설치하지 않은 이유 |
| `assets/responsive.css` | 공통 반응형 1차 구현 |
| `assets/golden-keywords.js` | 황금키워드 엔진 |
| `assets/radar.css` | 공개 보드 기본 스타일 |
| `studio.html` | 스튜디오 |
| `./start-studio.sh` | 로컬 실행 |
