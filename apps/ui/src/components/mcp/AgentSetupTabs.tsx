import { useCallback, useMemo, useState } from 'react';
import { TbBraces, TbCopy, TbTerminal2 } from 'react-icons/tb';
import { Button, IconButton, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '../ui';
import {
  buildClaudeMcpCommand,
  buildCodexMcpCommand,
  buildCursorMcpConfig,
  buildOpenCodeMcpConfig,
} from '../../services/desktopMcp';
import { notifyError, notifySuccess } from '../../utils/notifications';

type AgentSetupId = 'claude' | 'cursor' | 'codex' | 'opencode';

interface AgentSetupItem {
  id: AgentSetupId;
  label: string;
  command: string;
  codeLabel: 'Shell' | 'JSON';
  locationLabel?: string;
  instruction: string;
  instructionDetail?: string;
}

interface AgentSetupTabsProps {
  port: number;
  surface?: 'panel' | 'settings';
}

function SetupCodeBlock({
  label,
  locationLabel,
  value,
  onCopy,
  compact,
}: {
  label: string;
  locationLabel?: string;
  value: string;
  onCopy: () => void;
  compact: boolean;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 78%, var(--bg-primary))',
        borderColor: 'var(--border-primary)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        className={`flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
        style={{
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 92%, var(--bg-primary))',
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Text
            as="span"
            variant="caption"
            weight="semibold"
            className="rounded-full px-2 py-0.5"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 14%, transparent)',
              color: 'var(--text-primary)',
            }}
          >
            {label}
          </Text>
          {locationLabel ? (
            <Text
              as="span"
              variant="caption"
              color="tertiary"
              className="truncate"
              style={{ maxWidth: compact ? '10rem' : '18rem' }}
              title={locationLabel}
            >
              {locationLabel}
            </Text>
          ) : null}
        </div>
        {compact ? (
          <IconButton
            size="sm"
            variant="default"
            aria-label="Copy setup"
            title="Copy setup"
            onClick={onCopy}
          >
            <TbCopy size={16} />
          </IconButton>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={onCopy}>
            Copy
          </Button>
        )}
      </div>
      <pre
        className={`m-0 overflow-x-auto ${compact ? 'px-3 py-3' : 'px-4 py-4'} text-xs leading-7`}
        style={{
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </pre>
    </div>
  );
}

export function AgentSetupTabs({ port, surface = 'settings' }: AgentSetupTabsProps) {
  const compact = surface === 'panel';
  const [selectedAgent, setSelectedAgent] = useState<AgentSetupId>('claude');
  const commands = useMemo<AgentSetupItem[]>(
    () => [
      {
        id: 'claude',
        label: 'Claude Code',
        command: buildClaudeMcpCommand(port),
        codeLabel: 'Shell',
        instruction:
          'Run this command in your terminal to register OpenSCAD Studio as an MCP server, then call get_or_create_workspace with your repo root before using render tools.',
      },
      {
        id: 'cursor',
        label: 'Cursor',
        command: buildCursorMcpConfig(port),
        codeLabel: 'JSON',
        locationLabel: '~/.cursor/mcp.json',
        instruction:
          'Open Cursor MCP settings and add the OpenSCAD Studio server, then call get_or_create_workspace with your repo root before using render tools.',
        instructionDetail: 'You can also edit your mcp.json directly.',
      },
      {
        id: 'codex',
        label: 'Codex',
        command: buildCodexMcpCommand(port),
        codeLabel: 'Shell',
        instruction:
          'Run this command in your terminal to add the OpenSCAD Studio MCP endpoint, then call get_or_create_workspace with your repo root before using render tools.',
      },
      {
        id: 'opencode',
        label: 'OpenCode',
        command: buildOpenCodeMcpConfig(port),
        codeLabel: 'JSON',
        locationLabel: '~/.config/opencode/opencode.json',
        instruction:
          'Open OpenCode MCP settings and add the OpenSCAD Studio server, then call get_or_create_workspace with your repo root before using render tools.',
        instructionDetail: 'You can also edit the config file directly.',
      },
    ],
    [port]
  );

  const copyText = useCallback(async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notifySuccess(`${label} copied`, {
        toastId: `copy-${label.toLowerCase().replace(/\s+/g, '-')}`,
      });
    } catch (error) {
      notifyError({
        operation: 'copy-mcp-agent-setup',
        error,
        fallbackMessage: `Failed to copy ${label.toLowerCase()}`,
      });
    }
  }, []);

  return (
    <Tabs
      value={selectedAgent}
      onValueChange={(value) => setSelectedAgent(value as AgentSetupId)}
      orientation="horizontal"
      className="flex flex-col gap-3"
    >
      <div
        className="overflow-x-auto rounded-xl border p-1"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 92%, var(--bg-primary))',
          borderColor: 'var(--border-primary)',
        }}
      >
        <TabsList
          aria-label="Desktop agent setup"
          className="inline-flex min-w-full items-stretch gap-1"
        >
          {commands.map((item) => {
            const isActive = selectedAgent === item.id;
            const formatIcon =
              item.codeLabel === 'JSON' ? <TbBraces size={14} /> : <TbTerminal2 size={14} />;
            return (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="group inline-flex min-w-[8.5rem] flex-1 items-center justify-between rounded-lg px-3 py-2 text-left outline-none transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--accent-primary) 14%, var(--bg-tertiary))'
                    : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : undefined,
                }}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium leading-5">{item.label}</span>
                  <span
                    className="text-[11px] leading-4"
                    style={{ color: isActive ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
                  >
                    {item.codeLabel}
                  </span>
                </span>
                <span
                  className="ml-3 shrink-0 rounded-full p-1"
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--accent-primary) 16%, transparent)'
                      : 'color-mix(in srgb, var(--bg-tertiary) 72%, transparent)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {formatIcon}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {commands.map((item) => (
        <TabsContent
          key={item.id}
          value={item.id}
          className="outline-none"
        >
          <div
            className="rounded-xl border"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--bg-secondary) 97%, var(--bg-primary)) 0%, color-mix(in srgb, var(--bg-tertiary) 90%, var(--bg-primary)) 100%)',
              borderColor: 'var(--border-primary)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            <div
              className={`${compact ? 'px-3 py-3' : 'px-4 py-4'} flex flex-col`}
              style={{ gap: 'var(--space-helper-gap)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Text variant="caption" weight="semibold" color="primary">
                    {item.label}
                  </Text>
                  {item.locationLabel ? (
                    <Text
                      variant="caption"
                      color="tertiary"
                      className="mt-1 block"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {item.locationLabel}
                    </Text>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Text variant="caption">{item.instruction}</Text>
                {item.instructionDetail ? (
                  <Text variant="caption" color="tertiary">
                    {item.instructionDetail}
                  </Text>
                ) : null}
              </div>

              <SetupCodeBlock
                label={item.codeLabel}
                locationLabel={item.locationLabel}
                value={item.command}
                compact={compact}
                onCopy={() => void copyText(`${item.label} MCP setup`, item.command)}
              />
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
