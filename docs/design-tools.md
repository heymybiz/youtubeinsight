# 디자인 레퍼런스 툴 (색감·인터랙션)

스튜디오 목업이 **남색+보라 그라데이션+앰버 CTA+이모지 칩** 조합이라, 흔히 말하는 “AI 대시보드” 티가 난다.  
레퍼런스는 **실제 출시된 화면**을 먼저 보고, 그다음에 CSS/모션만 Vanilla로 옮긴다. React 키트를 통째로 설치하지 않는다.

## 1순위: Mobbin MCP (이미 Cursor에 있음)

- 사이트: https://mobbin.com/mcp  
- 내용: 출시된 앱 화면 62만+ (검색, 대시보드, 설정, 온보딩 등)  
- 이 워크스페이스: `Mobbin` 네임스페이스가 **needsAuth** 상태. 클라우드 에이전트에서는 로그인 창을 못 연다.

**연결 방법 (Cursor 데스크톱에서):**

1. Cursor Settings → MCP → **Mobbin** → Authenticate  
2. 브라우저에서 Mobbin 계정으로 승인  
3. 채팅에 예: “YouTube Studio / Linear / Toss 의 검색바·칩·다크 대시보드 화면을 Mobbin에서 찾아줘”

에이전트가 실제 스크린을 본 뒤에 색·간격·마이크로인터랙션을 이식한다.  
이게 “AI 티 빼는” 가장 빠른 경로다.

찾을 검색어 예시:

- YouTube Studio analytics dark  
- keyword search chips  
- live ticker / trending  
- settings API key modal  
- mobile bottom sheet

## 2순위: 웹(홈페이지) 갤러리 — MCP 없음, 직접 링크

앱만 보고 웹을 만들면 또 어색해진다. **웹 제품**은 아래를 북마크한다.

| 툴 | 무엇을 보나 | 우리 화면에 쓸 때 |
|----|-------------|-------------------|
| [Refero](https://refero.design) | 실제 웹 플로우 스크린 | 검색+필터, 빈 상태 |
| [Land-book](https://land-book.com) | 랜딩/마케팅 톤 | 공개 레이더 홈 톤 |
| [Godly](https://godly.website) | 강한 인터랙션 랜딩 | 모션만 참고, 과하지 않게 |
| [Awwwards](https://www.awwwards.com) | 하이엔드 웹 | 색·타이포, 레이아웃은 단순하게 |

## 3순위: GitHub / 오픈 UI (코드가 있는 스타일)

스택을 바꾸지 않고 **패턴만** 가져온다.

| 레포·사이트 | 맞음 | 주의 |
|-------------|------|------|
| [uiverse-io](https://uiverse.io) | HTML/CSS 버튼·토글·호버. Vanilla에 바로 붙이기 좋음 | 과한 네온은 피함 |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | 마퀴, 리플, 보더 빔 등 인터랙션 사전 | React. 아이디어만, JSX 복사 금지 |
| [origin-space/originui](https://github.com/origin-space/originui) | 담백한 폼·칩·테이블 | React/shadcn. 토큰·여백만 |
| [picocss/pico](https://github.com/picocss/pico) | 클래스 거의 없는 시맨틱 스타일 | 다크 토큰만 참고 |
| [open-props/open-props](https://github.com/open-props/open-props) | easing, 그림자, 컬러 스케일 | `--ease-out-5` 같은 토큰 이식 |

**쓰지 말 것 (우리 Vanilla SPA와 충돌):**  
[21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp), shadcn MCP — React+Tailwind 컴포넌트를 생성한다. 색감은 나아질 수 있어도 빌드 스택이 바뀐다.

## 4. “AI 티”를 줄이는 색·모션 규칙 (레퍼런스 보기 전에도 적용 가능)

지금 목업에서 티가 나는 이유:

- 보라↔핑크 그라데이션 버튼  
- 모든 CTA에 이모지  
- 카드마다 다른 액센트 (금/녹/보/파)  
- 글래스·글로우·pulse를 동시에 씀  

실제 프로덕트(YouTube Studio, Linear, Toss 웹)에 가깝게:

1. **액센트는 하나.** 예: 빨강(`#ff0000` 계열) 또는 차가운 블루 한 색. 황금키워드만 예외로 앰버.  
2. 배경은 순수 검정+한 단계 회색. 보라 안개 금지.  
3. 인터랙션은 **적고 물리적으로:** `:hover` 1px, `:active` scale(0.98), 칩 탭 ripple, 티커는 fade만.  
4. `prefers-reduced-motion`은 tubetrend 규칙을 유지.  
5. 이징은 `cubic-bezier(.2,.8,.2,1)` 하나.

uiverse에서 가져올 후보: **soft press 버튼**, **chip selected underline**, **skeleton shimmer**. 네온 보더 빔은 넣지 않는다.

## 5. 추천 진행 순서

1. Cursor 데스크톱에서 **Mobbin 로그인**.  
2. 에이전트에게 “Linear 설정 + YouTube Studio 분석 + Toss 검색칩” 스크린을 찾게 한다.  
3. 고른 화면 2~3장의 **색 토큰·간격·호버**만 `assets/responsive.css` / 스튜디오 CSS 변수에 반영.  
4. 인터랙션은 uiverse에서 Vanilla CSS 2~3개만.  
5. 목업 HTML(`docs/mockups/studio-*.html`)을 같은 토큰으로 갱신한 뒤 `studio.html`에 이식.

Mobbin이 막혀 있으면 Refero + uiverse로 같은 순서를 진행한다.
