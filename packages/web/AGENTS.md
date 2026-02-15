# AGENTS.md

This file provides guidance to AI agents when working with the web package.

## Communication Language

**AI agents must respond in Korean when working with this project.** All responses, explanations, and communications should be in Korean to maintain consistency with the project's primary language.

## Package Overview

`@autolink/web`는 Next.js 15 기반의 프론트엔드 웹 애플리케이션 패키지입니다. 포트 3000에서 실행됩니다.

## Architecture

- **Framework**: Next.js 15 App Router
- **Styling**: Tailwind CSS v4
- **State Management**: 
  - Zustand (클라이언트 상태)
  - TanStack Query (서버 상태)
- **Type Safety**: TypeScript strict 모드
- **API Communication**: RPC-style 타입 안전 클라이언트

## Directory Structure

```
packages/web/
├── src/
│   ├── app/             # App Router 페이지 및 레이아웃
│   ├── components/      # React 컴포넌트
│   │   ├── ui/         # 기본 UI 컴포넌트
│   │   └── auth/       # 인증 관련 컴포넌트
│   ├── hooks/           # 커스텀 React 훅
│   ├── lib/            # 유틸리티 함수
│   ├── stores/         # Zustand 스토어
│   └── types/          # 웹 전용 타입 정의
├── public/             # 정적 에셋
└── package.json
```

## Key Features

### Authentication System
- **Hooks**: `useAuth`, `useAuthQuery`
- **Components**: `LoginModal`
- **State**: `authStore` (Zustand)
- **API**: `/auth` 엔드포인트 연동

### State Management
- **Client State**: Zustand 스토어 (`stores/`)
- **Server State**: TanStack Query (`hooks/`)
- **Form State**: React Hook Form + Zod

### Styling
- **CSS Framework**: Tailwind CSS v4
- **Theme**: 커스텀 디자인 시스템 (neutral, mint, red 팔레트)
- **Components**: shadcn/ui 스타일 시스템

## Development Commands

```bash
# 개발 서버 실행
bun dev:web

# 빌드
bun run build:web

# 프로덕션 실행
bun run start:web

# 클린
bun run clean:web
```

## Conventions

### Component Structure
- **File Naming**: PascalCase (예: `LoginModal.tsx`)
- **Export**: Named export 기본
- **Types**: 컴포넌트 내부 타입은 같은 파일에 정의
- **Props**: 인터페이스로 명확하게 정의

### State Management
- **Zustand**: 클라이언트 상태 (인증, UI 상태 등)
- **TanStack Query**: 서버 상태 (API 호출, 캐싱)
- **Form**: React Hook Form + Zod 스키마

### Styling
- **Tailwind**: 유틸리티 클래스 우선
- **Components**: 재사용 가능한 UI 컴포넌트
- **Theme**: 디자인 토큰 일관성 유지

### API Integration
- **Client**: 커스텀 API 클라이언트 (`lib/api.ts`)
- **Type Safety**: 서버 `AppType`으로 타입 추론
- **Error Handling**: 일관된 에러 처리

## Path Aliases

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/hooks/*` → `src/hooks/*`
- `@/lib/*` → `src/lib/*`

## Dependencies

### Core
- `next`: Next.js 15
- `react`: React 19
- `react-dom`: React DOM

### Styling
- `tailwindcss`: v4
- `@tailwindcss/postcss`: PostCSS 플러그인
- `lucide-react`: 아이콘 라이브러리

### State & Data
- `zustand`: 클라이언트 상태 관리
- `@tanstack/react-query`: 서버 상태 관리
- `zod`: 스키마 검증

### UI Components
- `class-variance-authority`: 컴포넌트 변형
- `clsx`: 조건부 클래스
- `tailwind-merge`: 클래스 병합

## Code Quality

- **Linting**: Biome (자동 포맷팅, 린팅)
- **TypeScript**: strict 모드
- **Pre-commit**: 자동 포맷팅 및 린팅
- **Import Order**: 일관된 import 순서

## Performance

- **Bundle Optimization**: Next.js 자동 최적화
- **Image Optimization**: next/image 사용
- **Code Splitting**: 동적 import 활용
- **Caching**: TanStack Query 캐싱 전략
