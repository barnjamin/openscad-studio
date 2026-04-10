# AI Multi-File Diagnostics

## Goal

Make AI diagnostics validate multi-file projects through the same render-input assembly path used by the live preview, so the AI stops reporting false include/import failures on web.

## Approach

- [x] Extract a shared render-input builder for project files, working-directory dependencies, and library files.
- [x] Update `useOpenScad` to consume the shared builder instead of assembling render inputs inline.
- [x] Update AI diagnostics to build validation inputs through the same shared path.
- [x] Extend render service syntax checks to accept render-context options like `auxiliaryFiles` and `inputPath`.
- [x] Add regression coverage for AI diagnostics and render-service option forwarding.
- [x] Run lint, typecheck, and targeted/full tests.

## Affected Areas

- `apps/ui/src/services/aiService.ts`
- `apps/ui/src/hooks/useAiAgent.ts`
- `apps/ui/src/hooks/useOpenScad.ts`
- `apps/ui/src/services/renderService.ts`
- `apps/ui/src/services/nativeRenderService.ts`
- tests around AI tools and render services
