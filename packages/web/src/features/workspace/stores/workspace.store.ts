import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SyncWorkspaceContextParams {
  workspaceIds: number[];
  defaultWorkspaceId: number | null;
}

interface WorkspaceStore {
  activeWorkspaceId: number | null;
  defaultWorkspaceId: number | null;
  setActiveWorkspaceId: (workspaceId: number | null) => void;
  syncWorkspaceContext: (params: SyncWorkspaceContextParams) => void;
  clearWorkspaceContext: () => void;
}

const workspaceStorage =
  typeof window === 'undefined'
    ? undefined
    : createJSONStorage<Pick<WorkspaceStore, 'activeWorkspaceId' | 'defaultWorkspaceId'>>(
        () => localStorage,
      );

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      defaultWorkspaceId: null,
      setActiveWorkspaceId: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
      syncWorkspaceContext: ({ workspaceIds, defaultWorkspaceId }) =>
        set((state) => {
          const hasValidActiveWorkspace =
            state.activeWorkspaceId !== null && workspaceIds.includes(state.activeWorkspaceId);

          return {
            defaultWorkspaceId,
            activeWorkspaceId: hasValidActiveWorkspace
              ? state.activeWorkspaceId
              : defaultWorkspaceId,
          };
        }),
      clearWorkspaceContext: () =>
        set({
          activeWorkspaceId: null,
          defaultWorkspaceId: null,
        }),
    }),
    {
      name: 'autolink-workspace',
      storage: workspaceStorage,
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        defaultWorkspaceId: state.defaultWorkspaceId,
      }),
    },
  ),
);
