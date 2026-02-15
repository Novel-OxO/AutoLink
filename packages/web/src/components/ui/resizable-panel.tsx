'use client';

import { Group, Panel, Separator } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

type ReactNode = React.ReactNode;

interface ResizablePanelProps {
  children: ReactNode;
  defaultSize?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
  className?: string;
  id?: string;
}

interface ResizablePanelGroupProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onLayoutChanged?: (layout: { [id: string]: number }) => void;
}

interface ResizablePanelHandleProps {
  className?: string;
  disabled?: boolean;
}

export const ResizablePanelGroup: React.FC<ResizablePanelGroupProps> = ({
  children,
  orientation = 'horizontal',
  className,
  onLayoutChanged,
}) => {
  return (
    <Group
      orientation={orientation}
      className={cn('h-full w-full', className)}
      onLayoutChanged={onLayoutChanged}
    >
      {children}
    </Group>
  );
};

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultSize = 30,
  minSize = 10,
  maxSize = 90,
  className,
  id,
}: ResizablePanelProps) => {
  return (
    <Panel
      id={id}
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      className={cn('overflow-hidden', className)}
    >
      {children}
    </Panel>
  );
};

export const ResizablePanelHandle: React.FC<ResizablePanelHandleProps> = ({
  className,
  disabled = false,
}: ResizablePanelHandleProps) => {
  return (
    <Separator
      disabled={disabled}
      className={cn(
        'group relative -mx-1 flex w-3 items-stretch justify-center bg-transparent cursor-col-resize',
        disabled && 'cursor-default hover:bg-transparent',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none h-full w-px bg-neutral-80 transition-colors duration-150 group-hover:bg-neutral-40"
      />
    </Separator>
  );
};

// 사이드바용 편의 컴포넌트
interface SidebarPanelProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  id?: string;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  children,
  defaultWidth = 25,
  minWidth = 15,
  maxWidth = 40,
  className,
  id,
}: SidebarPanelProps) => {
  return (
    <ResizablePanel
      id={id}
      defaultSize={`${defaultWidth}%`}
      minSize={`${minWidth}%`}
      maxSize={`${maxWidth}%`}
      className={cn('flex-shrink-0 h-full', className)}
    >
      {children}
    </ResizablePanel>
  );
};

// 메인 콘텐츠용 편의 컴포넌트
interface MainPanelProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export const MainPanel: React.FC<MainPanelProps> = ({
  children,
  className,
  id,
}: MainPanelProps) => {
  return (
    <ResizablePanel
      id={id}
      defaultSize="75%"
      minSize="60%"
      maxSize="85%"
      className={cn('flex-1 overflow-auto h-full', className)}
    >
      {children}
    </ResizablePanel>
  );
};
