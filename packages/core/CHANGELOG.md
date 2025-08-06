# @keybindy/core

## 1.1.1

### Patch Changes

- fixed package.json

## [1.1.0] - 2025-08-06

### Features

- **Holdable Shortcuts**: A new `hold: true` option has been added to `ShortcutOptions`. This allows creating shortcuts that trigger on both key down and key up, ideal for "push-to-talk" style interactions. The handler receives a `state` argument (`"down"` or `"up"`) to indicate the key state.
- **Key-Up Trigger**: A new `triggerOn: 'keyup'` option allows shortcuts to be fired upon key release instead of the default key press.
- **Repeatable Shortcuts**: A new `repeat: true` option has been added to allow shortcut handlers to be fired continuously when a key is held down.

### Internal

- Migrated to a pnpm-managed monorepo to streamline development and ensure package synchronization.
