현재 브랜치를 main 기준으로 rebase하고 로컬을 정리한다. `git`을 사용한다.

## 절차

1. 현재 브랜치명을 확인한다
2. `main` 브랜치를 최신화한다 (`git fetch origin main`)
3. 현재 브랜치를 `origin/main` 기준으로 rebase한다
4. 충돌이 있으면 안내하고 해결을 돕는다
5. 병합 완료된 로컬 브랜치가 있으면 삭제를 제안한다

## 규칙

- `main` 브랜치에서는 rebase를 실행하지 않는다 (경고 후 중단)
- 충돌 발생 시 `git rebase --abort` 옵션을 안내한다
- rebase 완료 후 원격에 이미 푸시된 브랜치라면 `--force-with-lease` 푸시가 필요함을 안내한다
- 병합 완료된 브랜치 정리: `git branch --merged main` 확인 후 삭제 제안
