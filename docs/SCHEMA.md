# AutoLink — DB 스키마 명세서

---

## 1. User (사용자)

### 테이블: `users`

| 컬럼          | 타입          | 제약조건                 | 설명                                           |
| ------------- | ------------- | ------------------------ | ---------------------------------------------- |
| id            | Int           | PK, Auto Increment       | 사용자 고유 ID                                 |
| email         | String        | Unique, Not Null         | 이메일 주소                                    |
| nickname      | String        | Not Null                 | 닉네임                                         |
| profileImage  | String        | Nullable                 | 프로필 이미지 URL (OAuth 제공자 프로필 이미지) |
| locale        | Locale (Enum) | Not Null, Default: KO    | 사용자 언어 설정 (KO, EN)                      |
| profilePublic | Boolean       | Not Null, Default: false | 프로필 공개 여부                               |
| createdAt     | DateTime      | Not Null, Default: now() | 가입일시                                       |
| updatedAt     | DateTime      | Not Null, Auto Update    | 최종 수정일시                                  |
| deletedAt     | DateTime      | Nullable                 | 탈퇴일시 (null이면 활성, 값이 있으면 탈퇴)     |

### 인덱스

| 인덱스          | 컬럼  | 타입   |
| --------------- | ----- | ------ |
| users_email_key | email | Unique |

### Soft Delete 정책

- `deletedAt`이 `null` → 활성 유저
- `deletedAt`에 값이 있음 → 탈퇴 유저
- 조회 시 `deletedAt IS NULL` 조건으로 필터링

---

## 2. OAuth (소셜 인증)

### 테이블: `oauths`

| 컬럼       | 타입                 | 제약조건                 | 설명                        |
| ---------- | -------------------- | ------------------------ | --------------------------- |
| id         | Int                  | PK, Auto Increment       | OAuth 레코드 고유 ID        |
| userId     | Int                  | FK → users.id, Not Null  | 연결된 사용자 ID            |
| provider   | OAuthProvider (Enum) | Not Null                 | 인증 제공자 (GOOGLE, APPLE) |
| providerId | String               | Not Null                 | 제공자 측 유저 고유 ID      |
| createdAt  | DateTime             | Not Null, Default: now() | 연동일시                    |

### Enum: OAuthProvider

| 값     | 설명          |
| ------ | ------------- |
| GOOGLE | Google OAuth  |
| APPLE  | Apple Sign In |

### 인덱스

| 인덱스                         | 컬럼                   | 타입   |
| ------------------------------ | ---------------------- | ------ |
| oauths_provider_providerId_key | (provider, providerId) | Unique |
| oauths_userId_idx              | userId                 | Index  |

### 외래키

| FK                | 참조     | 삭제 정책                                     |
| ----------------- | -------- | --------------------------------------------- |
| userId → users.id | users.id | Cascade (유저 삭제 시 OAuth 레코드 함께 삭제) |

---

## 3. Translation (번역)

### 테이블: `translations`

| 컬럼      | 타입          | 제약조건                 | 설명                                                   |
| --------- | ------------- | ------------------------ | ------------------------------------------------------ |
| id        | Int           | PK, Auto Increment       | 번역 레코드 고유 ID                                    |
| key       | String        | Not Null                 | 번역 키 (예: `auth.login.title`, `error.unauthorized`) |
| locale    | Locale (Enum) | Not Null                 | 언어 코드 (KO, EN)                                     |
| value     | String        | Not Null                 | 번역된 텍스트                                          |
| createdAt | DateTime      | Not Null, Default: now() | 생성일시                                               |
| updatedAt | DateTime      | Not Null, Auto Update    | 최종 수정일시                                          |

### Enum: Locale

| 값  | 설명   |
| --- | ------ |
| KO  | 한국어 |
| EN  | 영어   |

### 인덱스

| 인덱스                      | 컬럼          | 타입   |
| --------------------------- | ------------- | ------ |
| translations_key_locale_key | (key, locale) | Unique |
| translations_locale_idx     | locale        | Index  |

### 번역 폴백 정책

- 요청된 locale의 번역이 없으면 → 기본 언어(KO)의 값을 반환
- 기본 언어의 값도 없으면 → key 자체를 그대로 반환

---

## 4. Folder (폴더)

### 테이블: `folders`

| 컬럼       | 타입              | 제약조건                   | 설명                           |
| ---------- | ----------------- | -------------------------- | ------------------------------ |
| id         | Int               | PK, Auto Increment         | 폴더 고유 ID                   |
| userId     | Int               | FK → users.id, Not Null    | 폴더 소유자                    |
| parentId   | Int               | FK → folders.id, Nullable  | 상위 폴더 ID (null이면 최상위) |
| name       | String            | Not Null                   | 폴더 이름                      |
| isDocked   | Boolean           | Not Null, Default: false   | DOCK 고정 여부                 |
| visibility | Visibility (Enum) | Not Null, Default: PRIVATE | 공개 범위                      |
| shareToken | String            | Unique, Nullable           | 폴더 공유용 토큰               |
| createdAt  | DateTime          | Not Null, Default: now()   | 생성일시                       |
| updatedAt  | DateTime          | Not Null, Auto Update      | 최종 수정일시                  |

### Enum: Visibility

| 값      | 설명            |
| ------- | --------------- |
| PRIVATE | 비공개 (기본값) |
| PUBLIC  | 공개            |

### 인덱스

| 인덱스                 | 컬럼       | 타입   |
| ---------------------- | ---------- | ------ |
| folders_userId_idx     | userId     | Index  |
| folders_parentId_idx   | parentId   | Index  |
| folders_shareToken_key | shareToken | Unique |

### 외래키

| FK                    | 참조       | 삭제 정책                                 |
| --------------------- | ---------- | ----------------------------------------- |
| userId → users.id     | users.id   | Cascade                                   |
| parentId → folders.id | folders.id | SetNull (상위 폴더 삭제 시 최상위로 이동) |

---

## 5. Link (링크)

### 테이블: `links`

| 컬럼           | 타입               | 제약조건                   | 설명                               |
| -------------- | ------------------ | -------------------------- | ---------------------------------- |
| id             | Int                | PK, Auto Increment         | 링크 고유 ID                       |
| userId         | Int                | FK → users.id, Not Null    | 링크 소유자                        |
| folderId       | Int                | FK → folders.id, Nullable  | 소속 폴더 (null이면 미분류)        |
| url            | String             | Not Null                   | 원본 URL                           |
| ogTitle        | String             | Nullable                   | OG 제목                            |
| ogDescription  | String             | Nullable                   | OG 설명                            |
| ogImage        | String             | Nullable                   | OG 썸네일 URL                      |
| summary        | String             | Nullable                   | AI 자동 요약                       |
| memo           | String             | Nullable                   | 사용자 메모                        |
| crawlStatus    | CrawlStatus (Enum) | Not Null, Default: PENDING | 크롤링 상태                        |
| visibility     | Visibility (Enum)  | Not Null, Default: PRIVATE | 공개 범위                          |
| readAt         | DateTime           | Nullable                   | 마지막 열람 시각 (null이면 미읽음) |
| contentUpdated | Boolean            | Not Null, Default: false   | 원본 콘텐츠 변경 감지 여부         |
| createdAt      | DateTime           | Not Null, Default: now()   | 저장일시                           |
| updatedAt      | DateTime           | Not Null, Auto Update      | 최종 수정일시                      |
| deletedAt      | DateTime           | Nullable                   | 삭제일시 (휴지통, null이면 활성)   |

### Enum: CrawlStatus

| 값         | 설명           |
| ---------- | -------------- |
| PENDING    | 크롤링 대기    |
| PROCESSING | 크롤링 진행 중 |
| COMPLETED  | 크롤링 완료    |
| FAILED     | 크롤링 실패    |

### 인덱스

| 인덱스               | 컬럼          | 타입   |
| -------------------- | ------------- | ------ |
| links_userId_idx     | userId        | Index  |
| links_folderId_idx   | folderId      | Index  |
| links_userId_url_key | (userId, url) | Unique |
| links_deletedAt_idx  | deletedAt     | Index  |
| links_createdAt_idx  | createdAt     | Index  |

### 외래키

| FK                    | 참조       | 삭제 정책                            |
| --------------------- | ---------- | ------------------------------------ |
| userId → users.id     | users.id   | Cascade                              |
| folderId → folders.id | folders.id | SetNull (폴더 삭제 시 미분류로 이동) |

### Soft Delete 정책 (휴지통)

- `deletedAt`이 `null` → 활성 링크
- `deletedAt`에 값이 있음 → 휴지통 상태
- `deletedAt` 기준 30일 경과 시 Cron으로 영구 삭제

---

## 6. Tag (태그)

### 테이블: `tags`

| 컬럼      | 타입     | 제약조건                 | 설명                           |
| --------- | -------- | ------------------------ | ------------------------------ |
| id        | Int      | PK, Auto Increment       | 태그 고유 ID                   |
| name      | String   | Unique, Not Null         | 태그 이름 (예: NestJS, Docker) |
| createdAt | DateTime | Not Null, Default: now() | 생성일시                       |

### 인덱스

| 인덱스        | 컬럼 | 타입   |
| ------------- | ---- | ------ |
| tags_name_key | name | Unique |

---

## 7. LinkTag (링크-태그 관계)

### 테이블: `link_tags`

| 컬럼      | 타입     | 제약조건                 | 설명         |
| --------- | -------- | ------------------------ | ------------ |
| id        | Int      | PK, Auto Increment       | 관계 고유 ID |
| linkId    | Int      | FK → links.id, Not Null  | 링크 ID      |
| tagId     | Int      | FK → tags.id, Not Null   | 태그 ID      |
| createdAt | DateTime | Not Null, Default: now() | 태깅일시     |

### 인덱스

| 인덱스                     | 컬럼            | 타입   |
| -------------------------- | --------------- | ------ |
| link_tags_linkId_tagId_key | (linkId, tagId) | Unique |
| link_tags_linkId_idx       | linkId          | Index  |
| link_tags_tagId_idx        | tagId           | Index  |

### 외래키

| FK                | 참조     | 삭제 정책                               |
| ----------------- | -------- | --------------------------------------- |
| linkId → links.id | links.id | Cascade (링크 삭제 시 태그 관계도 삭제) |
| tagId → tags.id   | tags.id  | Cascade (태그 삭제 시 관계도 삭제)      |

---

## Phase 1 — 개인 지식 베이스 (RAG)

---

## 8. LinkEmbedding (링크 임베딩)

### 테이블: `link_embeddings`

링크 본문을 청크 단위로 분할하여 벡터 임베딩을 저장한다. 시맨틱 검색과 RAG 질의응답의 핵심 테이블이다.

| 컬럼       | 타입         | 제약조건                 | 설명                                                 |
| ---------- | ------------ | ------------------------ | ---------------------------------------------------- |
| id         | Int          | PK, Auto Increment       | 임베딩 레코드 고유 ID                                |
| linkId     | Int          | FK → links.id, Not Null  | 원본 링크 ID                                         |
| chunkIndex | Int          | Not Null                 | 청크 순서 (0부터 시작)                               |
| chunkText  | String       | Not Null                 | 임베딩된 텍스트 청크 원문                            |
| embedding  | vector(1536) | Not Null                 | 벡터 임베딩 (pgvector, OpenAI ada-002 기준 1536차원) |
| createdAt  | DateTime     | Not Null, Default: now() | 생성일시                                             |

### 인덱스

| 인덱스                                | 컬럼                 | 타입                      |
| ------------------------------------- | -------------------- | ------------------------- |
| link_embeddings_linkId_chunkIndex_key | (linkId, chunkIndex) | Unique                    |
| link_embeddings_linkId_idx            | linkId               | Index                     |
| link_embeddings_embedding_idx         | embedding            | HNSW (벡터 유사도 검색용) |

### 외래키

| FK                | 참조     | 삭제 정책                            |
| ----------------- | -------- | ------------------------------------ |
| linkId → links.id | links.id | Cascade (링크 삭제 시 임베딩도 삭제) |

### 청크 분할 정책

- 본문을 500~1000 토큰 단위로 분할하며, 청크 간 100토큰 오버랩을 둔다
- 크롤링 완료(`crawlStatus = COMPLETED`) 후 임베딩이 생성된다
- 재크롤링 시 기존 임베딩을 삭제하고 새로 생성한다

---

## 9. Conversation (대화)

### 테이블: `conversations`

RAG 질의응답 대화 세션을 관리한다.

| 컬럼      | 타입     | 제약조건                 | 설명                                         |
| --------- | -------- | ------------------------ | -------------------------------------------- |
| id        | Int      | PK, Auto Increment       | 대화 고유 ID                                 |
| userId    | Int      | FK → users.id, Not Null  | 대화 소유자                                  |
| title     | String   | Nullable                 | 대화 제목 (미입력 시 첫 질문 기반 자동 생성) |
| createdAt | DateTime | Not Null, Default: now() | 생성일시                                     |
| updatedAt | DateTime | Not Null, Auto Update    | 최종 수정일시                                |

### 인덱스

| 인덱스                   | 컬럼   | 타입  |
| ------------------------ | ------ | ----- |
| conversations_userId_idx | userId | Index |

### 외래키

| FK                | 참조     | 삭제 정책                          |
| ----------------- | -------- | ---------------------------------- |
| userId → users.id | users.id | Cascade (유저 삭제 시 대화도 삭제) |

---

## 10. Message (메시지)

### 테이블: `messages`

대화 내 개별 메시지를 저장한다. 사용자 질문과 AI 답변 모두 포함한다.

| 컬럼           | 타입               | 제약조건                        | 설명                                                       |
| -------------- | ------------------ | ------------------------------- | ---------------------------------------------------------- |
| id             | Int                | PK, Auto Increment              | 메시지 고유 ID                                             |
| conversationId | Int                | FK → conversations.id, Not Null | 소속 대화 ID                                               |
| role           | MessageRole (Enum) | Not Null                        | 발신자 역할 (USER, ASSISTANT)                              |
| content        | String             | Not Null                        | 메시지 본문                                                |
| sources        | Json               | Nullable                        | AI 답변의 참고 출처 (linkId, ogTitle, url, highlight 배열) |
| feedback       | Feedback (Enum)    | Nullable                        | 사용자 피드백 (UP, DOWN, null)                             |
| createdAt      | DateTime           | Not Null, Default: now()        | 생성일시                                                   |

### Enum: MessageRole

| 값        | 설명        |
| --------- | ----------- |
| USER      | 사용자 질문 |
| ASSISTANT | AI 답변     |

### Enum: Feedback

| 값   | 설명   |
| ---- | ------ |
| UP   | 좋아요 |
| DOWN | 싫어요 |

### 인덱스

| 인덱스                      | 컬럼           | 타입  |
| --------------------------- | -------------- | ----- |
| messages_conversationId_idx | conversationId | Index |

### 외래키

| FK                                | 참조             | 삭제 정책                            |
| --------------------------------- | ---------------- | ------------------------------------ |
| conversationId → conversations.id | conversations.id | Cascade (대화 삭제 시 메시지도 삭제) |

### sources JSON 구조

```json
[
  {
    "linkId": 1,
    "ogTitle": "NestJS Custom Guard 만들기",
    "url": "https://example.com/article",
    "highlight": "CanActivate 인터페이스를 구현하면..."
  }
]
```

- `role = USER`인 메시지는 `sources`와 `feedback`이 항상 null
- `role = ASSISTANT`인 메시지만 `sources`를 가지며, `feedback`을 받을 수 있다

---

## Phase 2 — 학습 가속기

---

## 11. WeeklyReview (주간 회고)

### 테이블: `weekly_reviews`

주간 학습 활동을 집계하여 AI 요약과 함께 캐싱한다.

| 컬럼           | 타입     | 제약조건                 | 설명                                               |
| -------------- | -------- | ------------------------ | -------------------------------------------------- |
| id             | Int      | PK, Auto Increment       | 주간 회고 고유 ID                                  |
| userId         | Int      | FK → users.id, Not Null  | 회고 대상 유저                                     |
| week           | String   | Not Null                 | ISO 주차 (예: "2025-W06")                          |
| savedLinks     | Int      | Not Null, Default: 0     | 해당 주 저장한 링크 수                             |
| readLinks      | Int      | Not Null, Default: 0     | 해당 주 읽은 링크 수                               |
| questionsAsked | Int      | Not Null, Default: 0     | 해당 주 질문 수                                    |
| topTopics      | Json     | Not Null                 | 주요 주제 배열 (예: ["NestJS", "Docker", "Redis"]) |
| summary        | String   | Not Null                 | AI 생성 주간 요약문                                |
| createdAt      | DateTime | Not Null, Default: now() | 생성일시                                           |

### 인덱스

| 인덱스                         | 컬럼           | 타입   |
| ------------------------------ | -------------- | ------ |
| weekly_reviews_userId_week_key | (userId, week) | Unique |
| weekly_reviews_userId_idx      | userId         | Index  |

### 외래키

| FK                | 참조     | 삭제 정책 |
| ----------------- | -------- | --------- |
| userId → users.id | users.id | Cascade   |

### 생성 정책

- 매주 월요일 00:00 Cron으로 직전 주 회고 자동 생성
- 사용자가 `POST /insights/weekly-review`로 수동 생성 가능
- 동일 유저 + 동일 주차는 중복 생성 불가 (Upsert)

> Dashboard(히트맵, 레이더 차트, 타임라인, 읽기 패턴)와 Insights(약점 감지, 미활용 링크, 질문 로그)는 기존 테이블(`links`, `link_tags`, `messages`)의 실시간 집계로 처리하며, 별도 테이블이 필요하지 않다.

---

## Phase 3 — 세컨드 브레인

---

## 12. Integration (외부 연동)

### 테이블: `integrations`

GitHub 등 외부 서비스 연동 정보를 저장한다.

| 컬럼             | 타입                   | 제약조건                 | 설명                                       |
| ---------------- | ---------------------- | ------------------------ | ------------------------------------------ |
| id               | Int                    | PK, Auto Increment       | 연동 레코드 고유 ID                        |
| userId           | Int                    | FK → users.id, Not Null  | 연동한 유저                                |
| type             | IntegrationType (Enum) | Not Null                 | 연동 유형                                  |
| accessToken      | String                 | Not Null                 | 암호화된 액세스 토큰                       |
| refreshToken     | String                 | Nullable                 | 암호화된 리프레시 토큰                     |
| externalUsername | String                 | Nullable                 | 외부 서비스 사용자명 (예: GitHub username) |
| connectedAt      | DateTime               | Not Null, Default: now() | 연동일시                                   |
| updatedAt        | DateTime               | Not Null, Auto Update    | 최종 수정일시                              |

### Enum: IntegrationType

| 값     | 설명        |
| ------ | ----------- |
| GITHUB | GitHub 연동 |

### 인덱스

| 인덱스                       | 컬럼           | 타입   |
| ---------------------------- | -------------- | ------ |
| integrations_userId_type_key | (userId, type) | Unique |
| integrations_userId_idx      | userId         | Index  |

### 외래키

| FK                | 참조     | 삭제 정책 |
| ----------------- | -------- | --------- |
| userId → users.id | users.id | Cascade   |

### 보안 정책

- `accessToken`, `refreshToken`은 AES-256으로 암호화하여 저장
- 토큰 갱신 시 `updatedAt`이 함께 갱신된다
- 연동 해제 시 레코드를 물리 삭제한다

---

## 13. RssFeed (RSS 피드)

### 테이블: `rss_feeds`

사용자가 구독한 RSS 피드를 관리한다.

| 컬럼          | 타입     | 제약조건                 | 설명                                |
| ------------- | -------- | ------------------------ | ----------------------------------- |
| id            | Int      | PK, Auto Increment       | RSS 피드 고유 ID                    |
| userId        | Int      | FK → users.id, Not Null  | 구독한 유저                         |
| feedUrl       | String   | Not Null                 | RSS 피드 URL                        |
| title         | String   | Nullable                 | 피드 제목 (최초 fetch 시 자동 수집) |
| lastFetchedAt | DateTime | Nullable                 | 마지막 피드 수집 시각               |
| createdAt     | DateTime | Not Null, Default: now() | 등록일시                            |
| updatedAt     | DateTime | Not Null, Auto Update    | 최종 수정일시                       |

### 인덱스

| 인덱스                       | 컬럼              | 타입   |
| ---------------------------- | ----------------- | ------ |
| rss_feeds_userId_feedUrl_key | (userId, feedUrl) | Unique |
| rss_feeds_userId_idx         | userId            | Index  |

### 외래키

| FK                | 참조     | 삭제 정책 |
| ----------------- | -------- | --------- |
| userId → users.id | users.id | Cascade   |

### 수집 정책

- Cron으로 주기적(30분~1시간)으로 새 글을 확인한다
- 새 글 발견 시 사용자의 관심 태그와 매칭하여 알림을 발송한다
- 같은 유저가 같은 피드 URL을 중복 등록할 수 없다

---

## 14. InterviewSession (면접 세션)

### 테이블: `interview_sessions`

면접 준비 모드의 세션을 관리한다.

| 컬럼      | 타입                   | 제약조건                       | 설명                                      |
| --------- | ---------------------- | ------------------------------ | ----------------------------------------- |
| id        | Int                    | PK, Auto Increment             | 세션 고유 ID                              |
| userId    | Int                    | FK → users.id, Not Null        | 세션 소유자                               |
| topics    | Json                   | Not Null                       | 출제 주제 배열 (예: ["NestJS", "Docker"]) |
| status    | InterviewStatus (Enum) | Not Null, Default: IN_PROGRESS | 세션 상태                                 |
| createdAt | DateTime               | Not Null, Default: now()       | 시작일시                                  |
| updatedAt | DateTime               | Not Null, Auto Update          | 최종 수정일시                             |

### Enum: InterviewStatus

| 값          | 설명    |
| ----------- | ------- |
| IN_PROGRESS | 진행 중 |
| COMPLETED   | 완료    |

### 인덱스

| 인덱스                        | 컬럼   | 타입  |
| ----------------------------- | ------ | ----- |
| interview_sessions_userId_idx | userId | Index |

### 외래키

| FK                | 참조     | 삭제 정책 |
| ----------------- | -------- | --------- |
| userId → users.id | users.id | Cascade   |

---

## 15. InterviewQuestion (면접 질문)

### 테이블: `interview_questions`

면접 세션 내 개별 질문과 답변/평가를 저장한다.

| 컬럼           | 타입     | 제약조건                             | 설명                                                          |
| -------------- | -------- | ------------------------------------ | ------------------------------------------------------------- |
| id             | Int      | PK, Auto Increment                   | 질문 고유 ID                                                  |
| sessionId      | Int      | FK → interview_sessions.id, Not Null | 소속 세션 ID                                                  |
| question       | String   | Not Null                             | AI 생성 면접 질문                                             |
| relatedLinkIds | Json     | Not Null                             | 관련 링크 ID 배열 (예: [1, 5])                                |
| answer         | String   | Nullable                             | 사용자 답변 (미답변 시 null)                                  |
| evaluation     | String   | Nullable                             | AI 평가 피드백                                                |
| gaps           | Json     | Nullable                             | 보충 필요 키워드 배열 (예: ["실행 순서", "ExecutionContext"]) |
| createdAt      | DateTime | Not Null, Default: now()             | 생성일시                                                      |
| updatedAt      | DateTime | Not Null, Auto Update                | 최종 수정일시                                                 |

### 인덱스

| 인덱스                            | 컬럼      | 타입  |
| --------------------------------- | --------- | ----- |
| interview_questions_sessionId_idx | sessionId | Index |

### 외래키

| FK                                | 참조                  | 삭제 정책                          |
| --------------------------------- | --------------------- | ---------------------------------- |
| sessionId → interview_sessions.id | interview_sessions.id | Cascade (세션 삭제 시 질문도 삭제) |

---

## Phase 4 — 개발자 지식 플랫폼

---

## 16. Workspace (워크스페이스)

### 테이블: `workspaces`

팀 단위 독립 지식 베이스를 관리한다.

| 컬럼        | 타입     | 제약조건                 | 설명                 |
| ----------- | -------- | ------------------------ | -------------------- |
| id          | Int      | PK, Auto Increment       | 워크스페이스 고유 ID |
| name        | String   | Not Null                 | 워크스페이스 이름    |
| description | String   | Nullable                 | 워크스페이스 설명    |
| createdAt   | DateTime | Not Null, Default: now() | 생성일시             |
| updatedAt   | DateTime | Not Null, Auto Update    | 최종 수정일시        |

### Phase 4 마이그레이션 참고

워크스페이스 도입 시 기존 `links`, `folders` 테이블에 `workspaceId` (FK → workspaces.id, Nullable) 컬럼을 추가해야 한다. `null`이면 개인 워크스페이스, 값이 있으면 팀 워크스페이스 소속이다.

---

## 17. WorkspaceMember (워크스페이스 멤버)

### 테이블: `workspace_members`

워크스페이스 소속 멤버와 역할을 관리한다.

| 컬럼        | 타입                 | 제약조건                     | 설명                |
| ----------- | -------------------- | ---------------------------- | ------------------- |
| id          | Int                  | PK, Auto Increment           | 멤버 레코드 고유 ID |
| workspaceId | Int                  | FK → workspaces.id, Not Null | 소속 워크스페이스   |
| userId      | Int                  | FK → users.id, Not Null      | 멤버 유저           |
| role        | WorkspaceRole (Enum) | Not Null, Default: MEMBER    | 멤버 역할           |
| joinedAt    | DateTime             | Not Null, Default: now()     | 참여일시            |

### Enum: WorkspaceRole

| 값     | 설명                                  |
| ------ | ------------------------------------- |
| ADMIN  | 관리자 (멤버 초대/제거, 설정 변경)    |
| MEMBER | 일반 멤버 (링크 저장, RAG 질의, 열람) |

### 인덱스

| 인덱스                                   | 컬럼                  | 타입   |
| ---------------------------------------- | --------------------- | ------ |
| workspace_members_workspaceId_userId_key | (workspaceId, userId) | Unique |
| workspace_members_workspaceId_idx        | workspaceId           | Index  |
| workspace_members_userId_idx             | userId                | Index  |

### 외래키

| FK                          | 참조          | 삭제 정책                                  |
| --------------------------- | ------------- | ------------------------------------------ |
| workspaceId → workspaces.id | workspaces.id | Cascade (워크스페이스 삭제 시 멤버도 삭제) |
| userId → users.id           | users.id      | Cascade (유저 삭제 시 멤버십도 삭제)       |

---

## 18. WorkspaceInvite (워크스페이스 초대)

### 테이블: `workspace_invites`

워크스페이스 초대 토큰과 상태를 관리한다.

| 컬럼        | 타입                 | 제약조건                     | 설명                   |
| ----------- | -------------------- | ---------------------------- | ---------------------- |
| id          | Int                  | PK, Auto Increment           | 초대 레코드 고유 ID    |
| workspaceId | Int                  | FK → workspaces.id, Not Null | 초대 대상 워크스페이스 |
| email       | String               | Not Null                     | 초대받은 이메일        |
| role        | WorkspaceRole (Enum) | Not Null, Default: MEMBER    | 초대 역할              |
| token       | String               | Unique, Not Null             | 초대 토큰 (URL에 사용) |
| status      | InviteStatus (Enum)  | Not Null, Default: PENDING   | 초대 상태              |
| expiresAt   | DateTime             | Not Null                     | 초대 만료일시          |
| createdAt   | DateTime             | Not Null, Default: now()     | 초대일시               |

### Enum: InviteStatus

| 값       | 설명    |
| -------- | ------- |
| PENDING  | 대기 중 |
| ACCEPTED | 수락됨  |
| EXPIRED  | 만료됨  |

### 인덱스

| 인덱스                            | 컬럼        | 타입   |
| --------------------------------- | ----------- | ------ |
| workspace_invites_token_key       | token       | Unique |
| workspace_invites_workspaceId_idx | workspaceId | Index  |

### 외래키

| FK                          | 참조          | 삭제 정책 |
| --------------------------- | ------------- | --------- |
| workspaceId → workspaces.id | workspaces.id | Cascade   |

### 초대 정책

- 초대 토큰은 UUID v4로 생성하며, 기본 만료 기간은 7일이다
- 수락 시 `status`가 `ACCEPTED`로 변경되고 `workspace_members`에 레코드가 생성된다
- 만료된 초대는 Cron으로 `status`를 `EXPIRED`로 변경한다

---

## 19. Subscription (구독)

### 테이블: `subscriptions`

유저 간 구독 관계를 관리한다.

| 컬럼         | 타입     | 제약조건                 | 설명                |
| ------------ | -------- | ------------------------ | ------------------- |
| id           | Int      | PK, Auto Increment       | 구독 레코드 고유 ID |
| subscriberId | Int      | FK → users.id, Not Null  | 구독하는 유저       |
| targetId     | Int      | FK → users.id, Not Null  | 구독 대상 유저      |
| createdAt    | DateTime | Not Null, Default: now() | 구독일시            |

### 인덱스

| 인덱스                                  | 컬럼                     | 타입   |
| --------------------------------------- | ------------------------ | ------ |
| subscriptions_subscriberId_targetId_key | (subscriberId, targetId) | Unique |
| subscriptions_subscriberId_idx          | subscriberId             | Index  |
| subscriptions_targetId_idx              | targetId                 | Index  |

### 외래키

| FK                      | 참조     | 삭제 정책                               |
| ----------------------- | -------- | --------------------------------------- |
| subscriberId → users.id | users.id | Cascade (유저 삭제 시 구독도 삭제)      |
| targetId → users.id     | users.id | Cascade (대상 유저 삭제 시 구독도 삭제) |

### 제약 조건

- 자기 자신을 구독할 수 없다 (애플리케이션 레벨에서 검증)
- 같은 대상을 중복 구독할 수 없다 (subscriberId + targetId Unique)

---

## 20. Notification (알림)

### 테이블: `notifications`

다양한 유형의 알림을 통합 관리한다.

| 컬럼      | 타입                    | 제약조건                 | 설명                                 |
| --------- | ----------------------- | ------------------------ | ------------------------------------ |
| id        | Int                     | PK, Auto Increment       | 알림 고유 ID                         |
| userId    | Int                     | FK → users.id, Not Null  | 알림 수신 유저                       |
| type      | NotificationType (Enum) | Not Null                 | 알림 유형                            |
| message   | String                  | Not Null                 | 알림 메시지 본문                     |
| data      | Json                    | Nullable                 | 알림 관련 데이터 (linkId, userId 등) |
| read      | Boolean                 | Not Null, Default: false | 읽음 여부                            |
| createdAt | DateTime                | Not Null, Default: now() | 생성일시                             |

### Enum: NotificationType

| 값                    | 설명                        |
| --------------------- | --------------------------- |
| SUBSCRIPTION_NEW_LINK | 구독 대상이 새 링크를 공개  |
| CONTENT_UPDATED       | 저장한 링크의 원본 업데이트 |
| UNREAD_REMINDER       | 미읽은 링크 리마인더        |
| UNUSED_LINKS          | 미활용 링크 알림            |
| WEAKNESS_DETECTED     | 약점 주제 감지              |
| WORKSPACE_INVITE      | 워크스페이스 초대           |
| RSS_NEW_ITEMS         | RSS 신규 아이템             |

### 인덱스

| 인덱스                        | 컬럼           | 타입  |
| ----------------------------- | -------------- | ----- |
| notifications_userId_idx      | userId         | Index |
| notifications_userId_read_idx | (userId, read) | Index |
| notifications_createdAt_idx   | createdAt      | Index |

### 외래키

| FK                | 참조     | 삭제 정책                          |
| ----------------- | -------- | ---------------------------------- |
| userId → users.id | users.id | Cascade (유저 삭제 시 알림도 삭제) |

### data JSON 구조 (유형별)

```json
// SUBSCRIPTION_NEW_LINK
{ "userId": 5, "linkId": 100 }

// CONTENT_UPDATED
{ "linkId": 1 }

// UNREAD_REMINDER
{ "count": 5 }

// UNUSED_LINKS
{ "count": 8 }

// WEAKNESS_DETECTED
{ "topic": "Docker 네트워크", "questionCount": 5 }

// WORKSPACE_INVITE
{ "workspaceId": 2, "workspaceName": "회사 팀 자료", "inviteId": 1 }

// RSS_NEW_ITEMS
{ "rssFeedId": 1, "feedTitle": "Example Blog", "newItemCount": 3 }
```

### 보관 정책

- 90일이 경과한 읽은 알림은 Cron으로 영구 삭제한다
- 읽지 않은 알림은 기간에 관계없이 보관한다

---

## 21. 테이블 관계

```
[기존 — 현재 기능]
users (1) ──── (N) oauths
users (1) ──── (N) folders
users (1) ──── (N) links
folders (1) ──── (N) links
folders (1) ──── (N) folders          (self-reference, parentId)
links  (N) ──── (N) tags              (via link_tags)
translations                          (독립 테이블)

[Phase 1 — RAG]
links  (1) ──── (N) link_embeddings
users  (1) ──── (N) conversations
conversations (1) ──── (N) messages

[Phase 2 — 학습 가속기]
users  (1) ──── (N) weekly_reviews

[Phase 3 — 세컨드 브레인]
users  (1) ──── (N) integrations
users  (1) ──── (N) rss_feeds
users  (1) ──── (N) interview_sessions
interview_sessions (1) ──── (N) interview_questions

[Phase 4 — 개발자 플랫폼]
workspaces (1) ──── (N) workspace_members
workspaces (1) ──── (N) workspace_invites
users  (1) ──── (N) workspace_members
users  (1) ──── (N) subscriptions     (as subscriber)
users  (1) ──── (N) subscriptions     (as target)
users  (1) ──── (N) notifications
```

- 한 유저는 여러 OAuth 연동을 가질 수 있다 (Google + Apple 동시 연동)
- 비밀번호 인증은 지원하지 않으며, OAuth 전용 인증만 사용한다
- 폴더는 자기 참조로 중첩 구조를 지원한다 (parentId)
- 링크는 하나의 폴더에 속하거나 미분류일 수 있다
- 링크와 태그는 다대다 관계이다 (link_tags 중간 테이블)
- 같은 유저가 같은 URL을 중복 저장할 수 없다 (userId + url 유니크)
- translations는 독립 테이블로, 유저와 직접 관계 없이 key + locale로 번역을 관리한다
- 하나의 링크는 여러 텍스트 청크로 분할되어 벡터 임베딩이 저장된다
- 대화(Conversation)는 여러 메시지를 포함하며, 메시지 간 맥락이 유지된다
- 구독은 자기 참조 관계로, 같은 users 테이블의 두 레코드를 연결한다
- 워크스페이스는 Phase 4에서 links, folders에 workspaceId를 추가하여 연결한다

---

## 22. 가입/로그인 시나리오

| 시나리오                          | users                                | oauths                                 |
| --------------------------------- | ------------------------------------ | -------------------------------------- |
| Google 최초 로그인                | email + nickname + profileImage 저장 | provider=GOOGLE, providerId 저장       |
| Apple 최초 로그인                 | email + nickname 저장                | provider=APPLE, providerId 저장        |
| 기존 유저가 다른 제공자 추가 연동 | 기존 유저 유지                       | 해당 userId로 레코드 추가              |
| 탈퇴                              | deletedAt에 현재 시각 기록           | 유지 (Cascade는 물리 삭제 시에만 동작) |

---

## 23. Prisma Schema

```prisma
// ─── Enums (기존) ───

enum OAuthProvider {
  GOOGLE
  APPLE
}

enum Locale {
  KO
  EN
}

enum Visibility {
  PRIVATE
  PUBLIC
}

enum CrawlStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// ─── Enums (신규) ───

enum MessageRole {
  USER
  ASSISTANT
}

enum Feedback {
  UP
  DOWN
}

enum IntegrationType {
  GITHUB
}

enum InterviewStatus {
  IN_PROGRESS
  COMPLETED
}

enum WorkspaceRole {
  ADMIN
  MEMBER
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
}

enum NotificationType {
  SUBSCRIPTION_NEW_LINK
  CONTENT_UPDATED
  UNREAD_REMINDER
  UNUSED_LINKS
  WEAKNESS_DETECTED
  WORKSPACE_INVITE
  RSS_NEW_ITEMS
}

// ─── 기존 모델 ───

model User {
  id             Int       @id @default(autoincrement())
  email          String    @unique
  nickname       String
  profileImage   String?
  locale         Locale    @default(KO)
  profilePublic  Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  oauths             OAuth[]
  folders            Folder[]
  links              Link[]
  conversations      Conversation[]
  weeklyReviews      WeeklyReview[]
  integrations       Integration[]
  rssFeeds           RssFeed[]
  interviewSessions  InterviewSession[]
  workspaceMembers   WorkspaceMember[]
  subscribedTo       Subscription[]     @relation("Subscriber")
  subscribers        Subscription[]     @relation("Target")
  notifications      Notification[]

  @@map("users")
}

model OAuth {
  id             Int           @id @default(autoincrement())
  userId         Int
  provider       OAuthProvider
  providerId     String

  createdAt      DateTime      @default(now())

  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@index([userId])
  @@map("oauths")
}

model Translation {
  id             Int       @id @default(autoincrement())
  key            String
  locale         Locale
  value          String

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([key, locale])
  @@index([locale])
  @@map("translations")
}

model Folder {
  id             Int        @id @default(autoincrement())
  userId         Int
  parentId       Int?
  name           String
  isDocked       Boolean    @default(false)
  visibility     Visibility @default(PRIVATE)
  shareToken     String?    @unique

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent         Folder?    @relation("FolderTree", fields: [parentId], references: [id], onDelete: SetNull)
  children       Folder[]   @relation("FolderTree")
  links          Link[]

  @@index([userId])
  @@index([parentId])
  @@map("folders")
}

model Link {
  id             Int         @id @default(autoincrement())
  userId         Int
  folderId       Int?
  url            String
  ogTitle        String?
  ogDescription  String?
  ogImage        String?
  summary        String?
  memo           String?
  crawlStatus    CrawlStatus @default(PENDING)
  visibility     Visibility  @default(PRIVATE)
  readAt         DateTime?
  contentUpdated Boolean     @default(false)

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  deletedAt      DateTime?

  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  folder         Folder?     @relation(fields: [folderId], references: [id], onDelete: SetNull)
  linkTags       LinkTag[]
  embeddings     LinkEmbedding[]

  @@unique([userId, url])
  @@index([userId])
  @@index([folderId])
  @@index([deletedAt])
  @@index([createdAt])
  @@map("links")
}

model Tag {
  id             Int       @id @default(autoincrement())
  name           String    @unique

  createdAt      DateTime  @default(now())

  linkTags       LinkTag[]

  @@map("tags")
}

model LinkTag {
  id             Int      @id @default(autoincrement())
  linkId         Int
  tagId          Int

  createdAt      DateTime @default(now())

  link           Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)
  tag            Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([linkId, tagId])
  @@index([linkId])
  @@index([tagId])
  @@map("link_tags")
}

// ─── Phase 1: RAG ───

model LinkEmbedding {
  id             Int                          @id @default(autoincrement())
  linkId         Int
  chunkIndex     Int
  chunkText      String
  embedding      Unsupported("vector(1536)")

  createdAt      DateTime                     @default(now())

  link           Link                         @relation(fields: [linkId], references: [id], onDelete: Cascade)

  @@unique([linkId, chunkIndex])
  @@index([linkId])
  @@map("link_embeddings")
}

model Conversation {
  id             Int       @id @default(autoincrement())
  userId         Int
  title          String?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages       Message[]

  @@index([userId])
  @@map("conversations")
}

model Message {
  id             Int          @id @default(autoincrement())
  conversationId Int
  role           MessageRole
  content        String
  sources        Json?
  feedback       Feedback?

  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@map("messages")
}

// ─── Phase 2: 학습 가속기 ───

model WeeklyReview {
  id             Int      @id @default(autoincrement())
  userId         Int
  week           String
  savedLinks     Int      @default(0)
  readLinks      Int      @default(0)
  questionsAsked Int      @default(0)
  topTopics      Json
  summary        String

  createdAt      DateTime @default(now())

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, week])
  @@index([userId])
  @@map("weekly_reviews")
}

// ─── Phase 3: 세컨드 브레인 ───

model Integration {
  id               Int             @id @default(autoincrement())
  userId           Int
  type             IntegrationType
  accessToken      String
  refreshToken     String?
  externalUsername  String?

  connectedAt      DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, type])
  @@index([userId])
  @@map("integrations")
}

model RssFeed {
  id             Int       @id @default(autoincrement())
  userId         Int
  feedUrl        String
  title          String?
  lastFetchedAt  DateTime?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, feedUrl])
  @@index([userId])
  @@map("rss_feeds")
}

model InterviewSession {
  id             Int             @id @default(autoincrement())
  userId         Int
  topics         Json
  status         InterviewStatus @default(IN_PROGRESS)

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  questions      InterviewQuestion[]

  @@index([userId])
  @@map("interview_sessions")
}

model InterviewQuestion {
  id             Int              @id @default(autoincrement())
  sessionId      Int
  question       String
  relatedLinkIds Json
  answer         String?
  evaluation     String?
  gaps           Json?

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  session        InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@map("interview_questions")
}

// ─── Phase 4: 개발자 플랫폼 ───

model Workspace {
  id             Int               @id @default(autoincrement())
  name           String
  description    String?

  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  members        WorkspaceMember[]
  invites        WorkspaceInvite[]

  @@map("workspaces")
}

model WorkspaceMember {
  id             Int           @id @default(autoincrement())
  workspaceId    Int
  userId         Int
  role           WorkspaceRole @default(MEMBER)

  joinedAt       DateTime      @default(now())

  workspace      Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@index([workspaceId])
  @@index([userId])
  @@map("workspace_members")
}

model WorkspaceInvite {
  id             Int           @id @default(autoincrement())
  workspaceId    Int
  email          String
  role           WorkspaceRole @default(MEMBER)
  token          String        @unique
  status         InviteStatus  @default(PENDING)
  expiresAt      DateTime

  createdAt      DateTime      @default(now())

  workspace      Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@map("workspace_invites")
}

model Subscription {
  id             Int      @id @default(autoincrement())
  subscriberId   Int
  targetId       Int

  createdAt      DateTime @default(now())

  subscriber     User     @relation("Subscriber", fields: [subscriberId], references: [id], onDelete: Cascade)
  target         User     @relation("Target", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([subscriberId, targetId])
  @@index([subscriberId])
  @@index([targetId])
  @@map("subscriptions")
}

model Notification {
  id             Int              @id @default(autoincrement())
  userId         Int
  type           NotificationType
  message        String
  data           Json?
  read           Boolean          @default(false)

  createdAt      DateTime         @default(now())

  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, read])
  @@index([createdAt])
  @@map("notifications")
}
```
