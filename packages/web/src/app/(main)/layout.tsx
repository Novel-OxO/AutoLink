import { ResizableLayout } from '@/components/layout/resizable-layout';
import { Sidebar } from '@/components/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="min-h-screen h-screen">
      <ResizableLayout leftSidebar={<Sidebar />} showLeftSidebar={true}>
        {children}
      </ResizableLayout>
    </div>
  );
}
