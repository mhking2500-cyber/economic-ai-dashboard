# Economic AI Dashboard

Next.js + Tailwind CSS + Prisma 기반의 종합 경제 AI 대시보드 초기 템플릿입니다.

## 1) 설치

```bash
cd ~/economic-ai-dashboard
npm install
```

## 2) 환경변수

`.env.example`를 `.env`로 복사 후 DB URL을 설정하세요.

```bash
cp .env.example .env
```

## 3) Prisma 준비

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 4) 실행

```bash
npm run dev
```

## 포함된 기본 구현

- 대시보드 홈 UI (`src/app/page.tsx`)
- API 라우트
  - `GET /api/market`
  - `GET /api/market/history`
  - `GET /api/news`
  - `GET|POST /api/ai-impact`
- Prisma 스키마 (`prisma/schema.prisma`)
- SEO 기본 파일 (`src/app/sitemap.ts`, `src/app/robots.ts`)

## 외부 API 연동 방식

- `.env`에 `*_API_BASE_URL`, `*_API_KEY`를 설정하면 API 라우트가 외부 호출을 우선 시도합니다.
- 외부 호출 실패 또는 키 미설정 시 자동으로 mock 데이터로 폴백됩니다.
- `POST /api/ai-impact`는 외부 AI 엔드포인트를 호출해 JSON 스키마를 검증하고, 실패 시 큐 등록(mock) 응답을 반환합니다.

## 공급자별 파서(실전)

- 주식: `FINNHUB` 지원 (`src/lib/parsers/stocks.ts`)
- 코인: `COINGECKO` 지원 (`src/lib/parsers/crypto.ts`)
- 환율: `EXCHANGERATE_HOST` 지원 (`src/lib/parsers/fx.ts`)
- 뉴스: `GNEWS` 지원 (`src/lib/parsers/news.ts`)

환경변수의 `*_PROVIDER` 값을 바꾸면 공급자별 파서가 적용됩니다.
