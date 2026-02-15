import type { WorkspaceMemberResponse, WorkspaceResponse } from '@autolink/shared/types';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

export const workspaceQueryKeys = {
  all: ['workspace'] as const,
  list: () => ['workspace', 'list'] as const,
  members: (workspaceId: number) => ['workspace', workspaceId, 'members'] as const,
};

export function useWorkspaceListQuery(enabled = true) {
  return useQuery<WorkspaceResponse[], Error>({
    queryKey: workspaceQueryKeys.list(),
    queryFn: async () => {
      const response = await apiClient.listWorkspaces();
      return response.data;
    },
    enabled,
    staleTime: 1000 * 60,
  });
}

export function useWorkspaceMembersQuery(workspaceId: number | null) {
  return useQuery<WorkspaceMemberResponse[], Error>({
    queryKey:
      workspaceId === null
        ? ['workspace', 'members', 'none']
        : workspaceQueryKeys.members(workspaceId),
    queryFn: async () => {
      if (workspaceId === null) {
        return [];
      }

      const response = await apiClient.listWorkspaceMembers(workspaceId);
      return response.data;
    },
    enabled: workspaceId !== null,
    staleTime: 1000 * 30,
  });
}
