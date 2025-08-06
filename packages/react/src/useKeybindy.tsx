import React from 'react';
import ShortcutManager from '@keybindy/core';
import type {
  Keys,
  Shortcut,
  ShortcutHandler,
  ShortcutOptions,
  HoldShortcutHandler,
} from '@keybindy/core';

let sharedInstance: ShortcutManager | null = null;

type UseKeybindyReturn = {
  register: (
    keys: Keys[] | Keys[][],
    handler: ShortcutHandler | HoldShortcutHandler,
    options?: ShortcutOptions
  ) => void;
  unregister: (keys: Keys[], scope?: string) => void;
  enable: (keys: Keys[], scope?: string) => void;
  disable: (keys: Keys[], scope?: string) => void;
  toggle: (keys: Keys[], scope?: string) => void;
  setScope: (scope: string) => void;
  getCheatSheet: (scope?: string) =>
    | {
        keys: string[];
      }[]
    | undefined;
  destroy: () => void;
  getScopeInfo: (scope?: string) => any;
  getActiveScope: () => string;
  popScope: () => void;
  pushScope: (scope: string) => void;
  resetScope: () => void;
  getScopes: () => string[];
  isScopeActive: (scope: string) => boolean | undefined;
  onTyping: (callback: (payload: { key: string; event: KeyboardEvent }) => void) => void;
  enableAll: (scope?: string) => void;
  clear: () => void;
  disableAll: (scope?: string) => void;
  manager: ShortcutManager;
};

/**
 * React hook to manage keyboard shortcuts using a shared instance of `ShortcutManager`.
 * Automatically cleans up shortcuts registered by the component on unmount.
 *
 * @param {Object} config - Configuration object.
 * @param {boolean} [config.logs=false] - Whether to enable debug logs in the console.
 *
 * @returns {Object} Object containing shortcut management methods.
 *
 * @example
 * const {
 *   register,
 *   setScope,
 *   getCheatSheet,
 * } = useKeybindy({ logs: true });
 *
 * useEffect(() => {
 *   register(['ctrl', 's'], () => save(), {
 *     scope: 'editor',
 *     data: { description: 'Save document' }
 *   });
 *   setScope('editor');
 * }, []);
 */
export const useKeybindy = ({
  logs = false,
  onShortcutFired,
}: { logs?: boolean; onShortcutFired?: (info: Shortcut) => void } = {}): UseKeybindyReturn => {
  const managerRef = React.useRef<ShortcutManager>(null);
  const registeredIds = React.useRef<Set<string>>(new Set());

  if (!sharedInstance) {
    sharedInstance = new ShortcutManager({ onShortcutFired, silent: !logs });
  }

  if (!managerRef.current) {
    managerRef.current = sharedInstance;
  }

  const log = (...args: any[]) => {
    if (logs) console.log('[Keybindy]', ...args);
  };

  const warn = (...args: any[]) => {
    if (logs) console.warn('[Keybindy]', ...args);
  };

  /**
   * Registers a new keyboard shortcut.
   *
   * @param {Keys[] | Keys[][]} keys - Key combination(s) to listen for.
   * @param {ShortcutHandler | HoldShortcutHandler} handler - Callback function to invoke when shortcut is triggered.
   * @param {ShortcutOptions} [options] - Optional configuration, including scope and metadata.
   */
  const register = React.useCallback(
    (
      keys: Keys[] | Keys[][],
      handler: ShortcutHandler | HoldShortcutHandler,
      options?: ShortcutOptions
    ) => {
      if (keys.length === 0) {
        warn('No keys provided to register');
        return;
      }
      const id = options?.data?.id;
      if (id) registeredIds.current.add(id);
      log('Registered:', id ?? keys);
      managerRef.current?.register(keys, handler, options);
    },
    []
  );

  /**
   * Unregisters a previously registered keyboard shortcut.
   *
   * @param {Keys[]} keys - Key combination to unregister.
   * @param {string} [scope] - Optional scope for more targeted unregistration.
   */
  const unregister = React.useCallback((keys: Keys[], scope?: string) => {
    if (keys.length === 0) {
      warn('No keys provided to unregister');
      return;
    }
    managerRef.current?.unregister(keys, scope);
    log('Unregistered:', keys);
  }, []);

  /**
   * Enables a previously disabled shortcut.
   *
   * @param {Keys[]} keys - Key combination to enable.
   * @param {string} [scope] - Optional scope to target a specific set.
   */
  const enable = React.useCallback((keys: Keys[], scope?: string) => {
    if (keys.length === 0) {
      warn('No keys provided to enable');
      return;
    }
    managerRef.current?.enable(keys, scope);
    log('Enabled:', keys);
  }, []);

  /**
   * Disables a shortcut so it no longer triggers its handler.
   *
   * @param {Keys[]} keys - Key combination to disable.
   * @param {string} [scope] - Optional scope to target a specific set.
   */
  const disable = React.useCallback((keys: Keys[], scope?: string) => {
    if (keys.length === 0) {
      warn('No keys provided to disable');
      return;
    }
    managerRef.current?.disable(keys, scope);
    log('Disabled:', keys);
  }, []);

  /**
   * Toggles a shortcut between enabled and disabled.
   *
   * @param {Keys[]} keys - Key combination to toggle.
   * @param {string} [scope] - Optional scope to target a specific set.
   */
  const toggle = React.useCallback((keys: Keys[], scope?: string) => {
    if (keys.length === 0) {
      warn('No keys provided to toggle');
      return;
    }
    managerRef.current?.toggle(keys, scope);
    log('Toggled:', keys);
  }, []);

  /**
   * Returns a list of shortcuts registered in a given scope.
   *
   * @param {string} [scope] - The scope to query. Defaults to the active scope.
   * @returns {Array} List of shortcut definitions.
   */
  const getCheatSheet = React.useCallback((scope?: string) => {
    return managerRef.current?.getCheatSheet(scope);
  }, []);

  /**
   * Returns the currently active scope.
   * @returns {string} The active scope.
   */
  const getActiveScope = React.useCallback(() => {
    return managerRef.current?.getActiveScope() ?? '';
  }, []);

  /**
   * Disables all shortcuts in the specified scope or all scopes if no scope is provided.
   * @param scope - The scope to disable shortcuts in.
   */
  const disableAll = React.useCallback((scope?: string) => {
    managerRef.current?.disableAll(scope);
    log(`Disabled all shortcuts${scope ? ` in scope "${scope}"` : ''}`);
  }, []);

  /**
   * Enables all shortcuts in the specified scope or all scopes if no scope is provided.
   * @param scope - The scope to enable shortcuts in.
   */
  const enableAll = React.useCallback((scope?: string) => {
    managerRef.current?.enableAll(scope);
    log(`Enabled all shortcuts${scope ? ` in scope "${scope}"` : ''}`);
  }, []);

  /**
   * Sets the currently active shortcut scope.
   *
   * @param {string} scope - The scope name to set as active.
   */
  const setScope = React.useCallback((scope: string) => {
    managerRef.current?.setActiveScope(scope);
    log('Scope set to:', scope);
  }, []);

  /**
   * Resets the scope stack to the default state.
   */
  const resetScope = React.useCallback(() => {
    managerRef.current?.resetScope();
    log('Reset scope');
  }, []);

  /**
   * Returns all scopes in the stack.
   * @returns An array of scopes.
   */
  const getScopes = React.useCallback(() => {
    return managerRef.current?.getScopes() ?? [];
  }, []);

  /**
   * Checks if the given scope is active.
   * @param scope - The scope to check.
   * @returns `true` if the scope is active, `false` otherwise.
   */
  const isScopeActive = React.useCallback((scope: string) => {
    return managerRef.current?.isScopeActive(scope);
  }, []);

  /**
   * Registers a callback to be called when a key is typed.
   * @param callback - The callback function to be called.
   */
  const onTyping = React.useCallback(
    (callback: (payload: { key: string; event: KeyboardEvent }) => void) => {
      managerRef.current?.onTyping(callback);
    },
    []
  );

  /**
   * Pops the last scope from the scope stack.
   */
  const popScope = React.useCallback(() => {
    managerRef.current?.popScope();
    log('Popped scope, active scope is:', managerRef.current?.getActiveScope());
  }, []);

  /**
   * Pushes a new scope onto the scope stack.
   * @param scope - The scope to push.
   */
  const pushScope = React.useCallback((scope: string) => {
    managerRef.current?.pushScope(scope);
    log('Pushed scope:', scope);
  }, []);

  /**
   * Returns internal information about the registered scopes and shortcuts.
   *
   * @param {string} [scope] - Optional scope to filter results.
   * @returns {Object} Scope information.
   */
  const getScopeInfo = React.useCallback((scope?: string) => {
    return managerRef.current?.getScopesInfo(scope);
  }, []);

  /**
   * Destroys the instance of `ShortcutManager`.
   * This should be called explicitly when you no longer need the manager.
   */
  const destroy = () => {
    managerRef.current?.destroy();
  };

  /**
   * Clears the internal state, removing all pressed keys and event listeners.
   * This does not unregister shortcuts.
   */
  const clear = () => {
    managerRef.current?.clear();
  };

  return {
    register,
    unregister,
    enable,
    disable,
    toggle,
    setScope,
    getCheatSheet,
    destroy,
    getScopeInfo,
    getActiveScope,
    popScope,
    pushScope,
    resetScope,
    getScopes,
    isScopeActive,
    onTyping,
    enableAll,
    clear,
    disableAll,
    manager: managerRef.current,
  };
};
