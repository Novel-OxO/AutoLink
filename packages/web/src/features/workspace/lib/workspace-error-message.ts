const workspaceErrorMessages: Record<string, string> = {
  WORKSPACE_NOT_FOUND: '워크스페이스를 찾을 수 없습니다.',
  WORKSPACE_ACCESS_DENIED: '워크스페이스 접근 권한이 없습니다.',
  WORKSPACE_ADMIN_REQUIRED: '관리자 권한이 필요한 작업입니다.',
  WORKSPACE_MEMBER_NOT_FOUND: '워크스페이스 멤버를 찾을 수 없습니다.',
  WORKSPACE_LAST_ADMIN_REQUIRED: '최소 한 명의 관리자는 남아 있어야 합니다.',
  WORKSPACE_MEMBER_ALREADY_EXISTS: '이미 워크스페이스에 참여 중인 사용자입니다.',
  WORKSPACE_INVITE_NOT_FOUND: '초대를 찾을 수 없습니다.',
  WORKSPACE_INVITE_EXPIRED: '초대가 만료되었습니다.',
  WORKSPACE_INVITE_ALREADY_ACCEPTED: '이미 수락된 초대입니다.',
  WORKSPACE_INVITE_EMAIL_MISMATCH: '초대받은 이메일과 로그인 계정이 일치하지 않습니다.',
  WORKSPACE_INVITE_ALREADY_PENDING: '이미 대기 중인 초대가 있습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
};

export function getWorkspaceErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  return workspaceErrorMessages[error.message] ?? error.message ?? fallback;
}
