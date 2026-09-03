# 🔥 YouTube Insight V6.1 (유튜브 알고리즘 역공학 및 AI 떡상 분석 툴)

> Zero-loss Filtering & Universal Viral AI Studio (Single Page Application)

YouTube Insight는 유튜브 알고리즘을 역공학하여 떡상 가능성이 높은 바이럴 영상, 트렌드, 키워드 및 블루오션 콘텐츠 갭을 실시간으로 분석해 주는 원스톱 인사이트 플랫폼입니다.

---

## 🌟 주요 기능
1. **🌐 글로벌 10개국 실시간 트렌드 센터**: 
   - 🇰🇷 대한민국, 🇺🇸 미국, 🇯🇵 일본, 🇬🇧 영국, 🇻🇳 베트남, 🇹🇭 태국, 🇹🇼 대만, 🇮🇳 인도, 🇧🇷 브라질, 🇩🇪 독일 실시간 급상승 랭킹 및 3초 롤링 티커 배너
2. **📈 알고리즘 떡상 지수 & VPH 산출**: 
   - 구독자 대비 조회수 기여도(%) 계산 및 1~6단계 바이럴 배지 (👑 신의 간택 등)
   - 시간당 조회수 폭발도(VPH) 및 '발굴된 보물' 판독
3. **🌊 콘텐츠 갭 (블루오션) 판독기 & 자동 발굴**: 
   - 수요(조회수)는 높으나 최근 공급이 부족한 틈새 시장을 딥러닝/통계로 판독
4. **✨ Gemini 2.0 Flash AI 3단계 정밀 분석**:
   - 심리적 후킹/도파민 유도 포인트 분석
   - Midjourney / Kling 썸네일 영문 프롬프트 자동 생성
   - 시청 지속 시간을 극대화하는 표준 대본 구조 추출
   - 쇼츠(Shorts) 60초 풀 대본 초안 자동 작성
5. **🏷️ 떡상 태그 Top 20 랭킹 & 1-Click 원클릭 복사**:
   - 수집된 영상들의 핵심 키워드/태그 빈도 분석 및 클립보드 복사

---

## 🔒 보안 및 데이터 프라이버시
- 본 서비스는 **순수 클라이언트 사이드(Vanilla JS SPA)**로 동작합니다.
- 입력하신 **YouTube Data API v3 Key** 및 **Google Gemini API Key**는 외부 서버로 일절 전송되지 않으며, **접속 중인 기기의 브라우저 로컬 저장소(LocalStorage)에만 안전하게 저장**됩니다.

---

## 📱 모바일 & 외부 접속 가이드
1. 배포된 웹사이트 주소(GitHub Pages URL)에 스마트폰 브라우저(Safari, Chrome, Samsung Internet 등)로 접속합니다.
2. 우측 상단 **[⚙️ API 키 설정]** 버튼을 눌러 본인의 YouTube / Gemini API 키를 1회 등록합니다.
3. **[홈 화면에 추가]** 기능을 이용하면 앱(PWA)처럼 바로가기 아이콘을 홈 화면에 두고 언제 어디서든 간편하게 실행할 수 있습니다.

---

## 공개 급등 보드 (키 없음)

루트 페이지(`/`)는 API 키 없이 한국 일일 급등 보드를 보여 줍니다. BYOK 스튜디오는 [`studio.html`](studio.html) 과 [`youtube_insight.html`](youtube_insight.html) 에 있습니다.

- 공개 URL: `/` (오늘 KR), `/keywords/`, `/shorts/`, `/vs-yesterday/`, `/jp/`, `/kr/YYYY-MM-DD/`
- 시크릿: GitHub Actions `YOUTUBE_API_KEY` (YouTube Data API v3). 프론트에 키를 넣지 않습니다.
- 갱신: `.github/workflows/refresh-radar.yml` 이 6시간마다 `videos.list`(mostPopular) + `channels.list` 만 호출해 `data/kr-latest.json` 을 커밋합니다.
- 로컬: `python3 -m http.server 8080` 후 http://127.0.0.1:8080/  (커밋된 샘플 JSON으로 렌더)
- 광고: `assets/config.js` 의 `ADSENSE_CLIENT` 가 비어 있으면 스크립트를 로드하지 않습니다. 팝언더 없음.
