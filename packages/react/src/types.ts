import type { Keys, ShortcutHandler, ShortcutOptions } from '@keybindy/core';

/**
 * Represents a shortcut definition for the `<Keybindy />` component.
 */
export type KeybindyShortcut = {
  /**
   * The key combination(s) to listen for.
   * Can be a single array of keys or an array of key combinations.
   */
  keys: Keys[] | Keys[][];

  /**
   * Callback function to invoke when the shortcut is triggered.
   */
  handler: ShortcutHandler;

  /**
   * Optional configuration, including scope and other metadata.
   */
  options?: Omit<ShortcutOptions, 'scope'>;
};
