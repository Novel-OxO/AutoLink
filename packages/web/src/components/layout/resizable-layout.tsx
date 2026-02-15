'use client';

import {
  MainPanel,
  ResizablePanelGroup,
  ResizablePanelHandle,
  SidebarPanel,
} from '@/components/ui/resizable-panel';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { cn } from '@/lib/utils';

type ReactNode = React.ReactNode;

interface ResizableLayoutProps {
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  children: ReactNode;
  className?: string;
  showLeftSidebar?: boolean;
  showRightSidebar?: boolean;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftSidebar,
  rightSidebar,
  children,
  className,
  showLeftSidebar = true,
  showRightSidebar = false,
}: ResizableLayoutProps) => {
  const {
    leftSidebarWidth,
    rightSidebarWidth,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    updateLeftSidebarWidth,
    updateRightSidebarWidth,
  } = useSidebarState();

  const handleLayoutChange = (layout: { [id: string]: number }) => {
    if (showLeftSidebar && layout['left-sidebar']) {
      updateLeftSidebarWidth(layout['left-sidebar']);
    }
    if (showRightSidebar && layout['right-sidebar']) {
      updateRightSidebarWidth(layout['right-sidebar']);
    }
  };

  return (
    <ResizablePanelGroup className={cn('h-full', className)} onLayoutChanged={handleLayoutChange}>
      {/* 왼쪽 사이드바 */}
      {showLeftSidebar && (
        <>
          <SidebarPanel
            id="left-sidebar"
            defaultWidth={leftSidebarWidth}
            className={cn(
              'transition-all duration-300',
              !isLeftSidebarOpen && 'w-0 min-w-0 max-w-0',
            )}
          >
            {isLeftSidebarOpen && leftSidebar}
          </SidebarPanel>

          {isLeftSidebarOpen && <ResizablePanelHandle />}
        </>
      )}

      {/* 메인 콘텐츠 */}
      <MainPanel id="main-panel">{children}</MainPanel>

      {/* 오른쪽 사이드바 */}
      {showRightSidebar && (
        <>
          {isRightSidebarOpen && <ResizablePanelHandle />}

          <SidebarPanel
            id="right-sidebar"
            defaultWidth={rightSidebarWidth}
            className={cn(
              'transition-all duration-300',
              !isRightSidebarOpen && 'w-0 min-w-0 max-w-0',
            )}
          >
            {isRightSidebarOpen && rightSidebar}
          </SidebarPanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};
