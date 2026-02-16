'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { withAuth } from '@/features/auth';

import { useAcceptWorkspaceInviteMutation } from '../hooks/use-workspace-actions';
import { getWorkspaceErrorMessage } from '../lib/workspace-error-message';
import { useWorkspaceStore } from '../stores/workspace.store';

interface InviteAcceptPageProps {
  inviteToken: string;
}

function InviteAcceptPageContent({ inviteToken }: InviteAcceptPageProps): React.JSX.Element {
  const router = useRouter();
  const didAttemptRef = useRef(false);
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);

  const acceptInviteMutation = useAcceptWorkspaceInviteMutation();
  const [statusMessage, setStatusMessage] = useState<string>('초대 정보를 확인하고 있습니다...');

  // 인증된 사용자만 초대 수락 로직 실행
  useEffect(() => {
    if (didAttemptRef.current) {
      return;
    }

    didAttemptRef.current = true;

    void (async () => {
      try {
        const accepted = await acceptInviteMutation.mutateAsync(inviteToken);
        setActiveWorkspaceId(accepted.workspaceId);
        setStatusMessage(`'${accepted.workspaceName}' 워크스페이스에 참여했습니다. 이동 중...`);
        router.replace('/workspace');
      } catch (error) {
        setStatusMessage(getWorkspaceErrorMessage(error, '초대 수락에 실패했습니다.'));
      }
    })();
  }, [acceptInviteMutation, inviteToken, router, setActiveWorkspaceId]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center justify-center p-8">
      <div className="w-full space-y-4 rounded-lg border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">초대 수락</h1>
        <p className="text-sm text-muted-foreground">{statusMessage}</p>

        <div className="flex justify-center gap-2">
          <Button onClick={() => router.push('/workspace')} className="cursor-pointer">
            워크스페이스로 이동
          </Button>
          <Button variant="outline" onClick={() => router.push('/')} className="cursor-pointer">
            홈으로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}

// HOC로 감싸서 export
export const InviteAcceptPage = withAuth(InviteAcceptPageContent);
