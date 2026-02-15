'use client';

import type { WorkspaceRole } from '@autolink/shared/types';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoginModal, useAuth } from '@/features/auth';

import {
  useCreateWorkspaceInviteMutation,
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useRemoveWorkspaceMemberMutation,
  useUpdateWorkspaceMemberRoleMutation,
  useUpdateWorkspaceMutation,
} from '@/features/workspace/hooks/use-workspace-actions';
import {
  useWorkspaceListQuery,
  useWorkspaceMembersQuery,
} from '@/features/workspace/hooks/use-workspace-query';
import { getWorkspaceErrorMessage } from '@/features/workspace/lib/workspace-error-message';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

export default function WorkspacePage(): React.JSX.Element {
  const { isAuthenticated, isLoading, openLoginModal, isLoginModalOpen, closeLoginModal } =
    useAuth();

  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const defaultWorkspaceId = useWorkspaceStore((state) => state.defaultWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);

  const { data: workspaces = [], isLoading: isWorkspaceLoading } =
    useWorkspaceListQuery(isAuthenticated);

  const selectedWorkspaceId = useMemo(() => {
    if (activeWorkspaceId !== null) {
      return activeWorkspaceId;
    }

    if (defaultWorkspaceId !== null) {
      return defaultWorkspaceId;
    }

    return workspaces[0]?.id ?? null;
  }, [activeWorkspaceId, defaultWorkspaceId, workspaces]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );

  const isAdmin = selectedWorkspace?.role === 'ADMIN';

  const { data: members = [], isLoading: isMembersLoading } =
    useWorkspaceMembersQuery(selectedWorkspaceId);

  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const updateWorkspaceMutation = useUpdateWorkspaceMutation();
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();
  const updateMemberRoleMutation = useUpdateWorkspaceMemberRoleMutation();
  const removeMemberMutation = useRemoveWorkspaceMemberMutation();
  const createInviteMutation = useCreateWorkspaceInviteMutation();

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('MEMBER');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (workspaces.length === 0) {
      if (activeWorkspaceId !== null) {
        setActiveWorkspaceId(null);
      }
      return;
    }

    const hasValidActiveWorkspace =
      selectedWorkspaceId !== null &&
      workspaces.some((workspace) => workspace.id === selectedWorkspaceId);

    if (!hasValidActiveWorkspace) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [isAuthenticated, workspaces, activeWorkspaceId, selectedWorkspaceId, setActiveWorkspaceId]);

  useEffect(() => {
    if (!selectedWorkspace) {
      setEditName('');
      setEditDescription('');
      return;
    }

    setEditName(selectedWorkspace.name);
    setEditDescription(selectedWorkspace.description ?? '');
  }, [selectedWorkspace]);

  function setErrorMessage(error: unknown, fallback: string) {
    setFeedback({
      type: 'error',
      message: getWorkspaceErrorMessage(error, fallback),
    });
  }

  async function handleCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = createName.trim();
    const description = createDescription.trim();

    if (name.length === 0) {
      setFeedback({
        type: 'error',
        message: '워크스페이스 이름을 입력해주세요.',
      });
      return;
    }

    try {
      const workspace = await createWorkspaceMutation.mutateAsync({
        name,
        description: description.length > 0 ? description : undefined,
      });

      setCreateName('');
      setCreateDescription('');
      setActiveWorkspaceId(workspace.id);
      setFeedback({ type: 'success', message: '워크스페이스를 생성했습니다.' });
    } catch (error) {
      setErrorMessage(error, '워크스페이스 생성에 실패했습니다.');
    }
  }

  async function handleUpdateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedWorkspace) {
      setFeedback({
        type: 'error',
        message: '수정할 워크스페이스를 선택해주세요.',
      });
      return;
    }

    const name = editName.trim();
    const description = editDescription.trim();

    if (name.length === 0) {
      setFeedback({
        type: 'error',
        message: '워크스페이스 이름을 입력해주세요.',
      });
      return;
    }

    try {
      await updateWorkspaceMutation.mutateAsync({
        workspaceId: selectedWorkspace.id,
        input: {
          name,
          description: description.length > 0 ? description : null,
        },
      });

      setFeedback({ type: 'success', message: '워크스페이스를 수정했습니다.' });
    } catch (error) {
      setErrorMessage(error, '워크스페이스 수정에 실패했습니다.');
    }
  }

  async function handleDeleteWorkspace() {
    if (!selectedWorkspace) {
      return;
    }

    const confirmed = window.confirm(`'${selectedWorkspace.name}' 워크스페이스를 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteWorkspaceMutation.mutateAsync(selectedWorkspace.id);
      setFeedback({ type: 'success', message: '워크스페이스를 삭제했습니다.' });
    } catch (error) {
      setErrorMessage(error, '워크스페이스 삭제에 실패했습니다.');
    }
  }

  async function handleUpdateMemberRole(userId: number, role: WorkspaceRole) {
    if (!selectedWorkspace) {
      return;
    }

    try {
      await updateMemberRoleMutation.mutateAsync({
        workspaceId: selectedWorkspace.id,
        userId,
        role,
      });
      setFeedback({ type: 'success', message: '멤버 권한을 변경했습니다.' });
    } catch (error) {
      setErrorMessage(error, '멤버 권한 변경에 실패했습니다.');
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!selectedWorkspace) {
      return;
    }

    const confirmed = window.confirm('해당 멤버를 워크스페이스에서 제거할까요?');
    if (!confirmed) {
      return;
    }

    try {
      await removeMemberMutation.mutateAsync({
        workspaceId: selectedWorkspace.id,
        userId,
      });
      setFeedback({ type: 'success', message: '멤버를 제거했습니다.' });
    } catch (error) {
      setErrorMessage(error, '멤버 제거에 실패했습니다.');
    }
  }

  async function handleCreateInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedWorkspace) {
      setFeedback({
        type: 'error',
        message: '초대할 워크스페이스를 선택해주세요.',
      });
      return;
    }

    const email = inviteEmail.trim();

    if (email.length === 0) {
      setFeedback({ type: 'error', message: '이메일을 입력해주세요.' });
      return;
    }

    try {
      await createInviteMutation.mutateAsync({
        workspaceId: selectedWorkspace.id,
        input: {
          email,
          role: inviteRole,
        },
      });

      setInviteEmail('');
      setFeedback({ type: 'success', message: '초대를 생성했습니다.' });
    } catch (error) {
      setErrorMessage(error, '초대 생성에 실패했습니다.');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">사용자 정보를 불러오는 중...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">워크스페이스</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          워크스페이스 관리 기능을 사용하려면 로그인이 필요합니다.
        </p>
        <Button onClick={openLoginModal} className="mt-4 cursor-pointer">
          로그인하기
        </Button>
        <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      </div>
    );
  }

  if (isWorkspaceLoading) {
    return <div className="p-8 text-sm text-muted-foreground">워크스페이스를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">워크스페이스</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          워크스페이스 전환, 멤버 관리, 초대 생성을 처리할 수 있습니다.
        </p>
      </div>

      {feedback ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-mint-20 bg-mint-1 text-mint-50'
              : 'border-red-20 bg-red-1 text-red-50'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="space-y-4 rounded-lg border bg-card p-5">
          <h2 className="text-lg font-medium">워크스페이스 관리</h2>

          <div className="space-y-2">
            <label htmlFor="active-workspace" className="text-sm text-muted-foreground">
              현재 워크스페이스
            </label>
            <select
              id="active-workspace"
              value={selectedWorkspaceId ?? ''}
              onChange={(event) => setActiveWorkspaceId(Number(event.target.value))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} ({workspace.role})
                </option>
              ))}
            </select>
          </div>

          <Separator />

          <form onSubmit={handleCreateWorkspace} className="space-y-3">
            <h3 className="text-sm font-medium">새 워크스페이스 생성</h3>
            <input
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="워크스페이스 이름"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              placeholder="설명 (선택)"
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <Button
              type="submit"
              disabled={createWorkspaceMutation.isPending}
              className="cursor-pointer"
            >
              생성하기
            </Button>
          </form>

          <Separator />

          <form onSubmit={handleUpdateWorkspace} className="space-y-3">
            <h3 className="text-sm font-medium">선택 워크스페이스 수정</h3>
            <input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              disabled={!selectedWorkspace || !isAdmin}
              placeholder="워크스페이스 이름"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
            <textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              disabled={!selectedWorkspace || !isAdmin}
              placeholder="설명"
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!selectedWorkspace || !isAdmin || updateWorkspaceMutation.isPending}
                className="cursor-pointer"
              >
                수정하기
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!selectedWorkspace || !isAdmin || deleteWorkspaceMutation.isPending}
                onClick={handleDeleteWorkspace}
                className="cursor-pointer"
              >
                삭제하기
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-4 rounded-lg border bg-card p-5">
          <h2 className="text-lg font-medium">멤버 & 초대</h2>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">멤버 목록</h3>
            {isMembersLoading ? (
              <p className="text-sm text-muted-foreground">멤버를 불러오는 중...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">멤버가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member) => (
                  <li key={member.userId} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{member.nickname}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <span className="rounded bg-muted px-2 py-1 text-xs">{member.role}</span>
                    </div>

                    {isAdmin ? (
                      <div className="mt-3 flex gap-2">
                        <select
                          value={member.role}
                          onChange={(event) =>
                            handleUpdateMemberRole(
                              member.userId,
                              event.target.value as WorkspaceRole,
                            )
                          }
                          className="rounded-md border bg-background px-2 py-1 text-xs"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MEMBER">MEMBER</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="cursor-pointer"
                        >
                          제거
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          <form onSubmit={handleCreateInvite} className="space-y-3">
            <h3 className="text-sm font-medium">멤버 초대</h3>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              disabled={!selectedWorkspace || !isAdmin}
              placeholder="초대할 이메일"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as WorkspaceRole)}
              disabled={!selectedWorkspace || !isAdmin}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="MEMBER">MEMBER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <Button
              type="submit"
              disabled={!selectedWorkspace || !isAdmin || createInviteMutation.isPending}
              className="cursor-pointer"
            >
              초대 생성
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
