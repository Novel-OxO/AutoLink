'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { LoginModal, useAuth } from '@/features/auth';

interface WithAuthProps {
  redirectTo?: string;
  openModalDelay?: number;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {},
) {
  const { redirectTo = '/', openModalDelay = 100 } = options;

  return function WithAuthComponent(props: P): React.JSX.Element {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, openLoginModal, isLoginModalOpen, closeLoginModal } =
      useAuth();

    // 비인증 사용자 리디렉션 및 로그인 모달 처리
    useEffect(() => {
      if (!isAuthenticated && !isLoading) {
        // 이미 목적지 경로에 있으면 리디렉션하지 않음 (무한루프 방지)
        if (pathname !== redirectTo) {
          router.replace(redirectTo);
        }
        setTimeout(() => {
          openLoginModal();
        }, openModalDelay);
      }
    }, [isAuthenticated, isLoading, router, openLoginModal, pathname]);

    // 로딩 상태
    if (isLoading) {
      return <div className="p-8 text-sm text-muted-foreground">로그인 상태를 확인하는 중...</div>;
    }

    // 비인증 상태: 임시 UI (리디렉션되므로 짧게 보임)
    if (!isAuthenticated) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-semibold">인증 필요</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            이 페이지를 사용하려면 로그인이 필요합니다.
          </p>
          <Button onClick={openLoginModal} className="mt-4 cursor-pointer">
            로그인하기
          </Button>
          <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
        </div>
      );
    }

    // 인증된 경우 원래 컴포넌트 렌더링
    return <Component {...props} />;
  };
}
