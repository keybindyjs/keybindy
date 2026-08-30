export { Keybindy, type KeybindyProps } from './Keybindy';
export {
  useShortcut,
  useShortcuts,
  type UseShortcutOptions,
  type UseShortcutsOptions,
} from './useShortcuts';
export {
  useShortcutManager,
  useKeybindy,
  useBeforeShortcut,
  useAfterShortcut,
  type UseShortcutManagerReturn,
  type UseKeybindyReturn,
} from './useKeybindy';

// types
export type { KeybindyShortcut } from './types';
// Re-export essential types from the core package
export type {
  Keys,
  Key,
  ShortcutBinding,
  ShortcutOptions,
  Shortcut,
  ShortcutHandler,
  ShortcutManagerOptions,
  BeforeEachHook,
  AfterEachHook,
  HookOptions,
  ScopeMode,
  ScopePriorityInput,
  ScopePriorityRecord,
} from '@keybindy/core';
