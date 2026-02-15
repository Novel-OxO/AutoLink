# Web 패키지 테스트 가이드

## 테스트 환경

- **테스트 프레임워크**: Vitest
- **테스트 라이브러리**: React Testing Library
- **환경**: jsdom

## 테스트 실행

```bash
# 테스트 실행
bun test

# UI 모드로 테스트 실행
bun test:ui

# 한 번만 실행 (CI 용)
bun test:run

# 커버리지 확인
bun test:coverage
```

## 테스트 구조

```
src/__tests__/
├── setup.ts              # 테스트 설정 파일
├── lib/                  # 유틸리티 함수 테스트
│   └── api.spec.ts
├── hooks/                # 커스텀 훅 테스트
│   └── useAuth.spec.ts
├── auth/                 # 인증 관련 컴포넌트 테스트
│   └── auth-components.spec.ts
└── components/           # 컴포넌트 테스트
```

## 테스트 작성 가이드

### 1. 단위 테스트 원칙

- **독립성**: 각 테스트는 독립적으로 실행되어야 함
- **고립**: 외부 의존성은 모킹하여 처리
- **빠른 실행**: 네트워크 요청, 파일 I/O 등은 사용하지 않음

### 2. API 테스트

- `fetch` 함수를 모킹하여 네트워크 요청 없이 테스트
- 성공/실패 시나리오 모두 테스트
- 에러 핸들링 로직 검증

### 3. 훅 테스트

- `renderHook` 함수 사용
- 상태 변경 및 액션 함수 테스트
- 파생 상태 계산 로직 검증

### 4. 컴포넌트 테스트

- 사용자 상호작용 시뮬레이션
- 렌더링 결과 확인
- 상태에 따른 UI 변경 검증

## 모킹 전략

### Next.js 모듈

```typescript
// next/navigation 모킹
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));
```

### 환경 변수

```typescript
// 환경 변수 모킹
vi.mock("@/lib/env", () => ({
  env: {
    apiUrl: "http://localhost:3001",
  },
}));
```

## 커버리지 목표

- **문장 커버리지**: 80% 이상
- **분기 커버리지**: 70% 이상
- **함수 커버리지**: 80% 이상
