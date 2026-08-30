# @keybindy/core

## [2.0.1] - 2026-08-30

### Improvements & Fixes

- **Contextual Typing for Handler Event**:
  - Unified `ShortcutHandler` to `(event: KeyboardEvent, state?: HoldState) => void`, ensuring 1-parameter handler callbacks `(event) => ...` infer `KeyboardEvent` with full autocomplete rather than `any`.
- **Per-Shortcut Hooks**:
  - Added `beforeEach` and `afterEach` options directly inside `ShortcutOptions`.
- **Sequential Hook Order Preservation**:
  - Fixed hook filter matching to preserve exact key order for sequential shortcuts (`['G', 'D']` vs `['D', 'G']`).

## [2.0.0] - 2026-08-30

### Major Features & Improvements

- **Cascading Scope Mode & Priority Weights**:
  - Added `scopeMode: 'default' | 'cascade'`. In `'default'` mode, only the topmost active scope is enabled (ideal for strict modal isolation). In `'cascade'` mode, all active scopes work together.
  - Added dynamic numeric priority weighting (`setScopePriority(scope, priority)`, `removeScopePriority(scope)`). Common key collisions are resolved by priority weight (e.g. `100 > 10 > 0`) or stack order, while non-colliding parent shortcuts continue executing.
- **Guard & Interceptor Middlewares**:
  - Added `beforeEach((shortcut, event) => boolean | void, options?)` guard hook. Returning `false` safely cancels shortcut execution.
  - Added `afterEach((shortcut, event) => void, options?)` interceptor hook for analytics, telemetry, and side-effects.
- **Smart Input Target Handling**:
  - Added automatic ignoring of keystrokes when typing inside `<input>`, `<textarea>`, `<select>`, and `[contenteditable="true"]` via global `ignoreInputs: true` and per-shortcut `ignoreInputs: true`.
  - Added `enableInInput: true` option to allow specific shortcuts (like `Esc`) to trigger even while focused on an input.
- **Forgiving Cross-Platform Aliases**:
  - Expanded key alias normalization to seamlessly recognize `Cmd`, `Command`, `Meta`, `Option`, `Alt`, `Return`, `Enter`, `Esc`, and `Escape`.
- **Enhanced Types & TypeScript DX**:
  - Introduced `Key` and `ShortcutBinding = (Key | Key[])[]` types, completely eliminating TypeScript union array inference bugs (`never[]`).

### [1.1.7] - 2025-08-08

### Changes

- maintain user defined key order in `getCheatSheet` method.

### [1.1.6] - 2025-08-08

### Changes

- Smarter Cheat Sheet: The `getCheatSheet` method has been completely reworked to be more intelligent and useful.

### Fixed

- Fixed a bug where the same shortcut could appear multiple times in the cheat sheet.

## [1.1.5] - 2025-08-07

### Changes

- **Enter Alias**: `Enter` and `Numpad Enter` are now aliased. Defining a shortcut for `Enter` will trigger for both keys.

## [1.1.1 - 1.1.4] - 2025-08-06

### Changes

- **Types**: Refined and curated the exported TypeScript types to provide a cleaner, more focused public API for developers. The internal `KeyBinding` type was renamed to `ShortcutBinding` for better clarity.
- fixed package.json
- Updated dependencies
  - None

## [1.1.0] - 2025-08-06

### Features

- **Holdable Shortcuts**: A new `hold: true` option has been added to `ShortcutOptions`. This allows creating shortcuts that trigger on both key down and key up, ideal for "push-to-talk" style interactions. The handler receives a `state` argument (`"down"` or `"up"`) to indicate the key state.
- **Key-Up Trigger**: A new `triggerOn: 'keyup'` option allows shortcuts to be fired upon key release instead of the default key press.
- **Repeatable Shortcuts**: A new `repeat: true` option has been added to allow shortcut handlers to be fired continuously when a key is held down.

### Internal

- Migrated to a pnpm-managed monorepo to streamline development and ensure package synchronization.
