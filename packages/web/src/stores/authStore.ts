import { create } from 'zustand';

interface AuthStore {
  // UI 관련 상태만 관리
  isLoginModalOpen: boolean;

  // Actions
  openLoginModal: () => void;
  closeLoginModal: () => void;
  toggleLoginModal: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoginModalOpen: false,

  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  toggleLoginModal: () =>
    set((state) => ({
      isLoginModalOpen: !state.isLoginModalOpen,
    })),
}));
