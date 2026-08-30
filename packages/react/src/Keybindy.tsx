import React from 'react';
import { useShortcuts, type UseShortcutsOptions } from './useShortcuts';
import type { KeybindyShortcut } from './types';

/**
 * Props for the `<Keybindy />` component.
 */
export type KeybindyProps = UseShortcutsOptions & {
  /**
   * An array of shortcut definitions or a function that returns an array of shortcuts.
   */
  shortcuts?: KeybindyShortcut[] | (() => KeybindyShortcut[]);

  /**
   * Child elements to render within the Keybindy context.
   */
  children?: React.ReactNode;
};

const KeybindyComponent: React.FC<KeybindyProps> = ({
  children,
  shortcuts = [],
  ...options
}) => {
  useShortcuts(shortcuts, options);
  return <>{children}</>;
};

export const Keybindy = React.memo(KeybindyComponent);
