# 🔥 YouTube Insight V6.1 시스템 인수인계서 (Handover Guide)

> **프로젝트명**: YouTube Insight V6.1 (유튜브 알고리즘 역공학 및 AI 떡상 분석 스튜디오)  
> **배포 URL**: [https://heymybiz.github.io/youtubeinsight/](https://heymybiz.github.io/youtubeinsight/)  
> **저장소**: [https://github.com/heymybiz/youtubeinsight](https://github.com/heymybiz/youtubeinsight)  
> **작성일**: 2026-09-04  
> **아키텍처**: Single File SPA (Vanilla HTML5 / Modern CSS / JavaScript ES6+ / GitHub Pages)

---

## 📋 목차
1. [프로젝트 개요 및 목적](#1-프로젝트-개요-및-목적)
2. [시스템 아키텍처 및 보안 설계](#2-시스템-아키텍처-및-보안-설계)
3. [4대 핵심 엔진 상세 명세](#3-4대-핵심-엔진-상세-명세)
4. [파일 구조 및 소스 코드 설명](#4-파일-구조-및-소스-코드-설명)
5. [API 키 발급 및 설정 가이드](#5-api-키-발급-및-설정-가이드)
6. [모바일 및 웹 접속 가이드](#6-모바일-및-웹-접속-가이드)
7. [유지보수 및 업데이트 운영 가이드](#7-유지보수-및-업데이트-운영-가이드)

---

## 1. 프로젝트 개요 및 목적

**YouTube Insight V6.1**은 별도의 백엔드 서버 구축이나 데이터베이스 비용 없이, 브라우저 단독으로 실행되는 **유튜브 알고리즘 분석 및 AI 숏폼/롱폼 콘텐츠 기획 올인원 SaaS**입니다.

- **목적**: 
  - 유튜브 크리에이터 및 마케터가 실시간으로 대한민국 및 글로벌 10개국의 '떡상(Viral)' 영상을 즉시 발굴.
  - 대형 채널이 아닌 중소형 채널이 터뜨린 **'구독자 대비 조회수 기여도(떡상지수)'**와 **'시간당 조회수(VPH)'**를 역공학.
  - Google Gemini 2.0 Flash AI를 통해 심리적 후킹 분석, 썸네일 프롬프트, 대본 구조 추출, 60초 쇼츠 풀 대본을 5초 만에 원클릭 자동 생성.

---

## 2. 시스템 아키텍처 및 보안 설계

```
┌────────────────────────────────────────────────────────────────────────┐
│                        클라이언트 브라우저 (SPA)                         │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   LocalStorage Vault  │  │           실시간 트렌드 센터           │ │
│  │ (YouTube Key, Gemini) │  │  (10개국 롤링 티커 + 카테고리 실시간 탭) │ │
│  └──────────┬────────────┘  └───────────────────┬────────────────────┘ │
│             │                                   │                      │
│  ┌──────────▼───────────────────────────────────▼────────────────────┐ │
│  │                     핵심 연산 & 렌더링 엔진                      │ │
│  │  - 떡상지수 (Views/Subs %)  - 시간당 조회수 (VPH)                  │ │
│  │  - 블루오션 판독기 (교통신호등) - 롱폼/쇼츠 실시간 필터링           │ │
│  └──────────┬───────────────────────────────────┬────────────────────┘ │
└─────────────┼───────────────────────────────────┼──────────────────────┘
              │ (REST / JSONP)                    │ (POST API)
              ▼                                   ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│     YouTube Data API      │       │     Google Gemini API     │
│ - MostPopular (급상승 차트) │       │ - gemini-2.0-flash        │
│ - Search (키워드/채널 딥서치)│       │ - 모델 폴백 & 토큰/비용 계산 │
│ - Videos / Channels 통계   │       │ - AI 기획서 및 대본 생성    │
└───────────────────────────┘       └───────────────────────────┘
```

### 🔒 완벽한 제로 트러스트(Zero-Trust) 로컬 보안
- 사용자가 입력한 API 키(YouTube, Gemini)는 **어떠한 외부 서버나 제3자에게도 절대 전송되지 않습니다.**
- 사용자의 개인 브라우저 내부 `LocalStorage`에만 영구 보관되며, 브라우저 종료 후에도 안전하게 유지됩니다.

---

## 3. 4대 핵심 엔진 상세 명세

### ① 실시간 떡상 피드 & 트렌드 센터 (Live Trend Center)
- **접속 즉시 자동 렌더링 (Default Feed)**: 사용자가 사이트에 접속하자마자 실시간 급상승 영상 50개가 메인 화면에 즉시 로드됩니다.
- **카테고리 탭 실시간 동기화**: `[🔥 종합]`, `[🎬 예능]`, `[📰 뉴스]`, `[🎮 게임]`, `[🎵 음악]`, `[💰 재테크]`, `[🍔 먹방]`, `[📱 쇼츠]` 탭 클릭 시, 롤링 티커와 하단 메인 영상 목록이 해당 분야 떡상 영상으로 즉각 교체됩니다.
- **3단계 하이브리드 수집 파이프라인**:
  1. *1단계 (공식 API)*: `YouTube Data API v3 (chart=mostPopular)`로 실시간 1위~50위 영상 수집.
  2. *2단계 (사회적 핫이슈)*: `Google Trends RSS`로 실시간 사회 핫토픽 연동.
  3. *3단계 (스마트 Fallback)*: 국가별 시드 쿼리 + 더미 키워드(엘리베이터, 급상승 코인 등) 블랙리스트 자동 차단.

### ② 알고리즘 역공학 분석 엔진
- **떡상지수(Viral Score)**: `(영상 조회수 ÷ 채널 구독자 수) × 100`  
  - 100% 미만: 일반  
  - 100~500%: 우수 (1~5배)  
  - 500~1,000%: 떡상 (5~10배)  
  - 1,000~5,000%: 대박 (10~50배)  
  - 10,000% 이상: 👑 신의 간택 (100배+)
- **VPH (Views Per Hour)**: `조회수 ÷ 업로드 후 경과 시간` (1,000회/h 이상 시 🔥 불꽃 뱃지 부여)
- **블루오션 판독기**: 평균 업로드 경과일이 60일 이상이면서 평균 떡상지수가 400% 이상인 경우 🟢 블루오션으로 판정.

### ③ Google Gemini 2.0 Flash AI 스튜디오
- **3단계 바이럴 기획서**:
  1. *심리적 후킹 분석*: 시청자를 사로잡은 3초 도파민 호기심 포인트 추출.
  2. *썸네일 프롬프트*: 클릭률(CTR) 극대화용 Midjourney / Kling 영문 프롬프트 자동 작성.
  3. *성공 대본 구조*: 3초 후킹 ➡️ 궁금증 증폭 ➡️ 반전/결말로 이어지는 뼈대 구조 추출.
- **Full Script 자동 생성기 (Shorts)**: 추출된 대본 구조를 기반으로 내 새로운 주제를 입력하면 60초 분량의 화면 지시문 + 내레이션 풀 대본 자동 생성.
- **모델 자동 롤링(Fallback)**: `gemini-2.0-flash` ➡️ `gemini-1.5-flash` ➡️ `gemini-2.5-flash` ➡️ `gemini-2.0-flash-lite` 순차 복구.
- **실시간 토큰/비용 계산기**: 사용한 Input/Output 토큰을 실시간 집계하여 누적 달러(\$) 비용 표시.

### ④ 10개국 글로벌 트렌드 지원
- 🇰🇷 대한민국(KR), 🇺🇸 미국(US), 🇯🇵 일본(JP), 🇬🇧 영국(GB), 🇻🇳 베트남(VN), 🇹🇭 태국(TH), 🇹🇼 대만(TW), 🇮🇳 인도(IN), 🇧🇷 브라질(BR), 🇩🇪 독일(DE) 지원.

---

## 4. 파일 구조 및 소스 코드 설명

```
D:\Project\Youtubeinsight
├── index.html              # GitHub Pages 웹 서비스 메인 진입점 (최신 배포본)
├── youtube_insight.html    # 원본 소스 파일 (index.html과 100% 동일 동기화)
├── HANDOVER_GUIDE.md       # 시스템 인수인계서 (현재 문서)
├── README.md               # 프로젝트 기본 설명서 및 모바일 접속법
└── .gitignore              # Git 관리 제외 파일 목록
```

### 핵심 함수 레퍼런스 (`index.html`)

| 함수명 | 설명 |
| :--- | :--- |
| `loadTrendingFeed(cat, country)` | 실시간 급상승 영상 50개를 수집하여 메인 화면에 자동 렌더링 |
| `switchTrendCategory(cat, btn)` | 카테고리 탭 클릭 시 상단 티커와 메인 피드를 동시 실시간 전환 |
| `changeTrendCountry(country)` | 국가 선택 변경 시 10개국 실시간 트렌드로 즉시 전환 |
| `fetchData()` | 메인 키워드 또는 채널 ID를 기반으로 최대 200개 영상 딥서치 |
| `callSingleAI(id, data)` | 개별 영상 3단계 AI 바이럴 분석 실행 |
| `analyzeMultiVideos()` | 체크박스로 선택한 복수 영상들의 공통 성공 패턴 종합 분석 |
| `generateFullScript()` | 추출된 대본 뼈대에 맞춰 60초 쇼츠 풀 대본 생성 |
| `findBlueOceanKeywords()` | Gemini AI 딥러닝 기반 떡상 가능성 높은 블루오션 키워드 자동 발굴 |
| `exportToCSV()` | 현재 필터링/정렬된 영상 데이터를 UTF-8 CSV 파일로 내보내기 |

---

## 5. API 키 발급 및 설정 가이드

### 1) YouTube Data API v3 키 (무료)
1. [Google Cloud Console](https://console.cloud.google.com/) 접속 및 로그인.
2. 상단 프로젝트 선택 ➡️ [새 프로젝트] 생성.
3. [API 및 서비스] ➡️ [라이브러리] ➡️ **YouTube Data API v3** 검색 후 [사용] 클릭.
4. [사용자 인증 정보] ➡️ [사용자 인증 정보 만들기] ➡️ **API 키** 클릭 후 복사.

### 2) Google Gemini API 키 (무료)
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속.
2. **[Create API key]** 버튼 클릭 후 생성된 키 복사.

### 3) 앱에 키 등록 방법
1. 배포된 사이트([https://heymybiz.github.io/youtubeinsight/](https://heymybiz.github.io/youtubeinsight/)) 접속.
2. 우측 상단 **[⚙️ API 키 설정]** 버튼 클릭.
3. YouTube 키와 Gemini 키를 각각 붙여넣고 **[💾 키 저장하기]** 클릭.

---

## 6. 모바일 및 웹 접속 가이드

### 📱 스마트폰(모바일)에서 앱처럼 사용하는 법 (PWA 홈 화면 추가)

#### 🍏 iPhone (Safari 브라우저)
1. Safari에서 `https://heymybiz.github.io/youtubeinsight/` 접속.
2. 하단 중앙의 **[공유(네모에 위쪽 화살표)]** 아이콘 터치.
3. 메뉴에서 **[홈 화면에 추가]** 선택 ➡️ 우측 상단 **[추가]** 터치.
4. 스마트폰 홈 화면에 'YouTube Insight' 앱 아이콘이 생성되어 터치 한 번으로 즉시 실행됩니다.

#### 🤖 Android (Chrome 브라우저)
1. Chrome에서 `https://heymybiz.github.io/youtubeinsight/` 접속.
2. 우측 상단 **[메뉴(점 3개)]** 터치.
3. **[홈 화면에 추가]** 또는 **[앱 설치]** 선택.
4. 스마트폰 홈 화면에서 네이티브 앱처럼 풀스크린으로 실행됩니다.

---

## 7. 유지보수 및 업데이트 운영 가이드

### 🛠️ 코드 수정 및 깃허브 배포 절차
코드를 수정하거나 새로운 기능을 추가할 때는 아래 명령어를 PowerShell에서 순서대로 실행합니다:

```powershell
# 1. 작업 폴더로 이동
cd d:\Project\Youtubeinsight

# 2. youtube_insight.html 수정 후 index.html과 동기화
Copy-Item -Path "youtube_insight.html" -Destination "index.html" -Force

# 3. Git 커밋 및 푸시
git add .
git commit -m "feat: 업데이트 내용 요약"
git push origin main
```

- 푸시 후 약 30초~1분 이내에 GitHub Pages를 통해 전 세계 사용자에게 자동 배포됩니다.
- 브라우저에서 변경 사항이 즉시 보이지 않을 경우 `Ctrl + F5` (강력 새로고침) 또는 모바일 브라우저 캐시 삭제를 진행하시면 됩니다.

---
*문서 작성 완료: YouTube Insight V6.1 Development Team*
