import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import ProfilePage from '@/app/(main)/profile/page';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('미인증 상태', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        openLoginModal: vi.fn(),
      });
    });

    it('로그인 유도 UI를 렌더링한다', () => {
      render(<ProfilePage />);

      expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
      expect(screen.getByText('내 정보를 보려면 먼저 로그인해주세요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '로그인하기' })).toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        error: null,
        isAuthenticated: false,
        openLoginModal: vi.fn(),
      });
    });

    it('스켈레톤 UI를 렌더링한다', () => {
      render(<ProfilePage />);

      // 스켈레톤 요소들이 있는지 확인
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('에러 상태', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        error: new Error('네트워크 오류'),
        isAuthenticated: false,
        openLoginModal: vi.fn(),
      });
    });

    it('에러 메시지를 렌더링한다', () => {
      render(<ProfilePage />);

      expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
    });
  });

  describe('인증된 사용자 상태', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      nickname: '테스트 사용자',
      profileImage: 'https://example.com/avatar.jpg',
      profilePublic: true,
      oauths: [
        {
          provider: 'GOOGLE',
          connectedAt: '2025-01-01T00:00:00Z',
        },
      ],
      createdAt: '2025-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        openLoginModal: vi.fn(),
      });
    });

    it('사용자 정보를 렌더링한다', () => {
      render(<ProfilePage />);

      expect(screen.getByText('내 정보')).toBeInTheDocument();
      expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('가입일: 2025. 1. 1.')).toBeInTheDocument();
    });

    it('프로필 이미지를 렌더링한다', () => {
      render(<ProfilePage />);

      const profileImage = screen.getByAltText('프로필') as HTMLImageElement;
      expect(profileImage).toBeInTheDocument();
      expect(profileImage.src).toBe('https://example.com/avatar.jpg');
    });

    it('연동된 OAuth 계정을 렌더링한다', () => {
      render(<ProfilePage />);

      expect(screen.getByText('연동된 계정')).toBeInTheDocument();
      expect(screen.getByText('GOOGLE')).toBeInTheDocument();
      expect(screen.getByText('2025. 1. 1.')).toBeInTheDocument();
    });

    it('프로필 공개 설정을 렌더링한다', () => {
      render(<ProfilePage />);

      expect(screen.getByText('프로필 공개 설정')).toBeInTheDocument();
      expect(screen.getByText('공개')).toBeInTheDocument();
    });
  });

  describe('프로필 이미지가 없는 경우', () => {
    const mockUserWithoutImage = {
      id: 1,
      email: 'test@example.com',
      nickname: '테스트 사용자',
      profileImage: null,
      profilePublic: false,
      oauths: [],
      createdAt: '2025-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUserWithoutImage,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        openLoginModal: vi.fn(),
      });
    });

    it('기본 아이콘을 렌더링한다', () => {
      render(<ProfilePage />);

      // 프로필 이미지가 없을 때 기본 아이콘이 표시되는지 확인
      const profileImage = screen.queryByAltText('프로필');
      expect(profileImage).not.toBeInTheDocument();

      // User 아이콘이 있는지 확인
      const userIcon = document.querySelector('.lucide-user');
      expect(userIcon).toBeInTheDocument();
    });

    it('프로필이 비공개 상태임을 표시한다', () => {
      render(<ProfilePage />);

      expect(screen.getByText('비공개')).toBeInTheDocument();
    });
  });
});
