import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('request method', () => {
    it('성공적인 GET 요청을 처리한다', async () => {
      const mockResponse = { id: '1', name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          credentials: 'include',
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('성공적인 POST 요청을 처리한다', async () => {
      const mockData = { name: 'Test' };
      const mockResponse = { id: '1', ...mockData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.post('/test', mockData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          credentials: 'include',
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('401 에러 시 UNAUTHORIZED 에러를 발생시킨다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(apiClient.get('/protected')).rejects.toThrow('UNAUTHORIZED');
    });

    it('기타 HTTP 에러를 적절히 처리한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiClient.get('/error')).rejects.toThrow('API Error: 500 Internal Server Error');
    });
  });

  describe('인증 관련 API', () => {
    it('getAuthUser가 사용자 정보를 가져온다', async () => {
      const mockUser = {
        id: 'test-user-1',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await apiClient.getAuthUser();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        }),
      );
      expect(result).toEqual(mockUser);
    });

    it('logout이 로그아웃 요청을 보낸다', async () => {
      const mockResponse = { message: '로그아웃 성공' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.logout();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('deleteAccount가 계정 삭제 요청을 보낸다', async () => {
      const mockResponse = { message: '계정이 삭제되었습니다' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.deleteAccount();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        }),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE 요청', () => {
    it('성공적인 DELETE 요청을 처리한다', async () => {
      const mockResponse = { message: '삭제 성공' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.delete('/test');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        }),
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
