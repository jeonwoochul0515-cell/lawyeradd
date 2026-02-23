# ⚖️ 변호사 광고 규정 검사기

대한변호사협회 「변호사 광고에 관한 규정」(2025.2.6. 최종개정)을 기반으로  
변호사 광고의 규정 위반 여부를 **삼단논법**으로 분석해주는 AI 앱입니다.

## 🏗️ 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18 + TypeScript + Vite |
| 백엔드 | Cloudflare Pages Functions |
| AI | Claude Sonnet (Anthropic API) |
| 개발환경 | Firebase Studio |
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
│   │   ├── ChatBubble.tsx     # 채팅 말풍선
│   │   ├── WelcomeScreen.tsx  # 시작 화면 + 예시 질문
│   │   ├── ChatInput.tsx      # 입력창
│   │   └── index.ts           # barrel export
│   ├── data/
│   │   └── regulations.ts     # 광고규정 전문 + 시스템 프롬프트
│   ├── services/
│   │   └── api.ts             # API 호출 서비스
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
├── .dev.vars                  # 로컬 환경변수 (API 키)
└── README.md
```

## 🚀 Firebase Studio에서 시작하기

### 1단계: 프로젝트 생성

Firebase Studio에서 새 프로젝트를 만들고 이 코드를 전부 넣으세요.

### 2단계: 의존성 설치

```bash
npm install
```

### 3단계: 로컬 환경변수 설정

`.dev.vars` 파일에 Anthropic API 키를 넣으세요:

```
ANTHROPIC_API_KEY=sk-ant-api03-여기에-실제-API-키
```

### 4단계: 로컬 개발 서버 실행

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

또는 GitHub 연동 시 자동 배포됩니다.

## 🔒 보안

- **API 키는 절대 클라이언트에 노출되지 않습니다.**
- 클라이언트 → `/api/chat` (Cloudflare Function) → Anthropic API 구조
- API 키는 Cloudflare 환경변수에서만 관리

## 📋 서브에이전트 구조

| # | 역할 | 파일 |
|---|------|------|
| 1 | 프로젝트 설정 | `package.json`, `vite.config.ts`, `tsconfig.json` |
| 2 | API 프록시 | `functions/api/chat.ts` |
| 3 | 규정 데이터 | `src/data/regulations.ts` |
| 4 | API 서비스 | `src/services/api.ts` |
| 5 | UI 컴포넌트 | `src/components/*.tsx` |
| 6 | 앱 컨트롤러 | `src/App.tsx` |
