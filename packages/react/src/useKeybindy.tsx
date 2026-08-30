import React from 'react';
import ShortcutManager from '@keybindy/core';
import type {
  Keys,
  Shortcut,
  ShortcutHandler,
  ShortcutOptions,
  ShortcutBinding,
  ScopeMode,
  ScopePriorityInput,
  BeforeEachHook,
  AfterEachHook,
  HookOptions,
} from '@keybindy/core';

let sharedInstance: ShortcutManager | null = null;

const getSharedInstance = (options?: {
  onShortcutFired?: (info: Shortcut) => void;
  silent?: boolean;
  ignoreInputs?: boolean;
  scopeMode?: ScopeMode;
}) => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!sharedInstance) {
    sharedInstance = new ShortcutManager(options);
  }
  return sharedInstance;
};

export type UseShortcutManagerReturn = {
  register: (keys: ShortcutBinding, handler: ShortcutHandler, options?: ShortcutOptions) => void;
  unregister: (keys: ShortcutBinding, scope?: string) => void;
  enable: (keys: Keys[], scope?: string) => void;
  disable: (keys: Keys[], scope?: string) => void;
  toggle: (keys: Keys[], scope?: string) => void;
  setScope: (scope: string) => void;
  getCheatSheet: (scope?: string) =>
    | ({
        keys: Keys[] | Keys[][];
        hold: boolean;
        sequential: boolean;
        enabled: boolean;
      } & Record<string, any>)[]
    | undefined;
  destroy: () => void;
  getScopeInfo: (scope?: string) => any;
  getActiveScope: () => string | undefined;
  popScope: (scope?: string) => void;
  pushScope: (scope: string) => void;
  resetScope: () => void;
  getScopes: () => string[] | undefined;
  isScopeActive: (scope: string) => boolean | undefined;
  setScopeMode: (mode: ScopeMode) => void;
  getScopeMode: () => ScopeMode | undefined;
  setScopePriority: ((scope: string, priority: number) => void) &
    ((input: ScopePriorityInput) => void);
  getScopePriority: (scope?: string) => number | Record<string, number> | null | undefined;
  getScopePriorityValue: (scope: string) => number | undefined;
  getSortedScopes: () => string[] | undefined;
  clearScopePriority: () => void;
  removeScopePriority: (scope: string) => void;
  onTyping: (callback: (payload: { key: string; event: KeyboardEvent }) => void) => void;
  enableAll: (scope?: string) => void;
  clear: () => void;
  disableAll: (scope?: string) => void;
  beforeEach: (hook: BeforeEachHook, options?: HookOptions) => () => void;
  afterEach: (hook: AfterEachHook, options?: HookOptions) => () => void;
  manager: ShortcutManager | null;
};

export type UseKeybindyReturn = UseShortcutManagerReturn;

/**
 * Low-level programmatic hook to manage keyboard shortcuts and the `ShortcutManager` instance.
 * Safe for server-side rendering (SSR) - manager initializes on client.
 *
 * @param {Object} config - Configuration object.
 * @param {boolean} [config.logs=false] - Whether to enable debug logs in the console.
 * @param {boolean} [config.ignoreInputs=false] - Global default to ignore shortcuts when typing in inputs/textareas.
 * @param {(info: Shortcut) => void} [config.onShortcutFired] - Callback for when a shortcut is fired.
 * @param {ScopeMode} [config.scopeMode] - Initial scope mode ('default' | 'cascade').
 *
 * @returns {UseShortcutManagerReturn} Object containing programmatic methods and manager instance.
 */
export const useShortcutManager = ({
  logs = false,
  ignoreInputs = false,
  onShortcutFired,
  scopeMode,
}: {
  logs?: boolean;
  ignoreInputs?: boolean;
  onShortcutFired?: (info: Shortcut) => void;
  scopeMode?: ScopeMode;
} = {}): UseShortcutManagerReturn => {
  const [manager, setManager] = React.useState<ShortcutManager | null>(null);

  React.useEffect(() => {
    if (!manager) {
      const instance = getSharedInstance({
        onShortcutFired,
        silent: !logs,
        ignoreInputs,
        scopeMode,
      });
      setManager(instance);
    }
  }, []);

  const log = (...args: any[]) => {
    if (logs) console.log('[Keybindy]', ...args);
  };

  const warn = (...args: any[]) => {
    if (logs) console.warn('[Keybindy]', ...args);
  };

  const register = React.useCallback(
    (keys: ShortcutBinding, handler: ShortcutHandler, options?: ShortcutOptions) => {
      if (!manager) return;
      if (keys.length === 0) {
        warn('No keys provided to register');
        return;
      }
      const id = options?.data?.id;
      log('Registered:', id ?? keys);
      manager.register(keys, handler, options);
    },
    [manager]
  );

  const unregister = React.useCallback(
    (keys: ShortcutBinding, scope?: string) => {
      if (!manager) return;
      if (keys.length === 0) {
        warn('No keys provided to unregister');
        return;
      }
      manager.unregister(keys, scope);
      log('Unregistered:', keys);
    },
    [manager]
  );

  const enable = React.useCallback(
    (keys: Keys[], scope?: string) => {
      if (!manager) return;
      if (keys.length === 0) {
        warn('No keys provided to enable');
        return;
      }
      manager.enable(keys, scope);
      log('Enabled:', keys);
    },
    [manager]
  );

  const disable = React.useCallback(
    (keys: Keys[], scope?: string) => {
      if (!manager) return;
      if (keys.length === 0) {
        warn('No keys provided to disable');
        return;
      }
      manager.disable(keys, scope);
      log('Disabled:', keys);
    },
    [manager]
  );

  const toggle = React.useCallback(
    (keys: Keys[], scope?: string) => {
      if (!manager) return;
      if (keys.length === 0) {
        warn('No keys provided to toggle');
        return;
      }
      manager.toggle(keys, scope);
      log('Toggled:', keys);
    },
    [manager]
  );

  const getCheatSheet = React.useCallback(
    (scope?: string) => {
      return manager?.getCheatSheet(scope);
    },
    [manager]
  );

  const getActiveScope = React.useCallback(() => {
    return manager?.getActiveScope();
  }, [manager]);

  const disableAll = React.useCallback(
    (scope?: string) => {
      manager?.disableAll(scope);
      log(`Disabled all shortcuts${scope ? ` in scope "${scope}"` : ''}`);
    },
    [manager]
  );

  const enableAll = React.useCallback(
    (scope?: string) => {
      manager?.enableAll(scope);
      log(`Enabled all shortcuts${scope ? ` in scope "${scope}"` : ''}`);
    },
    [manager]
  );

  const setScope = React.useCallback(
    (scope: string) => {
      manager?.setActiveScope(scope);
      log('Scope set to:', scope);
    },
    [manager]
  );

  const resetScope = React.useCallback(() => {
    manager?.resetScope();
    log('Reset scope');
  }, [manager]);

  const getScopes = React.useCallback(() => {
    return manager?.getScopes();
  }, [manager]);

  const isScopeActive = React.useCallback(
    (scope: string) => {
      return manager?.isScopeActive(scope);
    },
    [manager]
  );

  const setScopeMode = React.useCallback(
    (mode: ScopeMode) => {
      manager?.setScopeMode(mode);
      log('Scope mode set to:', mode);
    },
    [manager]
  );

  const getScopeMode = React.useCallback(() => {
    return manager?.getScopeMode();
  }, [manager]);

  const setScopePriority = React.useCallback(
    (scopeOrInput: string | ScopePriorityInput, priority?: number) => {
      if (typeof scopeOrInput === 'string' && typeof priority === 'number') {
        manager?.setScopePriority(scopeOrInput, priority);
        log(`Scope "${scopeOrInput}" priority set to:`, priority);
      } else {
        manager?.setScopePriority(scopeOrInput as ScopePriorityInput);
        log('Scope priority set');
      }
    },
    [manager]
  ) as ((scope: string, priority: number) => void) & ((input: ScopePriorityInput) => void);

  const getScopePriority = React.useCallback(
    (scope?: string) => {
      return manager?.getScopePriority(scope);
    },
    [manager]
  );

  const getScopePriorityValue = React.useCallback(
    (scope: string) => {
      return manager?.getScopePriorityValue(scope);
    },
    [manager]
  );

  const getSortedScopes = React.useCallback(() => {
    return manager?.getSortedScopes();
  }, [manager]);

  const clearScopePriority = React.useCallback(() => {
    manager?.clearScopePriority();
    log('Cleared scope priority');
  }, [manager]);

  const removeScopePriority = React.useCallback(
    (scope: string) => {
      manager?.removeScopePriority(scope);
      log(`Removed scope "${scope}" from priority`);
    },
    [manager]
  );

  const onTyping = React.useCallback(
    (callback: (payload: { key: string; event: KeyboardEvent }) => void) => {
      manager?.onTyping(callback);
    },
    [manager]
  );

  const popScope = React.useCallback(
    (scope?: string) => {
      manager?.popScope(scope);
      log('Popped scope, active scope is:', manager?.getActiveScope());
    },
    [manager]
  );

  const pushScope = React.useCallback(
    (scope: string) => {
      manager?.pushScope(scope);
      log('Pushed scope:', scope);
    },
    [manager]
  );

  const getScopeInfo = React.useCallback(
    (scope?: string) => {
      return manager?.getScopesInfo(scope);
    },
    [manager]
  );

  const beforeEach = React.useCallback(
    (hook: BeforeEachHook, options?: HookOptions) => {
      return manager?.beforeEach(hook, options) ?? (() => {});
    },
    [manager]
  );

  const afterEach = React.useCallback(
    (hook: AfterEachHook, options?: HookOptions) => {
      return manager?.afterEach(hook, options) ?? (() => {});
    },
    [manager]
  );

  const destroy = () => {
    manager?.destroy();
  };

  const clear = () => {
    manager?.clear();
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
    setScopeMode,
    getScopeMode,
    setScopePriority,
    getScopePriority,
    getScopePriorityValue,
    getSortedScopes,
    clearScopePriority,
    removeScopePriority,
    onTyping,
    enableAll,
    clear,
    disableAll,
    beforeEach,
    afterEach,
    manager,
  };
};

/**
 * @deprecated Use `useShortcutManager` for programmatic manager access or `useShortcut` / `useShortcuts` for component shortcuts.
 */
export const useKeybindy = useShortcutManager;

/**
 * React hook to register a guard hook before shortcuts execute.
 * Returning `false` will cancel/abort the shortcut execution.
 *
 * @param hook - Guard function to run before matching shortcuts.
 * @param options - Optional filter options (scope, keys).
 */
export const useBeforeShortcut = (hook: BeforeEachHook, options?: HookOptions): void => {
  const hookRef = React.useRef(hook);
  hookRef.current = hook;

  React.useEffect(() => {
    const instance = getSharedInstance();
    if (!instance) return;

    const unregister = instance.beforeEach((shortcut, event) => {
      return hookRef.current(shortcut, event);
    }, options);

    return () => {
      unregister();
    };
  }, [options?.scope, JSON.stringify(options?.keys)]);
};

/**
 * React hook to register an interceptor hook after shortcuts successfully execute.
 *
 * @param hook - Interceptor function to run after matching shortcuts.
 * @param options - Optional filter options (scope, keys).
 */
export const useAfterShortcut = (hook: AfterEachHook, options?: HookOptions): void => {
  const hookRef = React.useRef(hook);
  hookRef.current = hook;

  React.useEffect(() => {
    const instance = getSharedInstance();
    if (!instance) return;

    const unregister = instance.afterEach((shortcut, event) => {
      hookRef.current(shortcut, event);
    }, options);

    return () => {
      unregister();
    };
  }, [options?.scope, JSON.stringify(options?.keys)]);
};
