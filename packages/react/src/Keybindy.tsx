import React from 'react';
import type { Keys, Shortcut as ShortcutType, ShortcutHandler } from '@keybindy/core';
import { useKeybindy } from './useKeybindy';
import type { KeybindyShortcut } from './types';

/**
 * Props for the `<Keybindy />` component.
 */
type KeybindyProps = {
  /**
   * The scope under which the shortcuts should be active.
   * This allows managing different contexts for shortcuts.
   */
  scope?: 'global' | string;

  /**
   * Array of shortcut definitions to register for this scope.
   */
  shortcuts?: KeybindyShortcut[];

  /**
   * Whether the shortcuts should be disabled for this scope.
   * Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * Callback function that will be called when a shortcut is fired.
   * Receives the fired shortcut info as an argument.
   */
  onShortcutFired?: (info: ShortcutType) => void;

  /**
   * Whether to enable debug logs in the console.
   */
  logs?: boolean;

  /**
   * The content that will be rendered inside the Shortcut component.
   */
  children?: React.ReactNode;
};

const KeybindyComponent: React.FC<KeybindyProps> = ({
  scope = 'global',
  shortcuts = [],
  children,
  disabled,
  onShortcutFired,
  logs = false,
}) => {
  const { register, unregister, manager, pushScope, popScope, getScopes, setScope } = useKeybindy({
    onShortcutFired,
    logs,
  });

  // Memoize a stable representation of shortcuts, excluding the handler.
  // This prevents the effect from re-running unnecessarily.
  const stableShortcuts = React.useMemo(() => {
    return shortcuts.map(({ keys, options }) => ({ keys, options }));
  }, [JSON.stringify(shortcuts.map(s => ({ keys: s.keys, options: s.options })))]);

  // Use a ref to store the latest handlers, preventing re-renders from causing issues.
  const handlersRef = React.useRef<Record<string, ShortcutHandler>>({});

  React.useEffect(() => {
    handlersRef.current = shortcuts.reduce(
      (acc, { keys, handler }) => {
        const key = JSON.stringify(keys);
        acc[key] = handler;
        return acc;
      },
      {} as Record<string, ShortcutHandler>
    );
  });

  React.useEffect(() => {
    if (!manager) {
      return;
    }

    if (!getScopes()?.includes(scope)) {
      pushScope(scope);
    }
    setScope(scope);

    // Register shortcuts using the stable definitions.
    stableShortcuts.forEach(({ keys, options }) => {
      const stableHandler: ShortcutHandler = (event, state) => {
        const key = JSON.stringify(keys);
        const currentHandler = handlersRef.current[key];
        if (currentHandler) {
          (currentHandler as any)(event, state);
        }
      };
      register(keys, stableHandler, { ...options, scope });
    });

    if (disabled) {
      manager.disableAll(scope);
    } else {
      manager.enableAll(scope);
    }

    return () => {
      // Unregister using the same stable definitions.
      stableShortcuts.forEach(({ keys }) => {
        if (Array.isArray(keys[0])) {
          (keys as Keys[][]).forEach(key => unregister(key, scope));
        } else {
          unregister(keys as Keys[], scope);
        }
      });
      popScope();
    };
  }, [scope, manager, disabled, stableShortcuts]);

  return <>{children}</>;
};

export const Keybindy = React.memo(KeybindyComponent);
