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

## 14. MembershipProduct (멤버십 상품)

### 테이블: `membership_products`

플랫폼별 멤버십 상품을 관리한다.

| 컬럼      | 타입                         | 제약조건                   | 설명                                              |
| --------- | ---------------------------- | -------------------------- | ------------------------------------------------- |
| id        | Int                          | PK, Auto Increment         | 상품 고유 ID                                      |
| key       | String                       | Unique, Not Null           | 상품 고유 키 (예: "premium_monthly_ios")          |
| name      | String                       | Not Null                   | 상품 이름                                         |
| type      | MembershipProductType (Enum) | Not Null                   | 상품 유형 (IOS_INAPP, AOS_INAPP, TOSS, EVENT, CS) |
| period    | ProductPeriod (Enum)         | Nullable                   | 구독 기간 (P1W, P1M, P3M, P6M, P12M, UNDEFINED)   |
| trialDays | Int                          | Not Null, Default: 0       | 무료 체험 기간 (일)                               |
| status    | ProductStatus (Enum)         | Not Null, Default: CREATED | 상품 상태 (CREATED, ACTIVE, ARCHIVED)             |
| createdAt | DateTime                     | Not Null, Default: now()   | 생성일시                                          |
| updatedAt | DateTime                     | Not Null, Auto Update      | 최종 수정일시                                     |

### Enum: MembershipProductType

| 값        | 설명                    |
| --------- | ----------------------- |
| IOS_INAPP | Apple App Store (IAP)   |
| AOS_INAPP | Google Play Store (IAP) |
| TOSS      | 토스페이먼츠 (웹 결제)  |
| EVENT     | 이벤트 지급             |
| CS        | CS 수동 지급            |

### Enum: ProductPeriod

| 값        | 설명   |
| --------- | ------ |
| P1W       | 1주    |
| P1M       | 1개월  |
| P3M       | 3개월  |
| P6M       | 6개월  |
| P12M      | 12개월 |
| UNDEFINED | 미정   |

### Enum: ProductStatus

| 값       | 설명               |
| -------- | ------------------ |
| CREATED  | 생성됨 (미활성)    |
| ACTIVE   | 판매 중            |
| ARCHIVED | 보관됨 (판매 중단) |

### 인덱스

| 인덱스                           | 컬럼        | 타입   |
| -------------------------------- | ----------- | ------ |
| membership_products_key_key      | key         | Unique |
| membership_products_key_type_idx | (key, type) | Index  |

---

## 15. Membership (멤버십)

### 테이블: `memberships`

사용자의 멤버십 구독 상태를 관리한다. 유저당 하나의 멤버십만 존재한다 (`userId` Unique).

| 컬럼           | 타입     | 제약조건                              | 설명                           |
| -------------- | -------- | ------------------------------------- | ------------------------------ |
| id             | Int      | PK, Auto Increment                    | 멤버십 고유 ID                 |
| userId         | Int      | FK → users.id, Unique, Not Null       | 구독 유저 (1:1)                |
| productId      | Int      | FK → membership_products.id, Not Null | 현재 구독 상품                 |
| key            | String   | Unique, Nullable                      | 멤버십 고유 키 (스토어 식별용) |
| isAutoRenewing | Boolean  | Nullable                              | 자동 갱신 여부                 |
| purchaseToken  | String   | Nullable                              | 스토어 구매 토큰 (Play Store)  |
| endAt          | DateTime | Nullable                              | 구독 종료일시                  |
| history        | Json     | Nullable                              | 상태 변경 이력                 |
| createdAt      | DateTime | Not Null, Default: now()              | 생성일시                       |
| updatedAt      | DateTime | Not Null, Auto Update                 | 최종 수정일시                  |

### 인덱스

| 인덱스                    | 컬럼      | 타입   |
| ------------------------- | --------- | ------ |
| memberships_userId_key    | userId    | Unique |
| memberships_key_key       | key       | Unique |
| memberships_productId_idx | productId | Index  |
| memberships_userId_idx    | userId    | Index  |

### 외래키

| FK                                 | 참조                   | 삭제 정책                          |
| ---------------------------------- | ---------------------- | ---------------------------------- |
| userId → users.id                  | users.id               | Cascade (유저 삭제 시 멤버십 삭제) |
| productId → membership_products.id | membership_products.id | Restrict                           |

### 멤버십 상태 판단

- `endAt`이 현재 시각 이후 → 활성 구독
- `endAt`이 현재 시각 이전 → 만료
- `isAutoRenewing = true` → 자동 갱신 예정
- `history`에 상태 변경 이력(업그레이드, 다운그레이드, 환불 등)이 JSON 배열로 기록된다

---

## 16. MembershipTransaction (멤버십 트랜잭션)

### 테이블: `membership_transactions`

멤버십 결제/갱신/환불 트랜잭션을 기록한다.

| 컬럼            | 타입                     | 제약조건                              | 설명                                |
| --------------- | ------------------------ | ------------------------------------- | ----------------------------------- |
| id              | Int                      | PK, Auto Increment                    | 트랜잭션 고유 ID                    |
| membershipId    | Int                      | FK → memberships.id, Not Null         | 소속 멤버십                         |
| userId          | Int                      | FK → users.id, Nullable               | 결제 유저                           |
| productId       | Int                      | FK → membership_products.id, Not Null | 결제 상품                           |
| originalTrxId   | String                   | Not Null                              | 최초 트랜잭션 ID (갱신 체인 추적용) |
| trxId           | String                   | Unique, Not Null                      | 스토어 트랜잭션 ID                  |
| purchaseToken   | String                   | Nullable                              | 스토어 구매 토큰                    |
| platform        | Platform (Enum)          | Not Null, Default: ANDROID            | 결제 플랫폼 (IOS, ANDROID, WEB)     |
| type            | TransactionType (Enum)   | Not Null, Default: SUBSCRIPTION_START | 트랜잭션 유형                       |
| status          | TransactionStatus (Enum) | Not Null, Default: COMPLETED          | 트랜잭션 상태                       |
| beginAt         | DateTime                 | Not Null                              | 구독 시작일시                       |
| endAt           | DateTime                 | Not Null                              | 구독 종료일시                       |
| chargedAmount   | Int                      | Not Null                              | 결제 금액 (최소 통화 단위)          |
| currency        | String                   | Not Null, Default: "KRW"              | 통화 코드                           |
| offerId         | String                   | Nullable                              | 프로모션/오퍼 ID                    |
| refundedAt      | DateTime                 | Nullable                              | 환불 시각                           |
| refundAmount    | Int                      | Nullable                              | 환불 금액                           |
| storeData       | Json                     | Nullable                              | 스토어 원본 응답 데이터             |
| lastProcessedAt | DateTime                 | Nullable                              | 마지막 처리 시각 (웹훅 등)          |
| createdAt       | DateTime                 | Not Null, Default: now()              | 생성일시                            |
| updatedAt       | DateTime                 | Not Null, Auto Update                 | 최종 수정일시                       |

### Enum: Platform

| 값      | 설명         |
| ------- | ------------ |
| IOS     | Apple iOS    |
| ANDROID | Android      |
| WEB     | 웹 (토스 등) |

### Enum: TransactionType

| 값                     | 설명         |
| ---------------------- | ------------ |
| SUBSCRIPTION_START     | 최초 구독    |
| SUBSCRIPTION_RENEW     | 갱신         |
| SUBSCRIPTION_EXPIRE    | 만료         |
| SUBSCRIPTION_REFUND    | 환불         |
| SUBSCRIPTION_UPGRADE   | 업그레이드   |
| SUBSCRIPTION_DOWNGRADE | 다운그레이드 |
| TRIAL_START            | 체험 시작    |
| TRIAL_CONVERT          | 체험 → 유료  |

### Enum: MembershipStatus

| 값       | 설명    |
| -------- | ------- |
| ACTIVE   | 활성    |
| PENDING  | 처리 중 |
| EXPIRED  | 만료    |
| INACTIVE | 비활성  |
| REFUNDED | 환불됨  |

### Enum: TransactionStatus

| 값        | 설명 |
| --------- | ---- |
| PENDING   | 대기 |
| COMPLETED | 완료 |
| FAILED    | 실패 |
| REFUNDED  | 환불 |
| CANCELLED | 취소 |

### 인덱스

| 인덱스                                    | 컬럼          | 타입   |
| ----------------------------------------- | ------------- | ------ |
| membership_transactions_trxId_key         | trxId         | Unique |
| membership_transactions_membershipId_idx  | membershipId  | Index  |
| membership_transactions_originalTrxId_idx | originalTrxId | Index  |
| membership_transactions_userId_idx        | userId        | Index  |
| membership_transactions_productId_idx     | productId     | Index  |
| membership_transactions_type_idx          | type          | Index  |
| membership_transactions_status_idx        | status        | Index  |

### 외래키

| FK                                 | 참조                   | 삭제 정책                                |
| ---------------------------------- | ---------------------- | ---------------------------------------- |
| membershipId → memberships.id      | memberships.id         | Cascade (멤버십 삭제 시 트랜잭션도 삭제) |
| productId → membership_products.id | membership_products.id | Restrict                                 |
| userId → users.id                  | users.id               | SetNull (유저 삭제 시 null)              |

---

## 16-1. IapNotificationLog (IAP 알림 로그)

### 테이블: `iap_notification_logs`

Apple/Google 스토어에서 수신한 서버 알림(Server-to-Server Notification)을 로깅한다.

| 컬럼          | 타입     | 제약조건                      | 설명                    |
| ------------- | -------- | ----------------------------- | ----------------------- |
| id            | Int      | PK, Auto Increment            | 로그 고유 ID            |
| membershipId  | Int      | FK → memberships.id, Nullable | 연관 멤버십             |
| type          | String   | Nullable                      | 알림 유형 (스토어 정의) |
| purchaseToken | String   | Nullable                      | 구매 토큰               |
| originalTrxId | String   | Nullable                      | 최초 트랜잭션 ID        |
| body          | Json     | Nullable                      | 알림 원본 body          |
| payload       | Json     | Nullable                      | 파싱된 페이로드         |
| createdAt     | DateTime | Not Null, Default: now()      | 생성일시                |
| updatedAt     | DateTime | Not Null, Auto Update         | 최종 수정일시           |

### 인덱스

| 인덱스                                  | 컬럼          | 타입  |
| --------------------------------------- | ------------- | ----- |
| iap_notification_logs_membershipId_idx  | membershipId  | Index |
| iap_notification_logs_purchaseToken_idx | purchaseToken | Index |
| iap_notification_logs_originalTrxId_idx | originalTrxId | Index |

### 외래키

| FK                            | 참조           | 삭제 정책 |
| ----------------------------- | -------------- | --------- |
| membershipId → memberships.id | memberships.id | SetNull   |

---

## Phase 4 — 개발자 지식 플랫폼

---

## 17. Workspace (워크스페이스)

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

## 18. WorkspaceMember (워크스페이스 멤버)

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

## 19. WorkspaceInvite (워크스페이스 초대)

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

## 20. Subscription (구독)

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

## 21. Notification (알림)

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

## 22. 테이블 관계

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

[Membership]
membership_products (1) ──── (N) memberships
membership_products (1) ──── (N) membership_transactions
users  (1) ──── (1) memberships
users  (1) ──── (N) membership_transactions
memberships (1) ──── (N) membership_transactions
memberships (1) ──── (N) iap_notification_logs

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
- 유저당 하나의 멤버십만 존재하며 (1:1), 멤버십 상품은 유형별(IOS_INAPP, AOS_INAPP, TOSS, EVENT, CS)로 관리된다
- 멤버십 트랜잭션은 갱신 체인을 `originalTrxId`로 추적하며, 스토어 알림은 `iap_notification_logs`에 로깅된다
- 구독은 자기 참조 관계로, 같은 users 테이블의 두 레코드를 연결한다
- 워크스페이스는 Phase 4에서 links, folders에 workspaceId를 추가하여 연결한다

---

## 23. 가입/로그인 시나리오

| 시나리오                          | users                                | oauths                                 |
| --------------------------------- | ------------------------------------ | -------------------------------------- |
| Google 최초 로그인                | email + nickname + profileImage 저장 | provider=GOOGLE, providerId 저장       |
| Apple 최초 로그인                 | email + nickname 저장                | provider=APPLE, providerId 저장        |
| 기존 유저가 다른 제공자 추가 연동 | 기존 유저 유지                       | 해당 userId로 레코드 추가              |
| 탈퇴                              | deletedAt에 현재 시각 기록           | 유지 (Cascade는 물리 삭제 시에만 동작) |
