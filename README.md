# 🔍 변호사 광고 규정 모니터링 시스템

온라인상의 변호사 광고를 자동 크롤링하고,
대한변호사협회 광고규정 위반 여부를 AI로 탐지하여 보고서를 생성하는 시스템입니다.

## 🏗️ 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18 + TypeScript + Vite |
| 백엔드 | Cloudflare Pages Functions |
| AI | Claude Sonnet (Anthropic API) |
| 검색 | 네이버 블로그 검색 API |
| 배포 | Cloudflare Pages |

## 💰 비용 구조

1차 키워드 필터로 API 비용 80% 절감:
- 100페이지 중 의심 키워드 있는 ~20페이지만 AI 호출
- Claude API: 월 $15~30 (2~4만원)
- 네이버 API: 무료 (25,000건/일)
- Cloudflare: 무료 티어

## 📁 프로젝트 구조

```
lawyer-ad-monitor/
├── functions/api/           # Cloudflare Pages Functions
│   ├── search.ts           # 네이버 검색 API 프록시
│   ├── crawl.ts            # URL → 텍스트 추출
│   ├── analyze.ts          # 키워드 필터 + AI 분석
│   └── scan.ts             # crawl + analyze 통합
├── src/
│   ├── components/
│   │   ├── ScannerPanel.tsx # URL/키워드 입력 + 배치 스캔
│   │   ├── ResultsPanel.tsx # 결과 목록 + 필터 + 상세
│   │   └── ReportPanel.tsx  # 보고서 생성 + 내보내기
│   ├── services/api.ts      # 프론트엔드 API 호출
│   ├── data/constants.ts    # 설정값, 키워드 등
│   ├── types/index.ts       # TypeScript 타입
│   ├── styles/global.css
│   ├── App.tsx              # 메인 대시보드
│   └── main.tsx
├── .dev.vars                # 로컬 환경변수
└── wrangler.toml
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.dev.vars` 파일 수정:
```
ANTHROPIC_API_KEY=sk-ant-api03-실제키

# 선택: 네이버 API (없으면 URL 직접입력만 가능)
NAVER_CLIENT_ID=네이버ID
NAVER_CLIENT_SECRET=네이버시크릿
```

네이버 API 키 발급: https://developers.naver.com/apps/

### 3. 로컬 실행
```bash
# 프론트엔드
npm run dev

# 별도 터미널에서 Cloudflare Functions
npm run pages:dev
```

### 4. 배포
```bash
npm run pages:deploy
```

Cloudflare Dashboard에서 환경변수 설정 필수!

## 🔒 보안

- API 키는 서버사이드(Cloudflare)에서만 관리
- 클라이언트에 API 키 노출 없음

## 📜 주요 기능

- **자동 크롤링**: URL 입력 또는 키워드 검색으로 광고 페이지 수집
- **2단계 분석**: 키워드 필터(1차) + AI 정밀 분석(2차)으로 비용 최적화
- **삼단논법 보고**: 대전제→소전제→결론 형식의 위반 분석
- **보고서 생성**: TXT/CSV 형식으로 내보내기
- **배치 스캔**: 검색 결과 일괄 분석
