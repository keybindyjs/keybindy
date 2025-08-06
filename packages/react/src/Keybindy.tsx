import React from 'react';
import type {
  Keys,
  Shortcut as ShortcutType,
  ShortcutHandler,
  ShortcutOptions,
  HoldShortcutHandler,
} from '@keybindy/core';
import { useKeybindy } from './useKeybindy';

/**
 * Represents a keyboard shortcut definition.
 */
type ShortcutDefinition = {
  /**
   * The key combination(s) to listen for.
   * Can be a single array of keys or an array of key combinations.
   */
  keys: Keys[] | Keys[][];

  /**
   * Callback function to invoke when the shortcut is triggered.
   */
  handler: ShortcutHandler | HoldShortcutHandler;

  /**
   * Optional configuration, including scope and other metadata.
   */
  options?: Omit<ShortcutOptions, 'scope'>;
};

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
  shortcuts?: ShortcutDefinition[];

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

/**
 * `<Keybindy />` is a React component that registers keyboard shortcuts within a given scope. It allows
 * users to define custom shortcuts and their associated handlers, while managing scope-based shortcut behavior.
 * The component listens for keyboard events and triggers the registered handler when the corresponding keys are pressed.
 * It also provides an optional callback (`onShortcutFired`) to notify users when a shortcut is triggered.
 *
 * @component
 *
 * @example
 * // Basic usage
 * <Keybindy scope="global" shortcuts={[{ keys: ['ctrl', 's'], handler: saveDocument }]} >
 *   <div>Content with shortcuts</div>
 * </Keybindy>
 *
 * @example
 * // With custom callback for onShortcutFired
 * <Keybindy
 *   scope="editor"
 *   shortcuts={[{ keys: ['ctrl', 'e'], handler: editDocument }]}
 *   onShortcutFired={(info) => console.log('Shortcut fired:', info)}
 * >
 *   <div>Editor with shortcuts</div>
 * </Keybindy>
 *
 * @param {ShortcutProps} props - Props for the Shortcut component.
 * @param {string} props.scope - The scope under which the shortcuts should be active.
 * @param {ShortcutDefinition[]} [props.shortcuts] - An array of shortcut definitions, each containing keys, handler, and options.
 * @param {boolean} [props.disabled=false] - Whether the shortcuts should be disabled for this scope.
 * @param {(info: Shortcut) => void} [props.onShortcutFired] - Optional callback triggered when a shortcut is fired, providing the shortcut info.
 * @param {React.ReactNode} props.children - The children to be rendered inside the component, which can contain any JSX elements.
 *
 * @returns {JSX.Element} The rendered component with registered shortcuts within the provided scope.
 */
export const Keybindy: React.FC<KeybindyProps> = ({
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
  const prevScope = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!manager) {
      return;
    }

    prevScope.current = manager.getActiveScope() ?? 'global';

    // Add scope if doesn't exist
    if (!getScopes()?.includes(scope)) {
      pushScope(scope);
    }

    // Set this scope as active
    setScope(scope);

    // Register all shortcuts for this scope
    shortcuts.forEach(({ keys, handler, options }) => {
      register(keys, handler, { ...options, scope });
    });

    if (disabled) {
      manager.disableAll(scope);
    } else {
      manager.enableAll(scope);
    }

    return () => {
      shortcuts.forEach(({ keys }) => {
        if (Array.isArray(keys[0])) {
          keys.forEach(key => unregister(key as Keys[], scope));
        } else {
          unregister(keys as Keys[], scope);
        }
      });

      popScope();
    };
  }, [scope, shortcuts, manager, disabled]);

  return <>{children}</>;
};
