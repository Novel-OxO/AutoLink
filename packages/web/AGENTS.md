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
│   ├── features/        # 기능 단위 모듈
│   │   └── auth/       # 인증 기능 (components/hooks/stores/index)
│   ├── components/      # 공용 React 컴포넌트
│   │   └── ui/         # 기본 UI 컴포넌트
│   ├── lib/            # 유틸리티 함수
│   └── types/          # 웹 전용 타입 정의
├── public/             # 정적 에셋
└── package.json
```

## Key Features

### Authentication System

- **Feature Module**: `src/features/auth`
- **Hooks**: `useAuth`, `useAuthQuery`
- **Components**: `LoginModal`
- **State**: `auth.store` (Zustand)
- **API**: `/auth` 엔드포인트 연동

### State Management

- **Client State**: Zustand 스토어 (feature 내부)
- **Server State**: TanStack Query (feature 내부)
- **Form State**: React Hook Form + Zod

### Feature Organization

- 기능 전용 로직은 `src/features/{feature}` 아래에 배치
- feature 내부에서 `components`, `hooks`, `stores`, `index.ts`로 구성
- 외부 사용은 가능하면 `@/features/{feature}` 배럴 export를 우선 사용

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

### Quote Rules

- **TS/JS 문자열 및 import 경로**: 싱글쿼트(`'`) 사용
- **JSX 속성값**: 더블쿼트(`"`) 사용 (Biome 기본)
- **JSON**: 스펙상 더블쿼트만 사용

## Path Aliases

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/features/*` → `src/features/*`
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

### Performance

- **Bundle Optimization**: Next.js 자동 최적화
- **Image Optimization**: next/image 사용
- **Code Splitting**: 동적 import 활용
- **Caching**: TanStack Query 캐싱 전략

## Development Guidelines

### Performance Optimization

**사용자가 명시적으로 요청하지 않은 한, 불필요한 최적화 코드를 추가하지 마세요.**

- **useMemo/useCallback**: 성능 문제가 실제로 발생했거나 사용자가 명시적으로 요청한 경우에만 사용
- **단순 계산**: 기본적인 객체 찾기, 간단한 조건문 등에는 최적화 적용하지 않음
- **가독성 우선**: 불필요한 최적화로 코드 가독성을 해치지 않음
- **실제 측정 기반**: 성능 최적화는 실제 성능 측정 데이터를 기반으로 결정
