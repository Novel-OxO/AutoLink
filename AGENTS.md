# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Communication Language

**AI agents must respond in Korean when working with this project.** All responses, explanations, and communications should be in Korean to maintain consistency with the project's primary language.

## Project Overview

AutoLink는 AI 기반 링크/지식 관리 플랫폼이다. pnpm 워크스페이스 모노레포 구조.

## Monorepo Packages

| 패키지               | 경로                | 역할                               |
| -------------------- | ------------------- | ---------------------------------- |
| `@autolink/server`   | `packages/server`   | NestJS 백엔드 (포트 3001)          |
| `@autolink/web`      | `packages/web`      | Next.js 15 프론트엔드 (포트 3000)  |
| `@autolink/app`      | `packages/app`      | React Native Expo 모바일 앱        |
| `@autolink/shared`   | `packages/shared`   | Zod 스키마, 타입, 상수 (tsup 빌드) |
| `@autolink/tsconfig` | `packages/tsconfig` | 공유 TypeScript 설정               |

## Commands

```bash
# 개발 서버
pnpm dev               # 전체 dev 서버 실행
pnpm dev:server        # NestJS만
pnpm dev:web           # Next.js만
pnpm dev:app           # Expo만

# 빌드/린트/테스트
pnpm build             # 전체 빌드
pnpm lint              # 전체 린트 (Biome)
pnpm lint:fix          # 린트 자동 수정
pnpm test              # 전체 테스트
pnpm format            # Biome 포맷
pnpm format:check      # 포맷 검사만

# 서버 테스트
pnpm test:server       # 서버 통합 테스트 (Docker 필요)

# E2E 테스트
pnpm test:e2e          # E2E 테스트
pnpm test:e2e:ui       # E2E 테스트 UI
pnpm test:e2e:debug    # E2E 테스트 디버그

# DB (Prisma)
pnpm db:generate       # Prisma 클라이언트 생성
pnpm db:migrate        # 마이그레이션 실행
pnpm db:push           # 스키마 푸시
pnpm db:studio         # Prisma Studio

# ERD
pnpm erd:build         # ERD 빌드
pnpm erd               # ERD 서버 실행

# 클린
pnpm clean             # 전체 클린

# 인프라
docker compose up -d    # PostgreSQL(15432) + Redis(16379)
```

## Architecture

**Server**: NestJS 기반 백엔드. `nest start --watch` 개발. Prisma ORM + PostgreSQL. Vitest 테스트 프레임워크. 환경변수는 루트 `.env.dev`/`.env.prod`에서 관리. Zod 스키마로 데이터 검증.

**Web**: Next.js 15 App Router. Tailwind CSS v4 + Zustand(클라이언트 상태) + TanStack Query(서버 상태). Vitest 테스트 프레임워크. React Testing Library로 컴포넌트 테스트. react-resizable-panels@4.6.4 사용 (Group/Panel/Separator export).

**App**: Expo + expo-router(파일 기반 라우팅) + NativeWind(Tailwind for RN) + Zustand. React Native 0.76.7 기반.

**Shared**: Zod 스키마로 전 플랫폼 검증 통일. tsup으로 CJS/ESM 듀얼 빌드. 별도 엔트리포인트: `schemas/index`, `types/index`, `constants/index`.

## Build Orchestration

Turborepo 없이 `package.json` 스크립트 체이닝으로 빌드 순서를 보장한다:

- `build:shared` → `build:consumers` 순차 실행으로 shared 패키지가 먼저 빌드
- `lint`는 `biome check .`로 루트에서 실행 (빌드 불필요). `test`는 `build:shared` 후 `--filter '*'`로 전체 병렬 실행
- `dev:all`은 `&` + `wait`로 4개 패키지 동시 실행

## Conventions

- **인프라 작업 (중요)**: 서버 실행, 데이터베이스 마이그레이션, Docker 컨테이너 시작/정지 등 인프라 관련 작업은 **반드시 사용자의 명시적 허락을 받은 후에만 수행**해야 합니다. 이러한 작업은 시스템에 영향을 줄 수 있으므로 사용자의 승인 없이 자동으로 실행할 수 없습니다.
- **API 경로 규칙**: 서버 API 엔드포인트에는 `/api` 프리픽스를 사용하지 않습니다. 모든 API 경로는 루트에서 시작합니다 (예: `/auth/me`, `/health`).
- **커밋**: Conventional Commits 필수 (commitlint 훅). subject는 소문자로 시작. 허용 스코프: `server`, `web`, `app`, `shared`, `config`, `docs`, `deps`, `ci`
- **린트/포맷**: Biome (세미콜론, 싱글쿼트, trailing comma, 100자). pre-commit 훅으로 lint-staged → `biome check --write` 자동 실행
- **쿼트 규칙**: TS/JS 문자열과 import 경로는 싱글쿼트(`'`)를 사용합니다. JSX 속성값은 더블쿼트(`"`)를 사용합니다(Biome 기본). JSON은 스펙상 더블쿼트만 사용합니다.
- **경로 별칭**: 모든 패키지에서 `@/*` → `src/*`
- **테스트**: Vitest. 파일명 `*.spec.ts`. 통합 테스트는 `test/` 디렉토리(src와 같은 레벨). `pnpm test:server`로 서버 테스트 실행
- **TypeScript**: strict 모드, ES2022 타겟
- **타입 분리**: 인터페이스/타입은 로직 파일과 분리하여 `*.types.ts` 파일에 정의. 로직 파일에서 `export type { ... }` re-export로 외부 API 유지. 단, 해당 파일 내부에서만 사용되는 private 타입은 같은 파일에 둘 수 있음

## Documentation

`docs/` 디렉토리에 상세 문서:

- `API.md` — API 엔드포인트 명세
- `PRD.md` — 제품 요구사항/로드맵
- `SCHEMA.md` — 데이터베이스 스키마
- `SPEC.md` — 기술 사양
