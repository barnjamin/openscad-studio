# Worktree Tauri Dev Loop

## Goal

Stop `pnpm tauri dev` from entering a rebuild loop when the app is launched from a Git worktree on macOS, while preserving the recently merged quarantine workaround for bundled `OpenSCAD.app`.

## Approach

- Confirm which recent Rust-side change introduced the worktree-only regression.
- Keep the macOS quarantine mitigation, but avoid mutating the watched `src-tauri/binaries/OpenSCAD.app` bundle during `tauri dev`.
- Validate the fix by running the desktop app from this worktree and confirming startup no longer triggers recursive rebuilds.

## Affected Areas

- `apps/ui/src-tauri/src/cmd/render.rs`

## Checklist

- [x] Read required repo guidance and inspect checkout readiness.
- [x] Identify the merged Rust-side change that caused the rebuild loop in worktrees.
- [x] Implement a dev-safe OpenSCAD binary preparation path that avoids mutating the watched source bundle.
- [x] Run `pnpm tauri dev` from this worktree and confirm the rebuild loop no longer occurs.
- [x] Run deterministic validation with `scripts/validate-changes.sh`.
- [x] Review final diff, commit, push, and open a draft PR against `main`.
- [x] Wait for preview and report PR handoff details.

## Validation Notes

- `bash scripts/validate-changes.sh --dry-run --changed-file apps/ui/src-tauri/src/cmd/render.rs --changed-file implementation-plans/worktree-tauri-dev-loop.md`
- `bash scripts/validate-changes.sh --changed-file apps/ui/src-tauri/src/cmd/render.rs --changed-file implementation-plans/worktree-tauri-dev-loop.md`
- Manual smoke validation: `pnpm tauri dev` from `/Users/zacharymarion/.codex/worktrees/3bdf/openscad-studio/apps/ui`
- Confirmed the app initializes OpenSCAD from a temp cache under `/var/.../openscad-studio/dev-openscad-cache/...` and no longer emits repeated `Info File ... changed. Rebuilding application...` logs after startup.
- Draft PR: `https://github.com/zacharyfmarion/openscad-studio/pull/111`
- Preview status: `Deploy Cloudflare PR Preview` was skipped for this desktop-only change, so no preview URL was generated.
