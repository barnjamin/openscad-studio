# AI Tool Call Details

## Goal

Add collapsed-by-default detail views to AI pane tool call blocks so users can expand a tool entry to inspect its input parameters and output payload while keeping the transcript compact for normal use.

## Approach

- Extend the AI transcript tool call UI in `AiPromptPanel.tsx` with a shared expandable detail block used by both completed tool-call messages and currently running tool calls.
- Format tool arguments and results into readable JSON-like text, while preserving existing special handling for screenshot results and error states.
- Add targeted component coverage to verify the collapsed default state and the expandable input/result rendering.
- Run the shared validation script with scopes appropriate for the frontend-only changes before opening a draft PR.

## Affected Areas

- `apps/ui/src/components/AiPromptPanel.tsx`
- `apps/ui/src/components/__tests__/AiPromptPanel.test.tsx`
- `implementation-plans/ai-tool-call-details.md`

## Checklist

- [x] Inspect the current AI transcript tool call rendering and identify reusable UI patterns
- [x] Implement collapsed-by-default expandable tool call detail blocks in the AI pane
- [x] Add or update frontend tests for tool call detail expansion
- [x] Run relevant validation for the frontend changes
- [x] Create a draft PR against `main` and capture preview status if applicable
