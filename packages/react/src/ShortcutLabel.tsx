import type { Keys } from '@keybindy/core';
import React from 'react';

type AllowedKeys = Omit<
  Keys,
  | 'Ctrl (Left)'
  | 'Ctrl (Right)'
  | 'Shift (Left)'
  | 'Shift (Right)'
  | 'Alt (Left)'
  | 'Alt (Right)'
  | 'Meta (Left)'
  | 'Meta (Right)'
>;

interface ShortcutLabelProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  /**
   * Array of keys to display. Can be a single binding `['Ctrl', 'S']` or multiple bindings `[['Ctrl', 'S'], ['Cmd', 'S']]`.
   */
  keys: AllowedKeys[] | AllowedKeys[][];
  /**
   * Custom render function for each key
   */
  renderKey?: (
    /**
     * The key to render
     */
    key: string,
    /**
     * The index of the key in the array
     */
    index: number,
    /**
     * All keys in the current binding
     */
    allKeys: string[]
  ) => React.ReactNode;
}

/**
 * `<ShortcutLabel />` is a utility React component that visually renders a keyboard shortcut label.
 *
 * It accepts an array of keys (e.g. `["Ctrl", "S"]`) and renders a styled label using platform-aware
 * symbols (⌘ for Mac, Ctrl for others). Users can also provide a custom render function to override
 * the default display logic for advanced layouts or custom themes.
 *
 * @component
 *
 * @example
 * // Default usage
 * <ShortcutLabel keys={['ctrl', 's']} />
 *
 * @example
 * // With multiple bindings
 * <ShortcutLabel keys={[['ctrl', 's'], ['meta', 's']]} />
 *
 * @example
 * // With custom renderKey
 * <ShortcutLabel
 *   keys={['ctrl', 'alt', 'delete']}
 *   renderKey={(key, i, all) => (
 *     <>
 *       <span style={{ color: '#00eaff' }}>{key.toUpperCase()}</span>
 *       {i < all.length - 1 && <span style={{ opacity: 0.5 }}> + </span>}
 *     </>
 *   )}
 * />
 *
 * @param {ShortcutLabelProps} props - Props for the ShortcutLabel component
 * @param {string[] | string[][]} props.keys - The list of keys to display.
 * @param {Function} [props.renderKey] - Optional custom render function for full control over how each key appears.
 *
 * @returns {JSX.Element} Rendered shortcut label
 */
export const ShortcutLabel = ({ keys, renderKey, style, ...props }: ShortcutLabelProps) => {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);

  const defaultRenderKey = (key: string): string => {
    switch (key.toLowerCase()) {
      case 'meta':
        return isMac ? '⌘' : 'Ctrl';
      case 'ctrl':
        return 'Ctrl';
      case 'shift':
        return '⇧';
      case 'alt':
        return isMac ? '⌥' : 'Alt';
      case 'enter':
        return '↵';
      default:
        return key.toUpperCase();
    }
  };

  const renderSingleBinding = (binding: AllowedKeys[]) => {
    if (renderKey) {
      return binding.map((key, i) => (
        <React.Fragment key={i}>{renderKey(key as string, i, binding as string[])}</React.Fragment>
      ));
    }
    return binding.map(key => defaultRenderKey(key as string)).join(' + ');
  };

  const isNestedArray = Array.isArray(keys[0]);

  return (
    <kbd
      style={{
        fontFamily: 'monospace',
        padding: '2.5px 5px',
        border: '1px solid #cccccc2f',
        backgroundColor: '#2e2e2e',
        borderRadius: '4px',
        userSelect: 'none',
        ...style,
      }}
      {...props}
    >
      {isNestedArray
        ? (keys as AllowedKeys[][]).map((binding, index) => (
            <React.Fragment key={index}>
              {renderSingleBinding(binding)}
              {index < keys.length - 1 && ' / '}
            </React.Fragment>
          ))
        : renderSingleBinding(keys as AllowedKeys[])}
    </kbd>
  );
};
