import { Sidebar } from '@/components/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1">{children}</main>
    </div>
  );
}
