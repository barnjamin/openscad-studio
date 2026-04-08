import { Button, Text } from './ui';
import { useSettings } from '../stores/settingsStore';
import { AgentSetupTabs } from './mcp/AgentSetupTabs';

interface AiAccessEmptyStateProps {
  onOpenSettings?: () => void;
  variant?: 'panel' | 'inline';
}

export function AiAccessEmptyState({ onOpenSettings, variant = 'panel' }: AiAccessEmptyStateProps) {
  const [settings] = useSettings();
  const port = settings.mcp.port;
  const isPanel = variant === 'panel';

  return (
    <div
      data-testid={`ai-access-empty-state-${variant}`}
      className={`rounded-xl border ${isPanel ? 'max-w-xl p-6' : 'p-4'} mx-auto`}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-secondary)',
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="space-y-2 text-left">
          <Text variant={isPanel ? 'section-heading' : 'body'} weight="medium">
            Use built-in AI or Studio MCP
          </Text>
          <Text variant="caption" color="secondary">
            Add an Anthropic or OpenAI API key in Settings, or connect a desktop agent to Studio
            over MCP.
          </Text>
        </div>

        <div className="flex justify-start gap-2">
          <Button type="button" variant="primary" onClick={() => onOpenSettings?.()}>
            Add API Key
          </Button>
        </div>

        <div className="w-full space-y-2 text-left">
          <Text variant="caption" weight="semibold" color="secondary">
            Desktop agent setup
          </Text>

          <AgentSetupTabs port={port} surface="panel" />

          <Text variant="caption" color="secondary">
            Desktop only. Studio stays open while your external agent uses MCP, and each MCP session
            must select a workspace before render tools will run.
          </Text>
        </div>
      </div>
    </div>
  );
}
