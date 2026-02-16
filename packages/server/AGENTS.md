# AGENTS.md

This file provides guidance to AI agents when working with the server package.

## Communication Language

**AI agents must respond in Korean when working with this project.** All responses, explanations, and communications should be in Korean to maintain consistency with the project's primary language.

## Package Overview

`@autolink/server`는 Hono 기반의 백엔드 서버 패키지입니다. 포트 3001에서 실행됩니다.

## Architecture

- **Framework**: Hono (함수형 패턴)
- **Development**: `bun --watch`로 핫 리로드 개발
- **Database**: Prisma ORM + PostgreSQL(pgvector 확장)
- **Cache/Queue**: Redis (Bull 큐)
- **Authentication**: OAuth(Google/Apple) + 세션 기반 인증
- **Environment**: 루트 `.env.dev`/`.env.prod`에서 Zod 스키마로 검증·로드
- **Validation**: `@hono/zod-validator`로 `@autolink/shared` Zod 스키마 직접 활용
- **Type Safety**: `AppType` export로 RPC 클라이언트 타입 추론 지원

## Directory Structure

```
packages/server/
├── src/
│   ├── routes/          # API 라우트 핸들러
│   ├── middleware/      # Hono 미들웨어
│   ├── services/        # 비즈니스 로직
│   ├── lib/            # 유틸리티 함수
│   └── types/          # 서버 전용 타입 정의
├── prisma/             # 데이터베이스 스키마
├── test/               # 통합 테스트
└── package.json
```

## API Rules

- **No `/api` prefix**: 모든 API 엔드포인트는 루트에서 시작합니다 (예: `/auth/me`, `/health`)
- **Validation**: `@autolink/shared`의 Zod 스키마를 사용하여 요청/응답 검증
- **Error Handling**: 일관된 에러 응답 형식 사용
- **Session Management**: 세션 기반 인증 구현

## Development Commands

```bash
# 개발 서버 실행
bun dev:server

# 빌드
bun run build:server

# 테스트
bun run test:server

# 데이터베이스 관련
bun run db:generate    # Prisma 클라이언트 생성
bun run db:migrate     # 마이그레이션 실행
bun run db:push        # 스키마 푸시
bun run db:studio      # Prisma Studio
```

## Conventions

- **Route Handlers**: 함수형 패턴으로 작성, 명확한 반환 타입 지정
- **Error Handling**: Hono의 내장 에러 핸들러 활용, 일관된 에러 형식
- **Database**: Prisma를 통한 모든 DB 접근, 타입 안전성 보장
- **Environment**: `src/shared/lib/env.ts`에서 환경변수 검증 후 사용
- **쿼트 규칙**: TS/JS 문자열과 import 경로는 싱글쿼트(`'`)를 사용합니다. JSX 속성값은 더블쿼트(`"`)를 사용합니다(Biome 기본). JSON은 스펙상 더블쿼트만 사용합니다.
- **Testing**: 통합 테스트는 `test/` 디렉토리에 작성

## Infrastructure Guidelines

**중요**: 인프라 관련 작업(서버 실행, DB 마이그레이션, Docker 컨테이너 시작/정지 등)은 반드시 사용자의 명시적 허락을 받은 후에만 수행해야 합니다.

## Dependencies

- `@autolink/shared`: 공유 스키마 및 타입
- `@hono/zod-validator`: Zod 통합
- `prisma`: ORM
- `@prisma/client`: DB 클라이언트
- `redis`: Redis 클라이언트
- `bull`: 큐 관리

## Testing

- 단위 테스트: `*.spec.ts` 파일
- 통합 테스트: `test/` 디렉토리
- 테스트 실행: `bun run test:server`
- Docker 환경 필요 (PostgreSQL + Redis)
