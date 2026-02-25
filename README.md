# ⚖️ 변호사 광고 규정 검사기

대한변호사협회 「변호사 광고에 관한 규정」(2025.2.6. 최종개정)을 기반으로
변호사 광고의 규정 위반 여부를 **삼단논법**으로 분석해주는 AI 앱입니다.

## 🏗️ 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18 + TypeScript + Vite |
| 백엔드 | Cloudflare Pages Functions |
| AI | Claude Sonnet (Anthropic API) |
| 배포 | Cloudflare Pages |

## 📁 프로젝트 구조

```
lawyer-ad-checker/
├── functions/                  # Cloudflare Pages Functions (서버사이드)
│   └── api/
│       └── chat.ts            # API 프록시 (API 키 보호)
├── src/
│   ├── components/            # UI 컴포넌트
│   │   ├── Header.tsx         # 상단 헤더
│   │   ├── ChatBubble.tsx     # 채팅 말풍선 (마크다운 렌더링)
│   │   ├── WelcomeScreen.tsx  # 시작 화면 + 예시 질문
│   │   ├── ChatInput.tsx      # 입력창
│   │   └── index.ts           # barrel export
│   ├── data/
│   │   └── regulations.ts     # 광고규정 전문 + 시스템 프롬프트
│   ├── services/
│   │   └── api.ts             # API 호출 서비스 (재시도 로직 포함)
│   ├── styles/
│   │   └── global.css         # 글로벌 스타일
│   ├── types/
│   │   └── index.ts           # TypeScript 타입 정의
│   ├── App.tsx                # 메인 앱 컨트롤러
│   ├── main.tsx               # 엔트리 포인트
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.functions.json
├── vite.config.ts
├── wrangler.toml
└── .dev.vars                  # 로컬 환경변수 (API 키)
```

## 🚀 시작하기

### 1단계: 의존성 설치

```bash
npm install
```

### 2단계: 환경변수 설정

`.dev.vars` 파일을 생성하고 Anthropic API 키를 설정하세요:

```
ANTHROPIC_API_KEY=sk-ant-api03-여기에-실제-API-키
```

> `.env.example` 파일을 참고하세요.

### 3단계: 로컬 개발 서버 실행

터미널 2개를 사용합니다:

```bash
# 터미널 1: Vite 프론트엔드 (포트 5173)
npm run dev

# 터미널 2: Cloudflare Pages Functions (포트 8788)
npm run pages:dev
```

또는 빌드 후 통합 실행:

```bash
npm run build
npm run pages:dev
```

## ☁️ Cloudflare Pages 배포

### 1단계: Cloudflare 계정 준비

1. [Cloudflare](https://dash.cloudflare.com/) 계정 생성
2. Wrangler CLI 로그인: `npx wrangler login`

### 2단계: 환경변수 설정

Cloudflare Dashboard에서:
1. **Pages** → 프로젝트 선택
2. **Settings** → **Environment variables**
3. `ANTHROPIC_API_KEY` 추가 (Production + Preview 모두)

### 3단계: 배포

```bash
npm run pages:deploy
```

## 🔒 보안

- **API 키는 절대 클라이언트에 노출되지 않습니다.**
- 클라이언트 → `/api/chat` (Cloudflare Function) → Anthropic API 구조
- API 키는 Cloudflare 환경변수에서만 관리
- 요청 입력 길이 제한 및 CORS 정책 적용

## 📜 주요 기능

- **삼단논법 분석**: 대전제(법) → 소전제(행위) → 결론 구조로 명확한 판단
- **마크다운 렌더링**: AI 응답을 보기 좋은 형식으로 표시
- **대화 히스토리 저장**: 새로고침해도 대화 내용 유지 (LocalStorage)
- **네트워크 재시도**: API 호출 실패 시 자동 재시도
- **반응형 디자인**: 모바일/데스크톱 최적화
