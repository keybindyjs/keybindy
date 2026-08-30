# @keybindy/react

## [2.0.1] - 2026-08-30

### Improvements & Fixes

- **Isolated Hook Guard & Interceptor Scoping**:
  - `useShortcuts` now automatically scopes its `beforeEach` and `afterEach` options specifically to the key combinations defined in that hook call, allowing multiple `useShortcuts` hooks under the same scope to use different guards without cross-interference.
- **Enhanced Contextual Typing**:
  - Handlers passed to `useShortcut` and `useShortcuts` strictly infer `(event: KeyboardEvent)` rather than `any`.
- **Synchronized with `@keybindy/core@2.0.1`**:
  - Inherits per-shortcut `beforeEach` and `afterEach` options and sequential key order improvements.

## [2.0.0] - 2026-08-30

### Major Features & Improvements

- **New `useShortcut` & `useShortcuts` Hooks**:
  - Introduced `useShortcut(keys, handler, options?)` for ultra-clean single-shortcut bindings.
  - Introduced `useShortcuts(shortcuts, options?)` for declarative multi-shortcut definitions.
  - **Zero Lifecycle Blinking & Zero Stale Closures**: Powered by a stable ref architecture where listeners are registered once on mount and unregister on unmount, while callbacks always execute with the freshest state and props.
- **Cascading Scope & Mode Support**:
  - Added `scopeMode?: 'default' | 'cascade'` and `priority?: number` props to `<Keybindy />`, `useShortcuts`, and `useShortcut`.
  - Automatic cleanup on unmount: restores previous scope mode, cleans up priority weights, and pops unmounted scopes.
- **Dedicated Guard & Interceptor Hooks**:
  - Added `useBeforeShortcut(hook, options?)` and `useAfterShortcut(hook, options?)`.
- **Programmatic Control Hook Renamed**:
  - Renamed manager hook to `useShortcutManager` for crystal-clear intent.
  - Retained `useKeybindy` as a direct alias for 100% backward compatibility.
- **100% Headless**:
  - Removed `ShortcutLabel` to keep the library purely headless and free of hardcoded CSS, allowing developers to style badges using their own UI components (shadcn/ui, Radix, Tailwind, etc.).
- **Synchronized with `@keybindy/core@2.0.0`**:
  - Full support for `ignoreInputs`, `enableInInput`, and forgiving key aliases.

### [1.1.12] - 2025-09-21

### Changes

- Introduces a new feature to the `<Keybindy />` component, allowing the `shortcuts` prop to accept a function that returns an array of shortcuts. This provides greater flexibility for defining keybindings, especially in dynamic or complex scenarios.

### [1.1.11] - 2025-08-08

### Changes

- Updated dependencies
  - @keybindy/core@1.1.7

### [1.1.10] - 2025-08-08

### Changes

- renamed `renderKeys` props to `render`.
- Fixed a bug where `render(previously renderKey)` prop in `ShortcutLabel` could show duplicates.

### [1.1.8] - 2025-08-08

### Changes

- Updated `ShortcutLabel` to support nested arrays of keys.

### [1.1.7] - 2025-08-08

### Changes

- Updated dependencies
  - @keybindy/core@1.1.6

## [1.1.6] - 2025-08-07

### Changes

- Updated dependencies
  - @keybindy/core@1.1.5

## [1.1.1 - 1.1.5] - 2025-08-06

### Changes

- **Bug Fix**: Fixed a critical bug where `hold` shortcuts would fail to trigger their `keyup` event if the handler updated component state, causing a re-render. The `<Keybindy>` component is now internally resilient, making stateful `hold` actions stable and reliable.
- **DX**: Improved the developer experience by refining and centralizing TypeScript types. The ambiguous `ShortcutDefinition` type has been renamed to the more intuitive `KeybindyShortcut`.
- **Performance**: Wrapped the `<Keybindy>` component in `React.memo` to prevent unnecessary re-renders and improve performance.
- fixed package.json
- Updated dependencies
  - @keybindy/core@1.1.4

## 1.1.0

### Features

- **Full Sync with Core**: This version is fully synchronized with [`@keybindy/core@1.1.0`](https://github.com/keybindyjs/keybindy/blob/main/packages/core/CHANGELOG.md), meaning all new shortcut options (`hold`, `triggerOn: 'keyup'`, and `repeat`) are now automatically supported in the `<Keybindy>` component and `useKeybindy` hook.

### Bug Fixes

- **SSR Compatibility**: The `useKeybindy` hook and `<Keybindy>` component are now safe for server-side rendering (SSR) in frameworks like Next.js. The library will no longer cause crashes on the server.
- **Component Stability**: Fixed a bug where the component's effect could be triggered unnecessarily, leading to multiple shortcut registrations.

### Internal

- Migrated to a pnpm-managed monorepo to streamline development and ensure package synchronization.

## 1.0.1

### Patch Changes

- Export types from `@keybindy/core` to enable type usage in React components and hooks

## 1.0.0

### Major Changes

- Initial release.
