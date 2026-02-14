PR을 squash merge로 병합한다. `gh` CLI를 사용한다.

## 절차

1. `gh pr list`로 병합 가능한 PR 목록을 확인한다
2. 사용자에게 병합할 PR 번호를 확인한다 (또는 현재 브랜치의 PR을 자동 감지)
3. `gh pr checks`로 CI 체크 상태를 확인한다
4. `gh pr view`로 PR 상세 정보를 출력한다
5. 사용자 확인 후 `gh pr merge --squash --delete-branch`로 병합한다
6. 병합 결과를 출력한다

## 규칙

- 반드시 **squash merge**만 사용한다 (`--squash`)
- `--delete-branch`로 원격 브랜치를 자동 삭제한다
- CI 체크가 실패 상태면 병합하지 않고 경고한다
- 병합 전 반드시 사용자에게 확인을 받는다
