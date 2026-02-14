import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type User } from '@/lib/api';

// 사용자 정보 조회 Query
export function useAuthQuery() {
  return useQuery<User, Error>({
    queryKey: ['auth', 'user'],
    queryFn: () => apiClient.getAuthUser(),
    retry: false, // 인증 실패 시 재시도하지 않음
    staleTime: 1000 * 60 * 5, // 5분
  });
}

// 로그아웃 Mutation
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // 인증 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['auth', 'user'] });
    },
    onError: (error) => {
      console.error('로그아웃 실패:', error);
    },
  });
}

// 회원 탈퇴 Mutation
export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deleteAccount(),
    onSuccess: () => {
      // 인증 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.removeQueries({ queryKey: ['auth', 'user'] });
    },
    onError: (error) => {
      console.error('회원 탈퇴 실패:', error);
    },
  });
}
