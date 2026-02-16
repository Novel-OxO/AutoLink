import { beforeEach, describe, expect, it } from 'vitest';

import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';

describe('workspace.store', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      activeWorkspaceId: null,
      defaultWorkspaceId: null,
    });
  });

  it('syncWorkspaceContext는 active 값이 없으면 default를 active로 설정한다', () => {
    useWorkspaceStore.getState().syncWorkspaceContext({
      workspaceIds: [3, 7],
      defaultWorkspaceId: 3,
    });

    const state = useWorkspaceStore.getState();
    expect(state.defaultWorkspaceId).toBe(3);
    expect(state.activeWorkspaceId).toBe(3);
  });

  it('syncWorkspaceContext는 기존 activeWorkspaceId가 유효하면 유지한다', () => {
    useWorkspaceStore.setState({
      activeWorkspaceId: 7,
      defaultWorkspaceId: 3,
    });

    useWorkspaceStore.getState().syncWorkspaceContext({
      workspaceIds: [3, 7, 9],
      defaultWorkspaceId: 3,
    });

    const state = useWorkspaceStore.getState();
    expect(state.defaultWorkspaceId).toBe(3);
    expect(state.activeWorkspaceId).toBe(7);
  });

  it('syncWorkspaceContext는 기존 activeWorkspaceId가 유효하지 않으면 default로 교체한다', () => {
    useWorkspaceStore.setState({
      activeWorkspaceId: 99,
      defaultWorkspaceId: 1,
    });

    useWorkspaceStore.getState().syncWorkspaceContext({
      workspaceIds: [5, 6],
      defaultWorkspaceId: 5,
    });

    const state = useWorkspaceStore.getState();
    expect(state.defaultWorkspaceId).toBe(5);
    expect(state.activeWorkspaceId).toBe(5);
  });

  it('clearWorkspaceContext는 state를 초기화한다', () => {
    useWorkspaceStore.setState({
      activeWorkspaceId: 10,
      defaultWorkspaceId: 4,
    });

    useWorkspaceStore.getState().clearWorkspaceContext();

    const state = useWorkspaceStore.getState();
    expect(state.activeWorkspaceId).toBeNull();
    expect(state.defaultWorkspaceId).toBeNull();
  });
});
