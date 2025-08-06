# @keybindy/react

## [1.1.1 - 1.1.5] - 2025-08-06

### Patch Changes

- **Bug Fix**: Fixed a critical bug where `hold`
  shortcuts would fail to trigger their `keyup` event if the
  handler updated component state, causing a re-render. The
  `<Keybindy>` component is now internally resilient, making
  stateful `hold` actions stable and reliable.
- **DX**: Improved the developer experience by refining
  and centralizing TypeScript types. The ambiguous
  `ShortcutDefinition` type has been renamed to the more
  intuitive `KeybindyShortcut`.
- **Performance**: Wrapped the `<Keybindy>` component in
  `React.memo` to prevent unnecessary re-renders and improve
  performance.
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
