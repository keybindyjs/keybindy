# @keybindy/core

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
