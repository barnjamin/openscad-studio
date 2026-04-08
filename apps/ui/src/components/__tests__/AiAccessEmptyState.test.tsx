/** @jest-environment jsdom */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import { AiAccessEmptyState } from '../AiAccessEmptyState';

describe('AiAccessEmptyState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('selects Claude Code by default and switches setup tabs in the panel variant', async () => {
    renderWithProviders(<AiAccessEmptyState variant="panel" onOpenSettings={() => {}} />);

    expect(screen.getByText('Use built-in AI or Studio MCP')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Claude Code/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText(/claude mcp add --transport http --scope user/i)).toBeTruthy();
    expect(screen.getByText(/get_or_create_workspace with your repo root/i)).toBeTruthy();
    expect(screen.queryByText(/codex mcp add openscad-studio --url/i)).toBeNull();

    const cursorTab = screen.getByRole('tab', { name: /Cursor/i });
    fireEvent.mouseDown(cursorTab, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(cursorTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(screen.getAllByText(/~\/\.cursor\/mcp\.json/i).length).toBeGreaterThan(0);
  });
});
