'use client';

import { Separator } from 'react-resizable-panels';

interface ResizeHandleProps {
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export default function ResizeHandle({
  direction = 'horizontal',
  className = '',
}: ResizeHandleProps) {
  return (
    <Separator
      className={`
        group relative flex items-center justify-center
        bg-border/70 hover:bg-border transition-colors
        ${direction === 'horizontal' ? 'w-1 h-full cursor-col-resize' : 'h-1 w-full cursor-row-resize'}
        ${className}
      `}
    >
      <span
        className={`rounded-full bg-muted-foreground/50 transition-colors group-hover:bg-foreground/70 ${
          direction === 'horizontal' ? 'h-8 w-px' : 'h-px w-8'
        }`}
      />
    </Separator>
  );
}
