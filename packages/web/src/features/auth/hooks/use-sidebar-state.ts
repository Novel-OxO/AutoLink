'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  updateLeftSidebarWidth: (width: number) => void;
  updateRightSidebarWidth: (width: number) => void;
}

export const useSidebarState = create<SidebarState>()(
  persist(
    (set) => ({
      leftSidebarWidth: 25,
      rightSidebarWidth: 25,
      isLeftSidebarOpen: true,
      isRightSidebarOpen: false,

      setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
      setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
      toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
      setLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),
      setRightSidebarOpen: (open) => set({ isRightSidebarOpen: open }),
      updateLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
      updateRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({
        leftSidebarWidth: state.leftSidebarWidth,
        rightSidebarWidth: state.rightSidebarWidth,
        isLeftSidebarOpen: state.isLeftSidebarOpen,
        isRightSidebarOpen: state.isRightSidebarOpen,
      }),
    },
  ),
);
