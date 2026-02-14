# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoLink는 AI 기반 링크/지식 관리 플랫폼이다. pnpm 워크스페이스 + Turborepo 모노레포 구조.

## Monorepo Packages

| 패키지                    | 경로                     | 역할                               |
| ------------------------- | ------------------------ | ---------------------------------- |
| `@autolink/server`        | `packages/server`        | Hono 백엔드 (포트 3001)            |
| `@autolink/web`           | `packages/web`           | Next.js 15 프론트엔드 (포트 3000)  |
| `@autolink/app`           | `packages/app`           | React Native Expo 모바일 앱        |
| `@autolink/shared`        | `packages/shared`        | Zod 스키마, 타입, 상수 (tsup 빌드) |
| `@autolink/tsconfig`      | `packages/tsconfig`      | 공유 TypeScript 설정               |
| `@autolink/eslint-config` | `packages/eslint-config` | 공유 ESLint 설정                   |

## Commands

```bash
# 개발 서버
pnpm dev                # 전체 dev 서버 실행
pnpm dev:server         # Hono만
pnpm dev:web            # Next.js만
pnpm dev:app            # Expo만

# 빌드/린트/테스트
pnpm build              # 전체 빌드
pnpm lint               # 전체 린트
pnpm test               # 전체 테스트
pnpm format             # Prettier 포맷
pnpm format:check       # 포맷 검사만

# 단일 패키지 실행
pnpm --filter @autolink/server test       # 서버 테스트만
pnpm --filter @autolink/server test -- --testPathPattern=auth  # 특정 테스트

# DB (Prisma)
pnpm db:generate        # Prisma 클라이언트 생성
pnpm db:migrate         # 마이그레이션 실행
pnpm db:push            # 스키마 푸시
pnpm db:studio          # Prisma Studio

# 인프라
docker compose up -d    # PostgreSQL(15432) + Redis(16379)
```

## Architecture

**Server**: Hono 함수형 패턴. tsup 빌드 + tsx watch 개발. Prisma ORM + PostgreSQL(pgvector) + Redis(Bull 큐). OAuth(Google/Apple) + 세션 기반 인증. 환경변수는 루트 `.env`에서 Zod 스키마(`src/lib/env.ts`)로 검증·로드. `@hono/zod-validator`로 `@autolink/shared` Zod 스키마 직접 활용. `AppType` export로 RPC 클라이언트 타입 추론 지원.

**Web**: Next.js 15 App Router. Tailwind CSS v4 + Zustand(클라이언트 상태) + TanStack Query(서버 상태).

**App**: Expo + expo-router(파일 기반 라우팅) + NativeWind(Tailwind for RN) + Zustand.

**Shared**: Zod 스키마로 전 플랫폼 검증 통일. tsup으로 CJS/ESM 듀얼 빌드. 별도 엔트리포인트: `schemas/index`, `types/index`, `constants/index`.

## Turbo Task Dependencies

`build`/`dev`/`lint`/`test` 모두 `db:generate`에 의존. shared 패키지가 먼저 빌드되어야 다른 패키지가 빌드 가능(`^build` 의존성).

## Conventions

- **커밋**: Conventional Commits 필수 (commitlint 훅). 허용 스코프: `server`, `web`, `app`, `shared`, `config`, `docs`, `deps`, `ci`
- **포맷**: Prettier (세미콜론, 싱글쿼트, trailing comma, 100자). pre-commit 훅으로 lint-staged 자동 실행
- **경로 별칭**: 모든 패키지에서 `@/*` → `src/*`
- **테스트**: Jest + ts-jest. 파일명 `*.spec.ts`. rootDir은 `src/`
- **TypeScript**: strict 모드, ES2022 타겟

## Documentation

`docs/` 디렉토리에 상세 문서:

- `API.md` — API 엔드포인트 명세
- `PRD.md` — 제품 요구사항/로드맵
- `SCHEMA.md` — 데이터베이스 스키마
- `SPEC.md` — 기술 사양
