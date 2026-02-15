import { useCallback, useEffect } from "react";

import { useWorkspaceStore } from "@/features/workspace";

import { env } from "@/lib/env";
import { useAuthStore } from "../stores/auth.store";
import { useAuthQuery, useLogoutMutation } from "./use-auth-query";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useAuthQuery();
  const logoutMutation = useLogoutMutation();
  const { isLoginModalOpen, openLoginModal, closeLoginModal } = useAuthStore();
  const { syncWorkspaceContext, clearWorkspaceContext } = useWorkspaceStore();

  useEffect(() => {
    if (!user) {
      return;
    }

    syncWorkspaceContext({
      workspaceIds: user.workspaces.map((workspace) => workspace.id),
      defaultWorkspaceId: user.defaultWorkspaceId,
    });
  }, [user, syncWorkspaceContext]);

  // 파생 상태
  const isLoggedIn = !!user;
  const isAuthenticated = !isLoading && !error && isLoggedIn;

  // 로그인 함수
  const login = useCallback(() => {
    window.location.href = env.googleAuthUrl;
  }, []);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      clearWorkspaceContext();
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  }, [clearWorkspaceContext, logoutMutation]);

  // 세션 새로고침
  const refreshSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    // 사용자 정보
    user,

    // 상태
    isLoggedIn,
    isAuthenticated,
    isLoading,
    error,

    // UI 상태
    isLoginModalOpen,

    // 액션
    login,
    logout,
    refreshSession,
    openLoginModal,
    closeLoginModal,
  };
}
