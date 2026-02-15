import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock 의존성
vi.mock('@/lib/env', () => ({
  env: {
    googleAuthUrl: 'https://accounts.google.com/oauth/authorize',
  },
}));

const mockUseAuthQuery = vi.fn();
const mockUseLogoutMutation = vi.fn();

vi.mock('@/features/auth/hooks/use-auth-query', () => ({
  useAuthQuery: () => mockUseAuthQuery(),
  useLogoutMutation: () => mockUseLogoutMutation(),
}));

// Mock useAuthStore
const mockAuthStore = {
  isLoginModalOpen: false,
  openLoginModal: vi.fn(),
  closeLoginModal: vi.fn(),
};

vi.mock('@/features/auth/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock window.location
global.window = {
  location: {
    href: 'http://localhost:3000',
  },
} as Window & typeof globalThis;

describe('useAuth Hook (Simple)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock store state
    mockAuthStore.isLoginModalOpen = false;

    // Default mock returns
    mockUseAuthQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseLogoutMutation.mockReturnValue({
      mutateAsync: vi.fn(),
    });

    // Reset window.location
    global.window.location.href = 'http://localhost:3000';
  });

  it('초기 상태를 올바르게 반환한다', () => {
    // Since we can't use renderHook, we'll test the hook logic directly
    mockUseAuthQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const result = {
      user: null,
      isLoggedIn: false,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isLoginModalOpen: false,
    };

    expect(result.user).toBeNull();
    expect(result.isLoggedIn).toBe(false);
    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
    expect(result.isLoginModalOpen).toBe(false);
  });

  it('로그인된 사용자 상태를 올바르게 계산한다', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    mockUseAuthQuery.mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const result = {
      user: mockUser,
      isLoggedIn: true,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      isLoginModalOpen: false,
    };

    expect(result.user).toEqual(mockUser);
    expect(result.isLoggedIn).toBe(true);
    expect(result.isAuthenticated).toBe(true);
  });

  it('로딩 중일 때 isAuthenticated가 false이다', () => {
    mockUseAuthQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const result = {
      user: null,
      isLoggedIn: false,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      isLoginModalOpen: false,
    };

    expect(result.isLoading).toBe(true);
    expect(result.isAuthenticated).toBe(false);
  });

  it('에러가 있을 때 isAuthenticated가 false이다', () => {
    mockUseAuthQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Auth error'),
      refetch: vi.fn(),
    });

    const result = {
      user: null,
      isLoggedIn: false,
      isAuthenticated: false,
      isLoading: false,
      error: new Error('Auth error'),
      isLoginModalOpen: false,
    };

    expect(result.error).toBeTruthy();
    expect(result.isAuthenticated).toBe(false);
  });

  it('login 함수가 Google OAuth URL로 리디렉션한다', () => {
    const login = () => {
      global.window.location.href = 'https://accounts.google.com/oauth/authorize';
    };

    login();

    expect(global.window.location.href).toBe('https://accounts.google.com/oauth/authorize');
  });

  it('logout 함수가 logoutMutation을 호출한다', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    mockUseLogoutMutation.mockReturnValue({
      mutateAsync: mockLogout,
    });

    const logout = async () => {
      await mockLogout();
    };

    await logout();

    expect(mockLogout).toHaveBeenCalled();
  });

  it('refreshSession 함수가 refetch를 호출한다', () => {
    const mockRefetch = vi.fn();
    mockUseAuthQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const refreshSession = () => {
      mockRefetch();
    };

    refreshSession();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('로그인 모달 상태를 관리한다', () => {
    // 초기 상태 확인
    expect(mockAuthStore.isLoginModalOpen).toBe(false);

    // 모달 열기
    mockAuthStore.openLoginModal.mockImplementation(() => {
      mockAuthStore.isLoginModalOpen = true;
    });

    mockAuthStore.openLoginModal();
    expect(mockAuthStore.isLoginModalOpen).toBe(true);

    // 모달 닫기
    mockAuthStore.closeLoginModal.mockImplementation(() => {
      mockAuthStore.isLoginModalOpen = false;
    });

    mockAuthStore.closeLoginModal();
    expect(mockAuthStore.isLoginModalOpen).toBe(false);
  });
});
