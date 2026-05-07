import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LogsPane from '@/features/ide/components/LogsPane';

describe('LogsPane', () => {
  it('groups diagnostics and jumps to diagnostic locations', async () => {
    const onJump = vi.fn();

    render(
      <LogsPane
        log={{
          kind: 'error',
          timestamp: new Date('2026-05-07T08:00:00Z'),
          diagnostics: [
            {
              severity: 'error',
              type: 'semantic',
              message: 'unknown identifier',
              line: 3,
              column: 5,
            },
          ],
        }}
        onClear={vi.fn()}
        onJump={onJump}
      />,
    );

    expect(screen.getByText('semantic')).toBeInTheDocument();
    expect(screen.getByText('unknown identifier')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '[3:5]' }));

    expect(onJump).toHaveBeenCalledWith(3, 5);
  });
});
