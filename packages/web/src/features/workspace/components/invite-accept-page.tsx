'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { LoginModal, useAuth } from '@/features/auth';

import { useAcceptWorkspaceInviteMutation } from '../hooks/use-workspace-actions';
import { getWorkspaceErrorMessage } from '../lib/workspace-error-message';
import { useWorkspaceStore } from '../stores/workspace.store';

interface InviteAcceptPageProps {
  inviteToken: string;
}

export function InviteAcceptPage({ inviteToken }: InviteAcceptPageProps): React.JSX.Element {
  const router = useRouter();
  const didAttemptRef = useRef(false);

  const { isAuthenticated, isLoading, openLoginModal, isLoginModalOpen, closeLoginModal } =
    useAuth();
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);

  const acceptInviteMutation = useAcceptWorkspaceInviteMutation();
  const [statusMessage, setStatusMessage] = useState<string>('초대 정보를 확인하고 있습니다...');

  useEffect(() => {
    if (!isAuthenticated || isLoading || didAttemptRef.current) {
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
  }, [acceptInviteMutation, inviteToken, isAuthenticated, isLoading, router, setActiveWorkspaceId]);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">로그인 상태를 확인하는 중...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center justify-center p-8">
        <div className="w-full rounded-lg border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">초대 수락</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            초대를 수락하려면 먼저 로그인해주세요.
          </p>
          <Button onClick={openLoginModal} className="mt-4 cursor-pointer">
            로그인하기
          </Button>
          <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
        </div>
      </div>
    );
  }

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
}
