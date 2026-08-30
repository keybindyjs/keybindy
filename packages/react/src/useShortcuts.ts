import React from 'react';
import type {
  Shortcut,
  ShortcutHandler,
  BeforeEachHook,
  AfterEachHook,
  ScopeMode,
  ShortcutBinding,
  ShortcutOptions,
} from '@keybindy/core';
import { useShortcutManager } from './useKeybindy';
import type { KeybindyShortcut } from './types';

/**
 * Options for `useShortcuts` hook.
 */
export type UseShortcutsOptions = {
  /**
   * The scope under which the shortcuts should be active.
   * Defaults to `'global'`.
   */
  scope?: 'global' | string;

  /**
   * Scope management mode:
   * - `'default'`: Only shortcuts in the single active scope are enabled.
   * - `'cascade'`: Shortcuts across all active scopes are enabled, with common shortcut collisions resolved by scope priority or stack order.
   */
  scopeMode?: ScopeMode;

  /**
   * Whether all shortcuts in this scope should be disabled.
   * Defaults to `false`.
   */
  disabled?: boolean;

  /**
   * Numeric priority weight for this scope in cascade mode.
   * Higher numbers take precedence over lower numbers (e.g. 100 > 10 > 0).
   */
  priority?: number;

  /**
   * Whether to ignore shortcuts when typing inside an input, textarea, select, or contenteditable.
   * Can be overridden per shortcut via `enableInInput: true` or `ignoreInputs: false`.
   */
  ignoreInputs?: boolean;

  /**
   * Guard hook that runs before any shortcut in this scope executes.
   * Return `false` to cancel/abort execution.
   */
  beforeEach?: BeforeEachHook;

  /**
   * Interceptor hook that runs after any shortcut in this scope successfully executes.
   */
  afterEach?: AfterEachHook;

  /**
   * Callback function that will be called when a shortcut is fired.
   * Receives the fired shortcut info as an argument.
   */
  onShortcutFired?: (info: Shortcut) => void;

  /**
   * Whether to enable debug logs in the console.
   */
  logs?: boolean;
};

/**
 * Options for single `useShortcut` hook.
 */
export type UseShortcutOptions = Omit<ShortcutOptions, 'scope'> & {
  /**
   * The scope under which the shortcut should be active.
   * Defaults to `'global'`.
   */
  scope?: 'global' | string;

  /**
   * Scope management mode: `'default'` | `'cascade'`.
   */
  scopeMode?: ScopeMode;

  /**
   * Whether the shortcut is disabled.
   */
  disabled?: boolean;

  /**
   * Numeric priority weight for this scope in cascade mode.
   */
  priority?: number;

  /**
   * Whether to ignore shortcut when typing inside an input/textarea.
   */
  ignoreInputs?: boolean;

  /**
   * Guard hook that runs before this shortcut executes. Return `false` to abort.
   */
  beforeEach?: BeforeEachHook;

  /**
   * Interceptor hook that runs after this shortcut executes.
   */
  afterEach?: AfterEachHook;

  /**
   * Whether to enable debug logs in the console.
   */
  logs?: boolean;
};

/**
 * React hook to register multiple keyboard shortcuts declaratively.
 * Safe from stale closures and re-registration flickering/blinking.
 *
 * @param shortcutsProp - An array of shortcut definitions or a function returning shortcuts.
 * @param options - Scope, priority, mode, and lifecycle configuration.
 */
export const useShortcuts = (
  shortcutsProp: KeybindyShortcut[] | (() => KeybindyShortcut[]) = [],
  options: UseShortcutsOptions = {}
): void => {
  const {
    scope = 'global',
    scopeMode,
    disabled,
    priority,
    ignoreInputs,
    beforeEach,
    afterEach,
    onShortcutFired,
    logs = false,
  } = options;

  const {
    register,
    unregister,
    manager,
    pushScope,
    popScope,
    getScopes,
    setScope,
    setScopeMode,
    setScopePriority,
    removeScopePriority,
  } = useShortcutManager({
    onShortcutFired,
    logs,
  });

  const beforeEachRef = React.useRef(beforeEach);
  beforeEachRef.current = beforeEach;

  const afterEachRef = React.useRef(afterEach);
  afterEachRef.current = afterEach;

  // Resolve shortcuts from prop, whether array or function
  const shortcuts = typeof shortcutsProp === 'function' ? shortcutsProp() : shortcutsProp;

  // Keep a ref of current handlers so our stable handler closures never go stale.
  const handlersRef = React.useRef<Record<string, ShortcutHandler>>({});
  handlersRef.current = {};
  shortcuts.forEach(({ keys, handler }) => {
    handlersRef.current[JSON.stringify(keys)] = handler;
  });

  // Create stable shortcuts definitions containing only serializable fields (keys, options).
  const stableShortcuts = React.useMemo(() => {
    return shortcuts.map(({ keys, options: opt }) => ({ keys, options: opt }));
  }, [JSON.stringify(shortcuts.map(s => ({ keys: s.keys, options: s.options })))]);

  React.useEffect(() => {
    if (!manager) return;

    let prevScopeMode: ScopeMode | undefined;
    if (scopeMode) {
      prevScopeMode = manager.getScopeMode();
      setScopeMode(scopeMode);
    }

    if (typeof priority === 'number') {
      setScopePriority(scope, priority);
    } else {
      if (!getScopes()?.includes(scope)) {
        pushScope(scope);
      }
      setScope(scope);
    }

    let unregisterBefore: (() => void) | undefined;
    let unregisterAfter: (() => void) | undefined;

    if (beforeEach) {
      unregisterBefore = manager.beforeEach((shortcut, event) => {
        return beforeEachRef.current ? beforeEachRef.current(shortcut, event) : undefined;
      }, { scope });
    }

    if (afterEach) {
      unregisterAfter = manager.afterEach((shortcut, event) => {
        if (afterEachRef.current) afterEachRef.current(shortcut, event);
      }, { scope });
    }

    // Register shortcuts using the stable definitions.
    stableShortcuts.forEach(({ keys, options: opt }) => {
      const stableHandler: ShortcutHandler = (event, state) => {
        const key = JSON.stringify(keys);
        const currentHandler = handlersRef.current[key];
        if (currentHandler) {
          (currentHandler as any)(event, state);
        }
      };
      register(keys, stableHandler, {
        ...opt,
        scope,
        ignoreInputs: opt?.ignoreInputs ?? ignoreInputs,
      });
    });

    if (disabled) {
      manager.disableAll(scope);
    } else {
      manager.enableAll(scope);
    }

    return () => {
      if (unregisterBefore) unregisterBefore();
      if (unregisterAfter) unregisterAfter();

      // Unregister using the same stable definitions.
      stableShortcuts.forEach(({ keys }) => {
        unregister(keys, scope);
      });

      if (typeof priority === 'number') {
        removeScopePriority(scope);
      }
      if (scope !== 'global') {
        const remaining = manager.getCheatSheet(scope);
        if (!remaining || remaining.length === 0) {
          popScope(scope);
        }
      }
      if (scopeMode && prevScopeMode !== undefined) {
        setScopeMode(prevScopeMode);
      }
    };
  }, [scope, manager, disabled, priority, scopeMode, Boolean(beforeEach), Boolean(afterEach), stableShortcuts]);
};

/**
 * React hook to register a single keyboard shortcut.
 * Safe from stale closures and re-registration flickering/blinking.
 *
 * @example
 * ```tsx
 * useShortcut(['Ctrl', 'S'], (e) => {
 *   save(currentData);
 * }, { preventDefault: true, scope: 'editor' });
 * ```
 *
 * @param keys - Key combination (e.g. `['Ctrl', 'S']` or `[['Ctrl', 'K'], ['Meta', 'K']]`).
 * @param handler - Callback to execute when shortcut is triggered. Always accesses fresh state without re-registering.
 * @param options - Configuration options for scope, preventDefault, hold, repeat, etc.
 */
export const useShortcut = (
  keys: ShortcutBinding,
  handler: ShortcutHandler,
  options?: UseShortcutOptions
): void => {
  const {
    scope = 'global',
    scopeMode,
    disabled,
    priority,
    ignoreInputs,
    beforeEach,
    afterEach,
    logs,
    ...shortcutOptions
  } = options || {};

  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  const shortcutsGetter = React.useCallback(() => [
    {
      keys,
      handler: ((e, state) => {
        if (handlerRef.current) {
          (handlerRef.current as any)(e, state);
        }
      }) as ShortcutHandler,
      options: shortcutOptions,
    }
  ], [JSON.stringify(keys), JSON.stringify(shortcutOptions)]);

  useShortcuts(shortcutsGetter, {
    scope,
    scopeMode,
    disabled,
    priority,
    ignoreInputs,
    beforeEach,
    afterEach,
    logs,
  });
};
