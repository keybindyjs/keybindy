/**
 * Represents a valid keyboard key for registering shortcuts in the ShortcutManager.
 * This type includes all supported keys, covering modifiers (e.g., Ctrl, Shift),
 * letters (A-Z), digits (0-9), numpad keys, symbols, control keys (e.g., Esc, Enter),
 * navigation keys (e.g., Arrow Up), function keys (F1-F24), media keys, browser keys,
 * application keys, language keys, system keys, and editing keys.
 */
export type Keys =
  | 'Ctrl'
  | 'Ctrl (Left)'
  | 'Ctrl (Right)'
  | 'Shift'
  | 'Shift (Left)'
  | 'Shift (Right)'
  | 'Alt'
  | 'Alt (Left)'
  | 'Alt (Right)'
  | 'Meta'
  | 'Meta (Left)'
  | 'Meta (Right)'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'Numpad 0'
  | 'Numpad 1'
  | 'Numpad 2'
  | 'Numpad 3'
  | 'Numpad 4'
  | 'Numpad 5'
  | 'Numpad 6'
  | 'Numpad 7'
  | 'Numpad 8'
  | 'Numpad 9'
  | 'Numpad +'
  | 'Numpad -'
  | 'Numpad *'
  | 'Numpad /'
  | 'Numpad Enter'
  | 'Numpad .'
  | 'Numpad ='
  | 'Numpad ,'
  | 'Numpad ('
  | 'Numpad )'
  | '-'
  | '='
  | '['
  | ']'
  | '\\'
  | ';'
  | "'"
  | ','
  | '.'
  | '/'
  | '`'
  | 'Intl \\'
  | 'Intl Ro'
  | 'Intl Yen'
  | 'Esc'
  | 'Tab'
  | 'Caps Lock'
  | 'Enter'
  | 'Space'
  | 'Backspace'
  | 'Num Lock'
  | 'Scroll Lock'
  | 'Pause'
  | 'Context Menu'
  | 'Print Screen'
  | 'Insert'
  | 'Delete'
  | 'Home'
  | 'End'
  | 'Page Up'
  | 'Page Down'
  | 'Arrow Up'
  | 'Arrow Down'
  | 'Arrow Left'
  | 'Arrow Right'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12'
  | 'F13'
  | 'F14'
  | 'F15'
  | 'F16'
  | 'F17'
  | 'F18'
  | 'F19'
  | 'F20'
  | 'F21'
  | 'F22'
  | 'F23'
  | 'F24'
  | 'Volume Mute'
  | 'Volume Down'
  | 'Volume Up'
  | 'Media Next Track'
  | 'Media Previous Track'
  | 'Media Play/Pause'
  | 'Media Stop'
  | 'Media Select'
  | 'Browser Home'
  | 'Browser Search'
  | 'Browser Favorites'
  | 'Browser Refresh'
  | 'Browser Stop'
  | 'Browser Forward'
  | 'Browser Back'
  | 'Launch App 1'
  | 'Launch App 2'
  | 'Launch Mail'
  | 'Launch Media Player'
  | 'Launch Calculator'
  | 'Convert'
  | 'Non Convert'
  | 'Kana Mode'
  | 'Language 1'
  | 'Language 2'
  | 'Language 3'
  | 'Language 4'
  | 'Language 5'
  | 'Power'
  | 'Sleep'
  | 'Wake Up'
  | 'Eject'
  | 'Undo'
  | 'Redo'
  | 'Copy'
  | 'Cut'
  | 'Paste'
  | 'Select'
  | 'Again'
  | 'Find'
  | 'Open'
  | 'Properties'
  | 'Help'
  | 'Fn'
  | 'Brightness Up'
  | 'Brightness Down';

export type HoldState = 'down' | 'up';
export type HoldShortcutHandler = (event: KeyboardEvent, state: HoldState) => void;

/**
 * Function to handle a keyboard event triggered by a shortcut.
 */
export type ShortcutHandler = ((event: KeyboardEvent) => void) | HoldShortcutHandler;

/**
 * Configuration options for a shortcut.
 */
export interface ShortcutOptions {
  /**
   * Prevents the default action of the event.
   */
  preventDefault?: boolean;
  /**
   * Specifies the scope of the shortcut ("global" or custom).
   */
  scope?: 'global' | string;
  /**
   * Enables sequential key combinations.
   */
  sequential?: boolean;
  /**
   * Maximum time (ms) between sequential key presses.
   */
  sequenceDelay?: number;
  /**
   * Metadata for the shortcut.
   */
  data?: Record<string, string>;
  /**
   * Whether the shortcut should be a "hold" action.
   */
  hold?: boolean;
  /**
   * Specifies which keyboard event should trigger the shortcut handler.
   * - 'keydown': (Default) The handler fires immediately when the keys are pressed down.
   * - 'keyup': The handler fires only when the last key of the combination is released.
   *
   * This option is only applicable for simultaneous shortcuts.
   * It is ignored for 'sequential' and 'hold' shortcuts.
   */
  triggerOn?: 'keydown' | 'keyup';
  /**
   * Controls the behavior of a shortcut when keys are held down.
   * - `false`: (Default) The handler will only be fired once when the keys are first pressed. It will not fire again until the keys are released and pressed again.
   * - `true`: The handler will be fired repeatedly as the OS sends `keydown` events.
   */
  repeat?: boolean;
}

/**
 * Defines a keyboard shortcut.
 */
export interface Shortcut {
  /**
   * Unique identifier for the shortcut.
   */
  id: string;
  /**
   * Array of keys to trigger the shortcut.
   */
  keys: Keys[];
  /**
   * Function to call when the shortcut is triggered.
   */
  handler: ShortcutHandler;
  /**
   * Optional configuration for the shortcut.
   */
  options?: ShortcutOptions;
  /**
   * Whether the shortcut is active.
   */
  enabled?: boolean;
}

/**
 * Defines the key combinations that can trigger a shortcut.
 * It can be a single combination (e.g., `['Ctrl', 'S']`) or multiple
 * combinations for the same shortcut (e.g., `[['Ctrl', 'K'], ['Meta', 'K']]`).
 */
export type ShortcutBinding = Keys[] | Keys[][];
