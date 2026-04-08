# MCP Agent Tabs

## Goal

Replace the MCP agent setup accordions with a horizontal Radix tabs UI that defaults to Claude Code, while consolidating the shared setup content into a reusable component for both settings and empty-state surfaces.

## Approach

- Add a reusable Radix tabs primitive to the shared UI layer.
- Build a shared MCP agent setup tabs component that owns tab ordering, copy affordances, and code/instruction rendering.
- Update the settings card and AI empty state to use the shared component, with Claude Code first and selected by default.
- Refresh tests to assert the new tabbed behavior and rerun validation before committing.

## Affected Files

- `apps/ui/package.json`
- `apps/ui/src/components/ui/Tabs.tsx`
- `apps/ui/src/components/ui/index.ts`
- `apps/ui/src/components/mcp/AgentSetupTabs.tsx`
- `apps/ui/src/components/AiAccessEmptyState.tsx`
- `apps/ui/src/components/settings/ExternalAgentsCard.tsx`
- `apps/ui/src/components/__tests__/AiAccessEmptyState.test.tsx`
- `apps/ui/src/components/__tests__/SettingsDialog.test.tsx`

## Checklist

- [x] Identify current MCP setup surfaces and shared requirements
- [x] Add a reusable Radix tabs primitive
- [x] Build shared MCP agent setup tabs component
- [x] Migrate settings and empty-state MCP UI to the shared tabs component
- [x] Update tests for default selection and tab behavior
- [x] Run lint, typecheck, and unit tests
- [x] Commit the changes
