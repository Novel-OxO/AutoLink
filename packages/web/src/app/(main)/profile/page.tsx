'use client';

import { User } from 'lucide-react';
import Image from 'next/image';
import { useAuth, withAuth } from '@/features/auth';

function ProfilePageContent(): React.JSX.Element {
  const { user, error } = useAuth();

  // 에러 상태
  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">오류가 발생했습니다</h2>
          <p className="mt-1 text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // 정상 상태: 사용자 정보 표시
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">내 정보</h1>
        <p className="mt-1 text-muted-foreground">계정 정보와 연동된 서비스를 확인할 수 있습니다</p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        {/* 프로필 헤더 */}
        <div className="mb-6 flex items-center gap-4">
          {user?.profileImage ? (
            <Image
              src={user.profileImage}
              alt="프로필"
              width={80}
              height={80}
              className="size-20 rounded-full object-cover"
              priority
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-muted">
              <User className="size-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{user?.nickname}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              가입일:{' '}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('ko-KR')
                : '알 수 없음'}
            </p>
          </div>
        </div>

        {/* 연동된 OAuth 계정 */}
        <div>
          <h3 className="mb-3 font-semibold">연동된 계정</h3>
          {user?.oauths && user.oauths.length > 0 ? (
            <div className="space-y-2">
              {user.oauths.map((oauth: { provider: string; connectedAt: string }) => (
                <div
                  key={`${oauth.provider}-${oauth.connectedAt}`}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500" />
                    <span className="font-medium">{oauth.provider}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(oauth.connectedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">연동된 계정이 없습니다</p>
          )}
        </div>

        {/* 프로필 공개 설정 */}
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">프로필 공개 설정</h3>
          <div className="flex items-center justify-between rounded-md border p-3">
            <span>프로필 공개</span>
            <span
              className={`text-sm ${user?.profilePublic ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              {user?.profilePublic ? '공개' : '비공개'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// HOC로 감싸서 export
export default withAuth(ProfilePageContent);
