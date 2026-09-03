# UI 레퍼런스

반응형·접근성 개선에 참고한 오픈소스입니다. 전체 프로젝트를 그대로 설치하지 않고, **Vanilla JS SPA와 호환되는 CSS 패턴만** `assets/responsive.css`에 반영했습니다.

## 적용함

### [mbparks/YouTubeLedger](https://github.com/mbparks/YouTubeLedger)
- 단일 HTML + YouTube Data API v3 (우리 스튜디오와 구조 유사)
- 참고한 패턴: `flex-wrap`, `repeat(auto-fit, minmax(...))`, `clamp()` 타이포, 가로 스크롤 가능한 표/차트 영역

### [fo0/tubetrend](https://github.com/fo0/tubetrend)
- YouTube 트렌드 분석 도구 (React/Tailwind — UI 패턴만 차용)
- 참고한 패턴: 다크 스크롤바, `:focus-visible`, `prefers-reduced-motion`

## 설치하지 않은 이유

| 레포 | 이유 |
|------|------|
| hrithikBiswas/Analytics-Dashboard | Next.js + Tailwind — 빌드 스택 전환 필요 |
| makara4code/next-shadcn-dashboard | shadcn/React — 스튜디오 Vanilla JS와 불일치 |
| uzicodes/Stats-Tube | Next.js App Router — 동일 |

## 로컬에서 레퍼런스 클론 (선택)

```bash
git clone --depth 1 https://github.com/mbparks/YouTubeLedger.git /tmp/YouTubeLedger
git clone --depth 1 https://github.com/fo0/tubetrend.git /tmp/tubetrend
```

## 우리 쪽 반영 파일

- `assets/responsive.css` — 스튜디오 + 공개 보드 공통 반응형
- `assets/radar.css` — 기존 640px 규칙 유지, `responsive.css`와 함께 로드
