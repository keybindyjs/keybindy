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
   * Custom render function for full control over how your keys are rendered.
   * This function receives the entire `keys` array (either `string[]` or `string[][]`)
   * and should return the ReactNode to be displayed.
   */
  render?: (keys: AllowedKeys[] | AllowedKeys[][]) => React.ReactNode;
}

/**
 * ... (rest of the description) ...
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
 * // With custom render prop
 * <ShortcutLabel
 *   keys={['ctrl', 'shift', 'a']}
 *   render={(keys) => {
 *     // 'keys' here will be ['ctrl', 'shift', 'a']
 *     return keys.map((key) => (
 *       <span key={key} style={{ color: '#00eaff' }}>
 *         {key.toUpperCase()}
 *       </span>
 *     ));
 *   }}
 * />
 *
 * @example
 * // With custom render prop for multiple bindings
 * <ShortcutLabel
 *   keys={[['ctrl', 's'], ['meta', 's']]}
 *   render={(bindings) => {
 *     // 'bindings' here will be [['ctrl', 's'], ['meta', 's']]
 *     return bindings.map((binding, bindingIndex) => (
 *       <React.Fragment key={bindingIndex}>
 *         {binding.map((key, keyIndex) => (
 *           <span key={keyIndex} style={{ fontWeight: 'bold' }}>
 *             {key}
 *           </span>
 *         ))}
 *         {bindingIndex < bindings.length - 1 && ' or '}
 *       </React.Fragment>
 *     ));
 *   }}
 * />
 *
 * @param {ShortcutLabelProps} props - Props for the ShortcutLabel component
 * @param {string[] | string[][]} props.keys - The list of keys to display.
 * @param {Function} [props.render] - Optional custom render function for full control over how your keys are rendered.
 *
 * @returns {JSX.Element} Rendered shortcut label
 */
export const ShortcutLabel = ({ keys, render, style, ...props }: ShortcutLabelProps) => {
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

  const renderBinding = (binding: AllowedKeys[] | AllowedKeys[][]) => {
    if (render) {
      return render(binding);
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
        ? render
          ? renderBinding(keys)
          : (keys as AllowedKeys[][]).map((binding, index) => (
              <React.Fragment key={index}>
                {renderBinding(binding)}
                {index < keys.length - 1 && ' / '}
              </React.Fragment>
            ))
        : renderBinding(keys as AllowedKeys[])}
    </kbd>
  );
};
