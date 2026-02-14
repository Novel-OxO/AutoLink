변경 사항을 Conventional Commits 규칙에 따라 커밋한다. `git`을 사용한다.

## 절차

1. `git status`와 `git diff`로 변경 사항을 확인한다
2. 최근 커밋 로그를 확인하여 스타일을 참고한다
3. 변경 내용을 분석하여 적절한 type과 scope를 결정한다
4. 한국어로 커밋 메시지를 작성한다
5. 관련 파일을 스테이징하고 커밋한다

## 커밋 메시지 형식

```
<type>(<scope>): <한국어 설명>
```

**type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `build`, `revert`

**scope**: `server`, `web`, `app`, `shared`, `config`, `docs`, `deps`, `ci`

## 규칙

- 커밋 메시지 설명은 **한국어**로 작성
- scope는 반드시 지정
- 하나의 커밋에 하나의 논리적 변경만 포함
- `.env` 등 민감한 파일은 커밋하지 않는다
- `git add .` 대신 관련 파일만 개별 스테이징한다
