# AutoLink — API 명세서

> 도메인별 API 입력/출력 설계 | 인증: Cookie Session

---

## 공통 사항

### 인증

모든 API는 별도 표기가 없는 한 인증 필수입니다.

| 항목        | 내용                                            |
| ----------- | ----------------------------------------------- |
| 방식        | Cookie 기반 Session                             |
| 세션 쿠키   | `autolink_sid` (HttpOnly, Secure, SameSite=Lax) |
| 미인증 응답 | `401 Unauthorized`                              |

### 공통 에러 응답

```json
{
  "statusCode": 401,
  "message": "로그인이 필요합니다",
  "error": "Unauthorized"
}
```

### 페이지네이션 (공통)

```json
// Request Query
{ "cursor": "string", "limit": 20 }

// Response
{
  "data": [],
  "nextCursor": "string | null",
  "hasNext": true
}
```

---

## 1. Auth (인증)

OAuth 전용 인증. 비밀번호 로그인은 지원하지 않는다. 지원 제공자: Google, Apple.

### `GET /auth/:provider` — OAuth 로그인 페이지 리다이렉트

인증: 불필요

`:provider`는 `google` 또는 `apple`.

**Response 302**

해당 제공자의 OAuth 동의 화면으로 리다이렉트한다.

---

### `GET /auth/:provider/callback` — OAuth 콜백

인증: 불필요

제공자 인증 완료 후 리다이렉트되는 엔드포인트.

**Request Query**

```
?code=oauth_authorization_code&state=csrf_token
```

**Response 302**

신규 유저 → 회원가입 처리 후 클라이언트로 리다이렉트. 기존 유저 → 로그인 처리 후 클라이언트로 리다이렉트. 세션 쿠키 `autolink_sid`가 Set-Cookie로 발급된다.

**Error 401**

```json
{ "statusCode": 401, "message": "OAuth 인증에 실패했습니다" }
```

---

### `POST /auth/logout` — 로그아웃

**Response 200**

```json
{ "message": "로그아웃 되었습니다" }
```

세션이 서버에서 파기되고 쿠키가 삭제된다.

---

### `GET /auth/me` — 현재 사용자 정보

**Response 200**

```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "개발자",
  "profileImage": "https://lh3.googleusercontent.com/...",
  "profilePublic": false,
  "oauths": [{ "provider": "GOOGLE", "connectedAt": "2025-02-01T00:00:00Z" }],
  "createdAt": "2025-02-01T00:00:00Z"
}
```

---

### `POST /auth/connect/:provider` — 추가 OAuth 연동

이미 로그인한 유저가 다른 제공자를 추가 연동한다.

**Response 302**

해당 제공자의 OAuth 동의 화면으로 리다이렉트한다. 연동 완료 후 클라이언트로 리다이렉트.

**Error 409**

```json
{ "statusCode": 409, "message": "이미 연동된 제공자입니다" }
```

---

### `DELETE /auth/connect/:provider` — OAuth 연동 해제

**Response 200**

```json
{ "message": "Google 연동이 해제되었습니다" }
```

**Error 400**

```json
{ "statusCode": 400, "message": "최소 1개의 로그인 수단이 필요합니다" }
```

마지막 남은 OAuth 연동은 해제할 수 없다.

---

### `DELETE /auth/me` — 회원 탈퇴

**Response 200**

```json
{ "message": "탈퇴 처리되었습니다" }
```

`users.deletedAt`에 현재 시각이 기록되고 세션이 파기된다 (Soft Delete).

---

## 2. Links (링크)

### `POST /links` — 링크 저장

**Request Body**

```json
{
  "url": "https://example.com/article",
  "folderId": "folder_01",
  "memo": "NestJS Guard 관련 좋은 글"
}
```

`folderId`, `memo`는 선택 값이다.

**Response 201**

```json
{
  "id": "link_01",
  "url": "https://example.com/article",
  "ogTitle": "NestJS Custom Guard 만들기",
  "ogDescription": "NestJS에서 커스텀 Guard를 구현하는 방법을 알아봅니다",
  "ogImage": "https://example.com/og-image.png",
  "summary": null,
  "tags": [],
  "crawlStatus": "pending",
  "folderId": "folder_01",
  "memo": "NestJS Guard 관련 좋은 글",
  "visibility": "private",
  "readAt": null,
  "createdAt": "2025-02-01T00:00:00Z"
}
```

저장 후 백그라운드에서 OG 크롤링 → AI 요약 → 자동 태깅 → 본문 크롤링 → 임베딩이 순차적으로 진행된다. `crawlStatus`가 `pending` → `processing` → `completed` 또는 `failed`로 변경된다.

**Error 409**

```json
{
  "statusCode": 409,
  "message": "이미 저장된 링크입니다",
  "existingLinkId": "link_03"
}
```

---

### `GET /links` — 링크 목록 조회

**Request Query**

```
?folderId=folder_01&cursor=link_20&limit=20
```

`folderId`가 없으면 전체 링크를 반환한다.

**Response 200**

```json
{
  "data": [
    {
      "id": "link_01",
      "url": "https://example.com/article",
      "ogTitle": "NestJS Custom Guard 만들기",
      "ogDescription": "NestJS에서 커스텀 Guard를...",
      "ogImage": "https://example.com/og-image.png",
      "summary": "NestJS에서 CanActivate 인터페이스를 구현하여...",
      "tags": ["NestJS", "Guard", "인증"],
      "crawlStatus": "completed",
      "folderId": "folder_01",
      "memo": "NestJS Guard 관련 좋은 글",
      "visibility": "private",
      "readAt": "2025-02-02T10:00:00Z",
      "contentUpdated": false,
      "createdAt": "2025-02-01T00:00:00Z"
    }
  ],
  "nextCursor": "link_21",
  "hasNext": true
}
```

---

### `GET /links/:linkId` — 링크 상세 조회

**Response 200**

```json
{
  "id": "link_01",
  "url": "https://example.com/article",
  "ogTitle": "NestJS Custom Guard 만들기",
  "ogDescription": "NestJS에서 커스텀 Guard를 구현하는 방법을 알아봅니다",
  "ogImage": "https://example.com/og-image.png",
  "summary": "NestJS에서 CanActivate 인터페이스를 구현하여...",
  "tags": ["NestJS", "Guard", "인증"],
  "crawlStatus": "completed",
  "folderId": "folder_01",
  "memo": "NestJS Guard 관련 좋은 글",
  "visibility": "private",
  "readAt": "2025-02-02T10:00:00Z",
  "contentUpdated": false,
  "relatedLinks": [
    {
      "id": "link_05",
      "ogTitle": "NestJS Middleware vs Guard 차이",
      "ogImage": "https://...",
      "similarity": 0.87
    }
  ],
  "createdAt": "2025-02-01T00:00:00Z",
  "updatedAt": "2025-02-01T00:00:00Z"
}
```

조회 시 `readAt`이 자동 갱신된다.

---

### `PATCH /links/:linkId` — 링크 수정

**Request Body**

```json
{
  "folderId": "folder_02",
  "memo": "메모 수정",
  "visibility": "public"
}
```

모든 필드 선택 값이다.

**Response 200**

수정된 링크 객체 반환 (상세 조회와 동일 구조).

---

### `DELETE /links/:linkId` — 링크 삭제 (휴지통 이동)

**Response 200**

```json
{ "message": "휴지통으로 이동되었습니다", "deletedAt": "2025-02-10T00:00:00Z" }
```

---

### `POST /links/:linkId/recrawl` — 재크롤링 요청

콘텐츠 변경이 감지되었거나 크롤링 실패 시 재시도한다.

**Response 200**

```json
{ "crawlStatus": "pending", "message": "재크롤링이 시작되었습니다" }
```

---

## 3. Folders (폴더)

### `POST /folders` — 폴더 생성

**Request Body**

```json
{
  "name": "NestJS 학습",
  "parentId": null
}
```

**Response 201**

```json
{
  "id": "folder_01",
  "name": "NestJS 학습",
  "parentId": null,
  "isDocked": false,
  "visibility": "private",
  "linkCount": 0,
  "createdAt": "2025-02-01T00:00:00Z"
}
```

---

### `GET /folders` — 폴더 목록 조회

**Response 200**

```json
{
  "data": [
    {
      "id": "folder_01",
      "name": "NestJS 학습",
      "parentId": null,
      "isDocked": true,
      "visibility": "private",
      "linkCount": 12,
      "createdAt": "2025-02-01T00:00:00Z"
    }
  ]
}
```

---

### `PATCH /folders/:folderId` — 폴더 수정

**Request Body**

```json
{
  "name": "NestJS 심화",
  "parentId": "folder_00",
  "isDocked": true,
  "visibility": "public"
}
```

모든 필드 선택 값이다.

**Response 200**

수정된 폴더 객체 반환.

---

### `DELETE /folders/:folderId` — 폴더 삭제

**Response 200**

```json
{ "message": "폴더가 삭제되었습니다" }
```

폴더 내 링크는 미분류 상태로 이동된다.

---

### `POST /folders/:folderId/share` — 폴더 공유 링크 생성

**Response 201**

```json
{
  "shareUrl": "https://autolink.app/shared/abc123",
  "expiresAt": null
}
```

---

### `GET /shared/:shareToken` — 공유 폴더 조회

인증: 불필요

**Response 200**

```json
{
  "folder": {
    "name": "NestJS 학습",
    "ownerNickname": "개발자"
  },
  "links": [
    {
      "id": "link_01",
      "url": "https://example.com/article",
      "ogTitle": "NestJS Custom Guard 만들기",
      "ogDescription": "...",
      "ogImage": "https://..."
    }
  ]
}
```

---

## 4. Trash (휴지통)

### `GET /trash` — 휴지통 목록 조회

**Request Query**

```
?cursor=link_20&limit=20
```

**Response 200**

```json
{
  "data": [
    {
      "id": "link_05",
      "url": "https://example.com/old",
      "ogTitle": "오래된 글",
      "ogImage": "https://...",
      "deletedAt": "2025-02-01T00:00:00Z",
      "expiresAt": "2025-03-03T00:00:00Z"
    }
  ],
  "nextCursor": "link_21",
  "hasNext": false
}
```

---

### `POST /trash/:linkId/restore` — 링크 복원

**Response 200**

```json
{
  "message": "복원되었습니다",
  "link": {
    "id": "link_05",
    "folderId": "folder_01"
  }
}
```

---

### `DELETE /trash/:linkId` — 영구 삭제

**Response 200**

```json
{ "message": "영구 삭제되었습니다" }
```

---

## 5. Search (검색)

### `GET /search` — 하이브리드 검색

시맨틱 검색 + 키워드 검색을 결합하여 결과를 반환한다.

**Request Query**

```
?q=NestJS에서 커스텀 가드 만드는 방법&limit=10
```

**Response 200**

```json
{
  "data": [
    {
      "id": "link_01",
      "url": "https://example.com/article",
      "ogTitle": "NestJS Custom Guard 만들기",
      "ogImage": "https://...",
      "summary": "NestJS에서 CanActivate 인터페이스를...",
      "tags": ["NestJS", "Guard"],
      "highlight": "...CanActivate 인터페이스를 구현하면 **커스텀 가드**를 만들 수 있습니다...",
      "score": 0.92,
      "folderId": "folder_01"
    }
  ]
}
```

---

## 6. Chat (RAG 질의응답)

### `POST /chat/conversations` — 대화 생성

**Request Body**

```json
{
  "title": "NestJS Guard 관련 질문"
}
```

`title`은 선택 값이다. 미입력 시 첫 질문 기반으로 자동 생성된다.

**Response 201**

```json
{
  "id": "conv_01",
  "title": "NestJS Guard 관련 질문",
  "createdAt": "2025-02-01T00:00:00Z"
}
```

---

### `GET /chat/conversations` — 대화 목록 조회

**Response 200**

```json
{
  "data": [
    {
      "id": "conv_01",
      "title": "NestJS Guard 관련 질문",
      "lastMessagePreview": "CanActivate 인터페이스를 구현하여...",
      "messageCount": 4,
      "createdAt": "2025-02-01T00:00:00Z",
      "updatedAt": "2025-02-01T01:00:00Z"
    }
  ],
  "nextCursor": "conv_10",
  "hasNext": false
}
```

---

### `POST /chat/conversations/:conversationId/messages` — 질문 전송 (스트리밍)

**Request Body**

```json
{
  "content": "NestJS Guard 커스텀 방법 뭐였지?"
}
```

**Response: SSE 스트림**

```
Content-Type: text/event-stream

event: chunk
data: {"text": "NestJS에서 커스텀 "}

event: chunk
data: {"text": "Guard를 만들려면 "}

event: chunk
data: {"text": "CanActivate 인터페이스를 구현하면 됩니다."}

event: sources
data: {"sources": [
  {
    "linkId": "link_01",
    "ogTitle": "NestJS Custom Guard 만들기",
    "url": "https://example.com/article",
    "highlight": "CanActivate 인터페이스를 구현하면..."
  }
]}

event: done
data: {"messageId": "msg_02"}
```

---

### `GET /chat/conversations/:conversationId/messages` — 대화 내역 조회

**Response 200**

```json
{
  "data": [
    {
      "id": "msg_01",
      "role": "user",
      "content": "NestJS Guard 커스텀 방법 뭐였지?",
      "createdAt": "2025-02-01T00:00:00Z"
    },
    {
      "id": "msg_02",
      "role": "assistant",
      "content": "NestJS에서 커스텀 Guard를 만들려면 CanActivate 인터페이스를 구현하면 됩니다.",
      "sources": [
        {
          "linkId": "link_01",
          "ogTitle": "NestJS Custom Guard 만들기",
          "url": "https://example.com/article",
          "highlight": "CanActivate 인터페이스를 구현하면..."
        }
      ],
      "createdAt": "2025-02-01T00:00:01Z"
    }
  ]
}
```

---

### `POST /chat/conversations/:conversationId/messages/:messageId/feedback` — 답변 피드백

**Request Body**

```json
{
  "rating": "up"
}
```

`rating`은 `"up"` 또는 `"down"`.

**Response 200**

```json
{ "message": "피드백이 반영되었습니다" }
```

---

## 7. Recommendation (추천) — Phase 2

### `GET /recommendations/daily` — 오늘의 추천

**Response 200**

```json
{
  "link": {
    "id": "link_15",
    "url": "https://example.com/redis-cache",
    "ogTitle": "Redis 캐싱 전략 가이드",
    "ogImage": "https://...",
    "summary": "Redis를 활용한 캐싱 전략을...",
    "tags": ["Redis", "캐싱"]
  },
  "reason": "최근 NestJS 백엔드 자료를 많이 저장하셨어요. 관련된 캐싱 전략을 추천합니다.",
  "type": "context"
}
```

`type`: `"context"` (맥락 기반) | `"balance"` (균형 추천) | `"unread"` (미읽은 링크)

---

### `GET /recommendations/unread` — 미읽은 링크 목록

3일 이상 열어보지 않은 링크를 반환한다.

**Request Query**

```
?limit=10
```

**Response 200**

```json
{
  "data": [
    {
      "id": "link_08",
      "ogTitle": "Docker Compose 실전 가이드",
      "ogImage": "https://...",
      "daysSinceSaved": 5,
      "createdAt": "2025-02-05T00:00:00Z"
    }
  ],
  "totalUnread": 23
}
```

---

## 8. Dashboard (대시보드) — Phase 2

### `GET /dashboard/heatmap` — 주제별 히트맵

**Request Query**

```
?year=2025
```

**Response 200**

```json
{
  "year": 2025,
  "data": [
    { "date": "2025-02-01", "count": 3, "topics": ["NestJS", "TypeScript"] },
    { "date": "2025-02-02", "count": 1, "topics": ["Docker"] },
    { "date": "2025-02-03", "count": 0, "topics": [] }
  ]
}
```

---

### `GET /dashboard/radar` — 지식 레이더 차트

**Response 200**

```json
{
  "categories": [
    { "name": "프론트엔드", "score": 72, "linkCount": 45 },
    { "name": "백엔드", "score": 85, "linkCount": 63 },
    { "name": "인프라", "score": 30, "linkCount": 12 },
    { "name": "DB", "score": 45, "linkCount": 20 },
    { "name": "AI/ML", "score": 15, "linkCount": 5 }
  ]
}
```

---

### `GET /dashboard/timeline` — 기술 타임라인

**Response 200**

```json
{
  "months": [
    {
      "month": "2025-01",
      "topTopics": ["React", "Next.js", "CSS"],
      "linkCount": 18
    },
    {
      "month": "2025-02",
      "topTopics": ["NestJS", "PostgreSQL", "Docker"],
      "linkCount": 25
    }
  ]
}
```

---

### `GET /dashboard/reading-pattern` — 읽기 패턴 분석

**Response 200**

```json
{
  "preferredTypes": [
    { "type": "블로그", "percentage": 55 },
    { "type": "공식문서", "percentage": 30 },
    { "type": "영상", "percentage": 15 }
  ],
  "activeHours": [
    { "hour": 9, "count": 12 },
    { "hour": 10, "count": 18 },
    { "hour": 22, "count": 25 },
    { "hour": 23, "count": 20 }
  ]
}
```

---

## 9. Insights (인사이트) — Phase 2

### `GET /insights/weaknesses` — 약점 주제 목록

반복 질문으로 감지된 약점 주제를 반환한다.

**Response 200**

```json
{
  "data": [
    {
      "topic": "Docker 네트워크",
      "questionCount": 5,
      "lastAskedAt": "2025-02-10T00:00:00Z",
      "recommendedLinks": [
        {
          "id": "link_22",
          "ogTitle": "Docker 네트워크 심화 가이드",
          "url": "https://..."
        }
      ]
    }
  ]
}
```

---

### `GET /insights/unused-links` — 미활용 링크 목록

저장 후 한 번도 열어보지 않았고 질의응답에도 활용되지 않은 링크를 반환한다.

**Request Query**

```
?limit=10
```

**Response 200**

```json
{
  "data": [
    {
      "id": "link_30",
      "ogTitle": "GraphQL 입문",
      "ogImage": "https://...",
      "daysSinceSaved": 45
    }
  ],
  "totalUnused": 8
}
```

---

### `GET /insights/question-log` — 질문 주제 분석

**Response 200**

```json
{
  "topTopics": [
    { "topic": "NestJS", "count": 15 },
    { "topic": "Docker", "count": 8 },
    { "topic": "TypeScript", "count": 7 },
    { "topic": "PostgreSQL", "count": 5 },
    { "topic": "Redis", "count": 3 }
  ]
}
```

---

### `GET /insights/weekly-review` — 주간 회고 조회

**Request Query**

```
?week=2025-W06
```

미입력 시 이번 주 회고를 반환한다.

**Response 200**

```json
{
  "week": "2025-W06",
  "savedLinks": 12,
  "readLinks": 8,
  "questionsAsked": 5,
  "topTopics": ["NestJS", "Docker", "Redis"],
  "summary": "이번 주는 NestJS 백엔드 아키텍처에 집중했습니다. Docker 관련 자료를 3개 새로 저장했고, Redis 캐싱 전략에 대해 반복적으로 질문했습니다.",
  "createdAt": "2025-02-09T00:00:00Z"
}
```

---

### `POST /insights/weekly-review` — 주간 회고 수동 생성

**Response 201**

주간 회고 객체 반환 (위와 동일 구조).

---

## 10. Knowledge Graph (지식 연결) — Phase 3

### `GET /links/:linkId/related` — 관련 링크 조회

**Response 200**

```json
{
  "data": [
    {
      "id": "link_05",
      "ogTitle": "NestJS Middleware vs Guard 차이",
      "ogImage": "https://...",
      "tags": ["NestJS", "Middleware"],
      "similarity": 0.87,
      "folder": { "id": "folder_02", "name": "NestJS 심화" }
    },
    {
      "id": "link_42",
      "ogTitle": "Express vs NestJS 비교",
      "ogImage": "https://...",
      "tags": ["NestJS", "Express"],
      "similarity": 0.73,
      "folder": { "id": "folder_01", "name": "NestJS 학습" }
    }
  ]
}
```

---

### `GET /knowledge-graph` — 지식 그래프 데이터

**Request Query**

```
?folderId=folder_01&depth=2
```

모든 필드 선택 값이다. 미입력 시 전체 그래프를 반환한다.

**Response 200**

```json
{
  "nodes": [
    { "id": "link_01", "type": "link", "label": "NestJS Custom Guard", "tags": ["NestJS"] },
    { "id": "link_05", "type": "link", "label": "Middleware vs Guard", "tags": ["NestJS"] },
    { "id": "link_42", "type": "link", "label": "Express vs NestJS", "tags": ["NestJS"] }
  ],
  "edges": [
    { "source": "link_01", "target": "link_05", "weight": 0.87 },
    { "source": "link_01", "target": "link_42", "weight": 0.73 },
    { "source": "link_05", "target": "link_42", "weight": 0.65 }
  ]
}
```

---

## 11. Integrations (외부 연동) — Phase 3

### `POST /integrations/github/connect` — GitHub 연동

**Request Body**

```json
{
  "code": "github_oauth_code"
}
```

GitHub OAuth 인증 코드를 전달한다.

**Response 200**

```json
{
  "connected": true,
  "githubUsername": "developer123",
  "connectedAt": "2025-02-01T00:00:00Z"
}
```

---

### `DELETE /integrations/github` — GitHub 연동 해제

**Response 200**

```json
{ "message": "GitHub 연동이 해제되었습니다" }
```

---

### `GET /integrations/github/recommendations` — GitHub 기반 추천

**Response 200**

```json
{
  "recentKeywords": ["Redis", "Bull Queue", "NestJS"],
  "recommendations": [
    {
      "id": "link_15",
      "ogTitle": "Redis 캐싱 전략 가이드",
      "ogImage": "https://...",
      "matchedKeyword": "Redis"
    }
  ]
}
```

---

### `POST /integrations/rss` — RSS 피드 등록

**Request Body**

```json
{
  "feedUrl": "https://blog.example.com/rss"
}
```

**Response 201**

```json
{
  "id": "rss_01",
  "feedUrl": "https://blog.example.com/rss",
  "title": "Example Blog",
  "createdAt": "2025-02-01T00:00:00Z"
}
```

---

### `GET /integrations/rss` — RSS 피드 목록 조회

**Response 200**

```json
{
  "data": [
    {
      "id": "rss_01",
      "feedUrl": "https://blog.example.com/rss",
      "title": "Example Blog",
      "lastFetchedAt": "2025-02-10T00:00:00Z",
      "newItemCount": 3
    }
  ]
}
```

---

### `DELETE /integrations/rss/:rssId` — RSS 피드 삭제

**Response 200**

```json
{ "message": "RSS 피드가 삭제되었습니다" }
```

---

### `POST /interview/start` — 면접 준비 모드 시작

**Request Body**

```json
{
  "topics": ["NestJS", "Docker", "PostgreSQL"],
  "count": 5
}
```

`topics` 미입력 시 전체 저장 자료 기반으로 출제한다.

**Response 201**

```json
{
  "sessionId": "interview_01",
  "questions": [
    {
      "id": "q_01",
      "question": "NestJS에서 Guard와 Middleware의 차이점을 설명해주세요.",
      "relatedLinkIds": ["link_01", "link_05"]
    },
    {
      "id": "q_02",
      "question": "Docker Compose에서 네트워크를 분리하는 이유는 무엇인가요?",
      "relatedLinkIds": ["link_08"]
    }
  ]
}
```

---

### `POST /interview/:sessionId/answer` — 면접 답변 제출

**Request Body**

```json
{
  "questionId": "q_01",
  "answer": "Guard는 인가 처리에 특화되어 있고, Middleware는 요청 전처리에 사용됩니다."
}
```

**Response 200**

```json
{
  "questionId": "q_01",
  "evaluation": "핵심을 잘 짚었습니다. 추가로 실행 순서(Middleware → Guard → Interceptor)와 ExecutionContext 활용에 대해 보충하면 더 좋겠습니다.",
  "gaps": ["실행 순서", "ExecutionContext"],
  "relatedLinks": [
    {
      "id": "link_01",
      "ogTitle": "NestJS Custom Guard 만들기",
      "relevantSection": "Guard는 ExecutionContext를 통해..."
    }
  ]
}
```

---

## 12. Workspaces (워크스페이스) — Phase 4

### `POST /workspaces` — 워크스페이스 생성

**Request Body**

```json
{
  "name": "회사 팀 자료",
  "description": "백엔드 팀 기술 자료 모음"
}
```

**Response 201**

```json
{
  "id": "ws_02",
  "name": "회사 팀 자료",
  "description": "백엔드 팀 기술 자료 모음",
  "role": "admin",
  "memberCount": 1,
  "createdAt": "2025-02-01T00:00:00Z"
}
```

---

### `GET /workspaces` — 내 워크스페이스 목록 조회

**Response 200**

```json
{
  "data": [
    {
      "id": "ws_01",
      "name": "개인",
      "description": null,
      "role": "admin",
      "memberCount": 1,
      "linkCount": 150
    },
    {
      "id": "ws_02",
      "name": "회사 팀 자료",
      "description": "백엔드 팀 기술 자료 모음",
      "role": "admin",
      "memberCount": 4,
      "linkCount": 85
    }
  ]
}
```

---

### `PATCH /workspaces/:workspaceId` — 워크스페이스 수정

권한: admin

**Request Body**

```json
{
  "name": "백엔드 팀",
  "description": "수정된 설명"
}
```

**Response 200**

수정된 워크스페이스 객체 반환.

---

### `DELETE /workspaces/:workspaceId` — 워크스페이스 삭제

권한: admin

**Response 200**

```json
{ "message": "워크스페이스가 삭제되었습니다" }
```

---

### `POST /workspaces/:workspaceId/invite` — 멤버 초대

권한: admin

**Request Body**

```json
{
  "email": "teammate@example.com",
  "role": "member"
}
```

`role`: `"admin"` | `"member"`

**Response 201**

```json
{
  "inviteId": "inv_01",
  "email": "teammate@example.com",
  "role": "member",
  "status": "pending",
  "expiresAt": "2025-02-08T00:00:00Z"
}
```

초대 이메일이 발송된다.

---

### `GET /workspaces/:workspaceId/members` — 멤버 목록 조회

**Response 200**

```json
{
  "data": [
    {
      "userId": "user_01",
      "nickname": "개발자",
      "email": "user@example.com",
      "role": "admin",
      "joinedAt": "2025-02-01T00:00:00Z"
    },
    {
      "userId": "user_02",
      "nickname": "팀원A",
      "email": "teammate@example.com",
      "role": "member",
      "joinedAt": "2025-02-03T00:00:00Z"
    }
  ]
}
```

---

### `PATCH /workspaces/:workspaceId/members/:userId` — 멤버 권한 변경

권한: admin

**Request Body**

```json
{
  "role": "admin"
}
```

**Response 200**

```json
{ "userId": "user_02", "role": "admin" }
```

---

### `DELETE /workspaces/:workspaceId/members/:userId` — 멤버 제거

권한: admin

**Response 200**

```json
{ "message": "멤버가 제거되었습니다" }
```

---

### `POST /invites/:inviteToken/accept` — 초대 수락

**Response 200**

```json
{
  "workspaceId": "ws_02",
  "workspaceName": "회사 팀 자료",
  "role": "member"
}
```

---

## 13. Community (커뮤니티) — Phase 4

### `POST /subscriptions/:userId` — 유저 구독

**Response 201**

```json
{
  "subscribedTo": "user_05",
  "nickname": "시니어개발자",
  "createdAt": "2025-02-01T00:00:00Z"
}
```

---

### `DELETE /subscriptions/:userId` — 구독 취소

**Response 200**

```json
{ "message": "구독이 취소되었습니다" }
```

---

### `GET /subscriptions` — 내 구독 목록

**Response 200**

```json
{
  "data": [
    {
      "userId": "user_05",
      "nickname": "시니어개발자",
      "newLinksCount": 3,
      "subscribedAt": "2025-02-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /trending` — 인기 링크 트렌드

인증: 불필요

**Request Query**

```
?period=week&limit=20
```

`period`: `"day"` | `"week"` | `"month"`

**Response 200**

```json
{
  "period": "week",
  "data": [
    {
      "id": "link_100",
      "url": "https://example.com/trending-article",
      "ogTitle": "2025 프론트엔드 트렌드",
      "ogImage": "https://...",
      "saveCount": 342,
      "tags": ["프론트엔드", "트렌드"]
    }
  ]
}
```

---

### `GET /profiles/:userId` — 공개 프로필 조회

인증: 불필요

**Response 200**

```json
{
  "userId": "user_05",
  "nickname": "시니어개발자",
  "profilePublic": true,
  "strengths": ["NestJS", "시스템 설계", "PostgreSQL"],
  "publicFolders": [
    {
      "id": "folder_10",
      "name": "NestJS 마스터",
      "linkCount": 30
    }
  ],
  "subscriberCount": 128,
  "totalPublicLinks": 85
}
```

**Error 404**

```json
{ "statusCode": 404, "message": "공개 프로필이 없습니다" }
```

---

### `PATCH /profiles/me` — 내 프로필 설정

**Request Body**

```json
{
  "profilePublic": true
}
```

**Response 200**

```json
{
  "profilePublic": true,
  "message": "프로필이 공개로 설정되었습니다"
}
```

---

## 14. Notifications (알림)

### `GET /notifications` — 알림 목록 조회

**Request Query**

```
?cursor=notif_20&limit=20&unreadOnly=true
```

**Response 200**

```json
{
  "data": [
    {
      "id": "notif_01",
      "type": "subscription_new_link",
      "message": "시니어개발자님이 새 링크를 공개했습니다",
      "data": { "userId": "user_05", "linkId": "link_100" },
      "read": false,
      "createdAt": "2025-02-10T00:00:00Z"
    },
    {
      "id": "notif_02",
      "type": "content_updated",
      "message": "저장한 링크의 원본이 업데이트되었습니다",
      "data": { "linkId": "link_01" },
      "read": false,
      "createdAt": "2025-02-10T00:00:00Z"
    },
    {
      "id": "notif_03",
      "type": "unread_reminder",
      "message": "아직 안 읽은 링크가 5개 있습니다",
      "data": { "count": 5 },
      "read": true,
      "createdAt": "2025-02-09T00:00:00Z"
    }
  ],
  "nextCursor": "notif_21",
  "hasNext": false
}
```

알림 타입: `subscription_new_link` | `content_updated` | `unread_reminder` | `unused_links` | `weakness_detected` | `workspace_invite` | `rss_new_items`

---

### `PATCH /notifications/:notificationId/read` — 알림 읽음 처리

**Response 200**

```json
{ "read": true }
```

---

### `PATCH /notifications/read-all` — 전체 읽음 처리

**Response 200**

```json
{ "message": "모든 알림을 읽음 처리했습니다", "updatedCount": 12 }
```
