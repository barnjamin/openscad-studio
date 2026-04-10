/** @jest-environment jsdom */

import { fireEvent, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { forwardRef } from 'react';
import type { AiPromptPanelProps } from '../AiPromptPanel';
import type { Message, ToolCall } from '../../types/aiChat';
import { renderWithProviders } from './test-utils';

jest.unstable_mockModule('@/components/ChatImage', () => ({
  ChatImage: ({ alt }: { alt: string }) => <div>{alt}</div>,
  ChatImageGrid: () => null,
}));

jest.unstable_mockModule('@/components/MarkdownMessage', () => ({
  MarkdownMessage: ({ content }: { content: string }) => <div>{content}</div>,
}));

jest.unstable_mockModule('@/components/ModelSelector', () => ({
  ModelSelector: () => <div data-testid="model-selector" />,
}));

jest.unstable_mockModule('@/components/AiComposer', () => ({
  AiComposer: forwardRef((props, ref) => {
    void props;
    void ref;
    return <div data-testid="ai-composer" />;
  }),
}));

jest.unstable_mockModule('@/components/AiAccessEmptyState', () => ({
  AiAccessEmptyState: () => <div data-testid="ai-access-empty-state" />,
}));

jest.unstable_mockModule('@/stores/apiKeyStore', () => ({
  useHasApiKey: () => true,
}));

let AiPromptPanel: typeof import('../AiPromptPanel').AiPromptPanel;

function createBaseProps(overrides: Partial<AiPromptPanelProps> = {}): AiPromptPanelProps {
  return {
    onSubmit: () => {},
    onTextChange: () => {},
    onFilesSelected: () => {},
    onRemoveAttachment: () => {},
    draft: { text: '', attachmentIds: [] },
    attachments: {},
    draftErrors: [],
    canSubmitDraft: false,
    isProcessingAttachments: false,
    isStreaming: false,
    streamingResponse: null,
    onCancel: () => {},
    messages: [],
    currentToolCalls: [],
    ...overrides,
  };
}

function createCompletedToolMessage(): Message {
  return {
    type: 'tool-call',
    id: 'message-1',
    toolCallId: 'tool-1',
    toolName: 'apply_edit',
    args: {
      path: 'main.scad',
      oldString: 'cube(1);',
      newString: 'cube(2);',
    },
    result: {
      success: true,
      summary: 'Updated main.scad',
    },
    state: 'completed',
    timestamp: 1,
  };
}

function createPendingToolCall(): ToolCall {
  return {
    toolCallId: 'tool-2',
    name: 'read_file',
    args: {
      path: 'lib.scad',
    },
    state: 'pending',
  };
}

function createUserMessage(): Message {
  return {
    type: 'user',
    id: 'user-1',
    timestamp: 0,
    parts: [{ type: 'text', text: 'Inspect the project files.' }],
  };
}

describe('AiPromptPanel', () => {
  beforeAll(async () => {
    ({ AiPromptPanel } = await import('@/components/AiPromptPanel'));
  });

  it('keeps completed tool payloads collapsed until expanded', () => {
    renderWithProviders(
      <AiPromptPanel {...createBaseProps({ messages: [createCompletedToolMessage()] })} />
    );

    expect(screen.queryByText(/"path": "main\.scad"/)).toBeNull();
    expect(screen.queryByText(/"summary": "Updated main\.scad"/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /tool details/i }));

    expect(screen.getByText(/"path": "main\.scad"/)).toBeTruthy();
    expect(screen.getByText(/"newString": "cube\(2\);"/)).toBeTruthy();
    expect(screen.getByText(/"success": true/)).toBeTruthy();
    expect(screen.getByText(/"summary": "Updated main\.scad"/)).toBeTruthy();
  });

  it('shows pending tool inputs and a waiting placeholder when the result is not available yet', () => {
    renderWithProviders(
      <AiPromptPanel
        {...createBaseProps({
          messages: [createUserMessage()],
          currentToolCalls: [createPendingToolCall()],
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /tool details/i }));

    expect(screen.getByText(/"path": "lib\.scad"/)).toBeTruthy();
    expect(screen.getByText('Waiting for result...')).toBeTruthy();
  });
});
