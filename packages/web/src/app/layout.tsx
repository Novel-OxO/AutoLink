import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'AutoLink',
  description: 'AI-powered knowledge management for developers',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
