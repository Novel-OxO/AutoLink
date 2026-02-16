# Bun → pnpm 마이그레이션 계획

## 1. 현재 상태 분석

### 1.1 프로젝트 구조

AutoLink는 **Bun 기반 모노레포**로 5개 패키지로 구성되어 있다.

| 패키지 | 경로 | 역할 |
|--------|------|------|
| `@autolink/server` | `packages/server` | Hono 백엔드 (Bun.serve 런타임) |
| `@autolink/web` | `packages/web` | Next.js 15 프론트엔드 |
| `@autolink/app` | `packages/app` | Expo React Native 모바일 |
| `@autolink/shared` | `packages/shared` | 공유 스키마/타입 (tsup 빌드) |
| `@autolink/tsconfig` | `packages/tsconfig` | 공유 TypeScript 설정 |

### 1.2 Bun 의존 지점 목록

마이그레이션에서 변경이 필요한 모든 Bun 의존 지점을 정리한다.

#### 패키지 매니저 관련
| 위치 | 현재 (Bun) | 비고 |
|------|-----------|------|
| `bun.lock` | Bun 전용 락파일 | 삭제 후 `pnpm-lock.yaml` 생성 |
| `package.json` → `workspaces` | `["packages/*"]` | pnpm은 `pnpm-workspace.yaml` 사용 |
| `package.json` → `trustedDependencies` | Bun 전용 필드 | 삭제 (pnpm은 `pnpm.onlyBuiltDependencies` 사용) |

#### 스크립트 (`bun run`, `bun run --filter`, `bunx`)
| 파일 | 스크립트 | Bun 사용 부분 |
|------|---------|--------------|
| 루트 `package.json` | `dev` | `bun run build:shared && bun run db:generate && bun run dev:all` |
| 루트 `package.json` | `dev:all` | `bun run --filter` 4회 + `&` 병렬 실행 |
| 루트 `package.json` | `dev:server` | `bun run build:shared && bun run db:generate && bun run --filter` |
| 루트 `package.json` | `dev:web` | `bun run build:shared && bun run --filter` |
| 루트 `package.json` | `dev:app` | `bun run build:shared && bun run --filter` |
| 루트 `package.json` | `build` | `bun run` 3회 |
| 루트 `package.json` | `build:shared` | `bun run --filter` |
| 루트 `package.json` | `build:consumers` | `bun run --filter` |
| 루트 `package.json` | `test` | `bun run build:shared && bun run --filter` |
| 루트 `package.json` | `test:server` | `bun run build:shared && bun run --filter` |
| 루트 `package.json` | `test:e2e` | `cd packages/web && bun test:e2e` |
| 루트 `package.json` | `test:e2e:ui` | `cd packages/web && bun test:e2e:ui` |
| 루트 `package.json` | `test:e2e:debug` | `cd packages/web && bun test:e2e:debug` |
| 루트 `package.json` | `clean` | `bun run --filter` |
| 루트 `package.json` | `db:generate` | `bun run --filter` |
| 루트 `package.json` | `db:migrate` | `bunx prisma` |
| 루트 `package.json` | `db:push` | `bunx prisma` |
| 루트 `package.json` | `db:studio` | `bunx prisma` |
| 루트 `package.json` | `erd` | `bun run erd:build` |

#### Bun 런타임 의존
| 파일 | 내용 | 영향도 |
|------|------|--------|
| `packages/server/src/main.ts` | `Bun.serve({ fetch: app.fetch, port })` | **높음** - 서버 진입점 |
| `packages/server/package.json` | `bun --env-file=../../.env.dev --watch src/main.ts` | **높음** - dev/start 스크립트 |
| `packages/server/package.json` | `@types/bun: ^1.2.0` (devDependencies) | 낮음 - 타입 패키지 교체 |

#### Git Hooks
| 파일 | 현재 |
|------|------|
| `.husky/pre-commit` | `bunx lint-staged` |
| `.husky/commit-msg` | `bunx commitlint --edit $1` |

---

## 2. 마이그레이션 범위

### 2.1 변경 대상 파일 (총 8개)

| # | 파일 | 변경 유형 |
|---|------|----------|
| 1 | `package.json` (루트) | 스크립트 전체 수정, `trustedDependencies` 제거 |
| 2 | `packages/server/package.json` | 스크립트 수정, `@types/bun` → `@types/node` |
| 3 | `packages/server/src/main.ts` | `Bun.serve` → `@hono/node-server` |
| 4 | `.husky/pre-commit` | `bunx` → `pnpm dlx` |
| 5 | `.husky/commit-msg` | `bunx` → `pnpm dlx` |
| 6 | `pnpm-workspace.yaml` | **신규 생성** |
| 7 | `.npmrc` | **신규 생성** (선택) |
| 8 | `bun.lock` | **삭제** |

### 2.2 변경 불필요 파일

아래 항목은 Bun에 의존하지 않으므로 수정이 불필요하다.

- `packages/web/package.json` — 스크립트가 `next dev`, `next build` 등 Bun 무관
- `packages/app/package.json` — 스크립트가 `expo start` 등 Bun 무관
- `packages/shared/package.json` — 스크립트가 `tsup`, `tsup --watch` 등 Bun 무관
- `packages/tsconfig/` — 설정 파일만 존재
- `biome.jsonc` — Bun 무관
- `docker-compose.yml` — 인프라 설정
- `vitest.config.ts` (server, web) — Vitest는 Node.js 기반
- `.github/workflows/` — `npm`을 사용 중, Bun 무관
- `tsup.config.ts` — Bun 무관

---

## 3. 단계별 마이그레이션 계획

### Phase 1: 사전 준비

#### 1-1. pnpm 설치 확인
```bash
# pnpm이 없으면 설치
corepack enable
corepack prepare pnpm@latest --activate

# 버전 확인
pnpm --version
```

#### 1-2. 마이그레이션 브랜치 생성
```bash
git checkout -b chore/migrate-bun-to-pnpm
```

#### 1-3. 새 의존성 설치
```bash
# @hono/node-server 추가 (Bun.serve 대체)
# tsx 추가 (bun --watch 대체)
# dotenv-cli 추가 (bun --env-file 대체)
```

---

### Phase 2: 워크스페이스 설정

#### 2-1. `pnpm-workspace.yaml` 생성
```yaml
packages:
  - "packages/*"
```

#### 2-2. 루트 `package.json` 수정

**제거:**
- `workspaces` 필드 (pnpm은 `pnpm-workspace.yaml` 사용)
- `trustedDependencies` 필드

**추가:**
- `packageManager` 필드 (Corepack 호환)

```jsonc
{
  "packageManager": "pnpm@10.x.x",
  // "workspaces" 삭제
  // "trustedDependencies" 삭제
}
```

#### 2-3. `.npmrc` 생성 (선택)
```ini
# 호이스팅 설정 (기존 Bun 동작과 유사하게)
shamefully-hoist=true
# workspace 프로토콜 지원 (이미 workspace:* 사용 중)
link-workspace-packages=true
```

---

### Phase 3: 스크립트 마이그레이션

#### 3-1. 루트 `package.json` 스크립트 변환

```jsonc
{
  "scripts": {
    // dev
    "dev": "pnpm build:shared && pnpm db:generate && pnpm dev:all",
    "dev:all": "pnpm --filter @autolink/shared dev & pnpm --filter @autolink/server dev & pnpm --filter @autolink/web dev & pnpm --filter @autolink/app dev & wait",
    "dev:server": "pnpm build:shared && pnpm db:generate && pnpm --filter @autolink/server dev",
    "dev:web": "pnpm build:shared && pnpm --filter @autolink/web dev",
    "dev:app": "pnpm build:shared && pnpm --filter @autolink/app dev",

    // build
    "build": "pnpm build:shared && pnpm db:generate && pnpm build:consumers",
    "build:shared": "pnpm --filter @autolink/shared build",
    "build:consumers": "pnpm --filter @autolink/web build",

    // lint & format
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "format:check": "biome check --formatter-enabled=true --linter-enabled=false .",

    // test
    "test": "pnpm build:shared && pnpm --filter '*' test",
    "test:server": "pnpm build:shared && pnpm --filter @autolink/server test",
    "test:e2e": "pnpm --filter @autolink/web test:e2e",
    "test:e2e:ui": "pnpm --filter @autolink/web test:e2e:ui",
    "test:e2e:debug": "pnpm --filter @autolink/web test:e2e:debug",

    // clean
    "clean": "pnpm --filter '*' clean && rm -rf node_modules",

    // db (Prisma)
    "db:generate": "pnpm --filter @autolink/server db:generate",
    "db:migrate": "pnpm --filter @autolink/server exec prisma migrate dev && pnpm db:generate",
    "db:push": "pnpm --filter @autolink/server exec prisma db push && pnpm db:generate",
    "db:studio": "pnpm --filter @autolink/server exec prisma studio",

    // erd
    "erd:build": "sed 's/provider = \"postgresql\"/provider = \"postgresql\"\\n  url      = env(\"DATABASE_URL\")/' ./packages/server/prisma/schema.prisma > /tmp/autolink-erd-schema.prisma && DATABASE_URL=postgresql://x@localhost/x npx @liam-hq/cli erd build --input /tmp/autolink-erd-schema.prisma --format prisma",
    "erd": "pnpm erd:build && npx serve dist",

    // hooks
    "prepare": "husky"
  }
}
```

**변환 규칙 요약:**
| Bun | pnpm |
|-----|------|
| `bun run <script>` | `pnpm <script>` |
| `bun run --filter '<pkg>' <script>` | `pnpm --filter <pkg> <script>` |
| `bunx <cmd>` | `pnpm dlx <cmd>` 또는 `pnpm exec <cmd>` |
| `cd dir && bunx prisma` | `pnpm --filter <pkg> exec prisma` |

#### 3-2. Server `packages/server/package.json` 스크립트 변환

**현재:**
```json
{
  "dev": "bun --env-file=../../.env.dev --watch src/main.ts",
  "start": "bun --env-file=../../.env.dev src/main.ts",
  "start:prod": "bun --env-file=../../.env.prod src/main.ts"
}
```

**변경 후:**
```json
{
  "dev": "dotenv -e ../../.env.dev -- tsx watch src/main.ts",
  "start": "dotenv -e ../../.env.dev -- tsx src/main.ts",
  "start:prod": "dotenv -e ../../.env.prod -- node dist/main.js"
}
```

**필요 추가 devDependencies:**
- `tsx` — TypeScript 실행 + watch 모드 (`bun --watch` 대체)
- `dotenv-cli` — 환경변수 파일 로드 (`bun --env-file` 대체)

**의존성 변경:**
```diff
  "devDependencies": {
-   "@types/bun": "^1.2.0",
+   "@types/node": "^22.0.0",
+   "tsx": "^4.0.0",
+   "dotenv-cli": "^8.0.0",
  }
```

#### 3-3. Git Hooks 변환

**`.husky/pre-commit`:**
```bash
pnpm exec lint-staged
```

**`.husky/commit-msg`:**
```bash
pnpm exec commitlint --edit $1
```

> `pnpm exec`는 로컬에 설치된 바이너리를 실행한다. `lint-staged`와 `commitlint`는 이미 devDependencies에 있으므로 `pnpm dlx` 대신 `pnpm exec`가 적절하다.

---

### Phase 4: 서버 런타임 마이그레이션 (핵심)

#### 4-1. `@hono/node-server` 설치

```bash
pnpm --filter @autolink/server add @hono/node-server
```

#### 4-2. `packages/server/src/main.ts` 수정

**현재 (Bun 런타임):**
```typescript
import { createApp } from './app';
import { env } from './shared/lib/env';
import { logger } from './shared/lib/logger';
import { connectPrisma, disconnectPrisma } from './shared/lib/prisma';

async function main() {
  await connectPrisma();
  const app = createApp();

  Bun.serve({ fetch: app.fetch, port: env.SERVER_PORT });
  logger.info(`Server is running on http://localhost:${env.SERVER_PORT}`);

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
```

**변경 후 (Node.js 런타임):**
```typescript
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './shared/lib/env';
import { logger } from './shared/lib/logger';
import { connectPrisma, disconnectPrisma } from './shared/lib/prisma';

async function main() {
  await connectPrisma();
  const app = createApp();

  const server = serve({ fetch: app.fetch, port: env.SERVER_PORT });
  logger.info(`Server is running on http://localhost:${env.SERVER_PORT}`);

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    server.close();
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
```

#### 4-3. 소스 코드 내 Bun API 사용 여부 점검

`Bun.serve` 외에 `Bun.file`, `Bun.write`, `Bun.hash` 등 Bun 전용 API를 사용하는 곳이 있는지 전체 검색해야 한다.

```bash
grep -r "Bun\." packages/server/src/ --include="*.ts"
```

현재 분석 결과 `Bun.serve`만 사용 중이며, 나머지 코드는 표준 Node.js API와 라이브러리만 사용한다.

---

### Phase 5: 의존성 설치 및 락파일 생성

#### 5-1. 기존 파일 정리
```bash
# Bun 락파일 삭제
rm bun.lock

# 기존 node_modules 전체 삭제
rm -rf node_modules packages/*/node_modules
```

#### 5-2. pnpm으로 의존성 설치
```bash
pnpm install
```

이 과정에서 `pnpm-lock.yaml`이 자동 생성된다.

#### 5-3. `.gitignore` 확인

`bun.lock` 관련 항목이 있으면 `pnpm-lock.yaml`로 교체한다.

---

### Phase 6: 검증

#### 6-1. 빌드 검증
```bash
# shared 패키지 빌드
pnpm build:shared

# 전체 빌드
pnpm build
```

#### 6-2. 개발 서버 검증
```bash
# 서버 단독 실행
pnpm dev:server

# 웹 단독 실행
pnpm dev:web

# 전체 동시 실행
pnpm dev
```

#### 6-3. 테스트 실행
```bash
# 서버 테스트
pnpm test:server

# 전체 테스트
pnpm test
```

#### 6-4. DB 명령어 검증
```bash
pnpm db:generate
pnpm db:push
pnpm db:studio
```

#### 6-5. 린트 & 포맷 검증
```bash
pnpm lint
pnpm format:check
```

#### 6-6. Git Hooks 검증
```bash
# lint-staged 동작 확인 (파일 수정 후 커밋 시도)
git add .
git commit -m "test: verify hooks"

# commitlint 동작 확인 (잘못된 메시지로 테스트)
git commit --allow-empty -m "bad message"  # 실패해야 정상
git commit --allow-empty -m "chore: test commitlint"  # 성공해야 정상
```

---

## 4. 전체 변경 사항 요약 (Diff 미리보기)

### 신규 파일
```
+ pnpm-workspace.yaml
+ .npmrc (선택)
```

### 삭제 파일
```
- bun.lock
```

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `package.json` (루트) | `bun run` → `pnpm`, `bun run --filter` → `pnpm --filter`, `bunx` → `pnpm exec`, `workspaces` 유지 또는 제거, `trustedDependencies` 제거, `packageManager` 필드 추가 |
| `packages/server/package.json` | `bun --watch` → `tsx watch`, `bun --env-file` → `dotenv -e`, `@types/bun` → `@types/node` + `tsx` + `dotenv-cli` 추가 |
| `packages/server/src/main.ts` | `Bun.serve()` → `@hono/node-server`의 `serve()` |
| `.husky/pre-commit` | `bunx lint-staged` → `pnpm exec lint-staged` |
| `.husky/commit-msg` | `bunx commitlint --edit $1` → `pnpm exec commitlint --edit $1` |

### 새로 추가되는 의존성

| 패키지 | 위치 | 용도 |
|--------|------|------|
| `@hono/node-server` | `packages/server` (dependencies) | `Bun.serve` 대체 |
| `tsx` | `packages/server` (devDependencies) | `bun --watch` 대체 (TypeScript 실행) |
| `dotenv-cli` | `packages/server` (devDependencies) | `bun --env-file` 대체 |

### 제거되는 의존성

| 패키지 | 위치 |
|--------|------|
| `@types/bun` | `packages/server` (devDependencies) |

---

## 5. 리스크 및 주의사항

### 5-1. 성능 차이
- Bun은 패키지 설치 속도가 pnpm보다 빠르다. pnpm 전환 후 CI/CD 파이프라인의 설치 시간이 다소 증가할 수 있다.
- 서버 런타임이 Bun → Node.js로 변경되므로 HTTP 처리 성능에 차이가 있을 수 있다. 프로덕션 배포 전 벤치마크를 권장한다.

### 5-2. `workspace:*` 프로토콜
- pnpm은 `workspace:*` 프로토콜을 네이티브로 지원하므로 패키지 간 의존성 선언은 변경 불필요.

### 5-3. Phantom Dependencies
- pnpm은 strict한 node_modules 구조(심볼릭 링크 기반)를 사용한다. 명시적으로 선언하지 않은 의존성에 접근하는 코드가 있으면 런타임 에러가 발생할 수 있다.
- `shamefully-hoist=true` 옵션으로 완화할 수 있으나, 장기적으로는 누락된 의존성을 명시적으로 추가하는 것이 바람직하다.

### 5-4. Prisma 호환성
- Prisma는 `postinstall` 스크립트로 엔진을 생성한다. pnpm 환경에서 정상 동작하는지 `pnpm db:generate`로 반드시 확인해야 한다.

### 5-5. Expo (React Native)
- Expo는 공식적으로 pnpm 모노레포를 지원하지만 추가 설정이 필요할 수 있다. `metro.config.js`에서 워크스페이스 심볼릭 링크 해석 설정이 필요할 수 있다.

---

## 6. 작업 체크리스트

- [ ] pnpm 설치 및 버전 확인
- [ ] 마이그레이션 브랜치 생성
- [ ] `pnpm-workspace.yaml` 생성
- [ ] `.npmrc` 생성
- [ ] 루트 `package.json` 수정 (스크립트, `trustedDependencies` 제거, `packageManager` 추가)
- [ ] `packages/server/package.json` 수정 (스크립트, 의존성)
- [ ] `packages/server/src/main.ts` 수정 (`Bun.serve` → `@hono/node-server`)
- [ ] `.husky/pre-commit` 수정
- [ ] `.husky/commit-msg` 수정
- [ ] `bun.lock` 삭제
- [ ] `node_modules` 전체 삭제 후 `pnpm install`
- [ ] shared 빌드 검증 (`pnpm build:shared`)
- [ ] 전체 빌드 검증 (`pnpm build`)
- [ ] 서버 dev 실행 검증
- [ ] 웹 dev 실행 검증
- [ ] 테스트 실행 검증
- [ ] DB 명령어 검증
- [ ] Git Hooks 검증
- [ ] `.gitignore` 업데이트 확인
