'use client';

import { Bell, Briefcase, Link, LogIn, LogOut, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { LoginModal } from '@/components/auth/login-modal';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Search, label: '태그 검색' },
  { href: '/notifications', icon: Bell, label: '알림' },
];

const menuItems = [
  { href: '/profile', icon: User, label: '내 정보' },
  { href: '/my-posts', icon: Briefcase, label: '내 공고' },
];

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const { isLoggedIn, isLoading, isLoginModalOpen, openLoginModal, closeLoginModal, logout } =
    useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-neutral-95 text-neutral-10">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6">
        <Link className="size-7 text-mint-40" />
        <span className="text-lg font-bold text-white">AutoLink</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-neutral-75 text-white'
                    : 'text-neutral-30 hover:bg-neutral-80 hover:text-neutral-10',
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <Separator className="my-4 bg-neutral-75" />

        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-neutral-75 text-white'
                    : 'text-neutral-30 hover:bg-neutral-80 hover:text-neutral-10',
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Login/Logout */}
        <div className="px-1 pb-6">
          {isLoading ? (
            <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-30">
              <div className="size-5 animate-pulse rounded bg-neutral-70" />
              <div className="h-4 w-12 animate-pulse rounded bg-neutral-70" />
            </div>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-10"
            >
              <LogOut className="size-5" />
              로그아웃
            </button>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-30 transition-colors hover:bg-neutral-80 hover:text-neutral-10"
            >
              <LogIn className="size-5" />
              로그인
            </button>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </aside>
  );
}
