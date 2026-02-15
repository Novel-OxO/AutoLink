import type {
  CreateInvite,
  CreateWorkspace,
  UpdateWorkspace,
  WorkspaceRole,
} from '@autolink/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

import { workspaceQueryKeys } from './use-workspace-query';

function invalidateWorkspaceRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list() });
  queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
}

export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspace) => apiClient.createWorkspace(input),
    onSuccess: () => {
      invalidateWorkspaceRelatedQueries(queryClient);
    },
  });
}

export function useUpdateWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, input }: { workspaceId: number; input: UpdateWorkspace }) =>
      apiClient.updateWorkspace(workspaceId, input),
    onSuccess: (_workspace, variables) => {
      invalidateWorkspaceRelatedQueries(queryClient);
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.members(variables.workspaceId),
      });
    },
  });
}

export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: number) => apiClient.deleteWorkspace(workspaceId),
    onSuccess: () => {
      invalidateWorkspaceRelatedQueries(queryClient);
    },
  });
}

export function useUpdateWorkspaceMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: number;
      userId: number;
      role: WorkspaceRole;
    }) => apiClient.updateWorkspaceMemberRole(workspaceId, userId, { role }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.members(variables.workspaceId),
      });
      invalidateWorkspaceRelatedQueries(queryClient);
    },
  });
}

export function useRemoveWorkspaceMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: number; userId: number }) =>
      apiClient.removeWorkspaceMember(workspaceId, userId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.members(variables.workspaceId),
      });
      invalidateWorkspaceRelatedQueries(queryClient);
    },
  });
}

export function useCreateWorkspaceInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, input }: { workspaceId: number; input: CreateInvite }) =>
      apiClient.createWorkspaceInvite(workspaceId, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.members(variables.workspaceId),
      });
    },
  });
}

export function useAcceptWorkspaceInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteToken: string) => apiClient.acceptWorkspaceInvite(inviteToken),
    onSuccess: () => {
      invalidateWorkspaceRelatedQueries(queryClient);
    },
  });
}
