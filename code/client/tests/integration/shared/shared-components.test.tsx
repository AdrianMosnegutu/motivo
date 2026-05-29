import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ResizeHandle from '@/shared/components/ResizeHandle';
import Spinner from '@/shared/components/Spinner';

vi.mock('react-resizable-panels', () => ({
  Separator: ({ className }: { className: string }) => (
    <div data-testid="separator" className={className} />
  ),
}));

describe('shared components', () => {
  it('renders spinner with default and custom sizing', () => {
    const { container, rerender } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveClass('w-3.5');

    rerender(<Spinner className="w-8 h-8" />);
    expect(container.querySelector('svg')).toHaveClass('w-8');
  });

  it('renders resize handles for both directions', () => {
    const { rerender } = render(<ResizeHandle />);
    expect(screen.getByTestId('separator')).toHaveClass('cursor-col-resize');

    rerender(<ResizeHandle direction="vertical" className="extra" />);
    expect(screen.getByTestId('separator')).toHaveClass('cursor-row-resize');
    expect(screen.getByTestId('separator')).toHaveClass('extra');
  });
});
