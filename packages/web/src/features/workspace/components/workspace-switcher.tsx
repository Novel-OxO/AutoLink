'use client';

import { Building2 } from 'lucide-react';

import { useWorkspaceListQuery } from '../hooks/use-workspace-query';
import { useWorkspaceStore } from '../stores/workspace.store';

interface WorkspaceSwitcherProps {
  enabled: boolean;
}

export function WorkspaceSwitcher({ enabled }: WorkspaceSwitcherProps): React.JSX.Element | null {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const defaultWorkspaceId = useWorkspaceStore((state) => state.defaultWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);
  const { data: workspaces = [], isLoading } = useWorkspaceListQuery(enabled);

  if (!enabled) {
    return null;
  }

  const selectedWorkspaceId = activeWorkspaceId ?? defaultWorkspaceId ?? workspaces[0]?.id ?? '';

  return (
    <div className="px-4 pb-4">
      <label
        htmlFor="workspace-switcher"
        className="mb-2 flex items-center gap-2 text-xs text-neutral-35"
      >
        <Building2 className="size-3.5" />
        워크스페이스
      </label>
      <select
        id="workspace-switcher"
        value={selectedWorkspaceId}
        onChange={(event) => setActiveWorkspaceId(Number(event.target.value))}
        disabled={isLoading || workspaces.length === 0}
        className="w-full rounded-md border border-neutral-70 bg-neutral-80 px-3 py-2 text-sm text-neutral-10 outline-none focus:border-mint-40"
      >
        {workspaces.length === 0 ? (
          <option value="">워크스페이스 없음</option>
        ) : (
          workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
