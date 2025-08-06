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

const getSharedInstance = (options?: {
  onShortcutFired?: (info: Shortcut) => void;
  silent?: boolean;
}) => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!sharedInstance) {
    sharedInstance = new ShortcutManager(options);
  }
  return sharedInstance;
};

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
  getActiveScope: () => string | undefined;
  popScope: () => void;
  pushScope: (scope: string) => void;
  resetScope: () => void;
  getScopes: () => string[] | undefined;
  isScopeActive: (scope: string) => boolean | undefined;
  onTyping: (callback: (payload: { key: string; event: KeyboardEvent }) => void) => void;
  enableAll: (scope?: string) => void;
  clear: () => void;
  disableAll: (scope?: string) => void;
  manager: ShortcutManager | null;
};

/**
 * React hook to manage keyboard shortcuts using a shared instance of `ShortcutManager`.
 * This hook is safe for server-side rendering (SSR) and will only initialize the manager on the client.
 *
 * @param {Object} config - Configuration object.
 * @param {boolean} [config.logs=false] - Whether to enable debug logs in the console.
 * @param {(info: Shortcut) => void} [config.onShortcutFired] - Callback for when a shortcut is fired.
 *
 * @returns {Object} Object containing shortcut management methods and the manager instance (null on server).
 */
export const useKeybindy = ({
  logs = false,
  onShortcutFired,
}: { logs?: boolean; onShortcutFired?: (info: Shortcut) => void } = {}): UseKeybindyReturn => {
  const [manager, setManager] = React.useState<ShortcutManager | null>(null);

  React.useEffect(() => {
    if (!manager) {
      const instance = getSharedInstance({ onShortcutFired, silent: !logs });
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
    (
      keys: Keys[] | Keys[][],
      handler: ShortcutHandler | HoldShortcutHandler,
      options?: ShortcutOptions
    ) => {
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
    (keys: Keys[], scope?: string) => {
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

  const onTyping = React.useCallback(
    (callback: (payload: { key: string; event: KeyboardEvent }) => void) => {
      manager?.onTyping(callback);
    },
    [manager]
  );

  const popScope = React.useCallback(() => {
    manager?.popScope();
    log('Popped scope, active scope is:', manager?.getActiveScope());
  }, [manager]);

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
    onTyping,
    enableAll,
    clear,
    disableAll,
    manager,
  };
};
