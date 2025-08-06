import type {
  Keys,
  ShortcutHandler,
  ShortcutOptions,
  Shortcut,
  KeyBinding,
  HoldShortcutHandler,
} from './types';
import { expandAliases } from './utils/expandAliases';
import { normalizeKey } from './utils/normalizeKey';
import { generateUID } from './utils/generateUID';
import { ScopeManager } from './ScopeManager';
import { EventEmitter } from './utils/eventemitter';
import { Logger } from './utils/log';

type ShortcutManagerOptions = {
  onShortcutFired?: (shortcut: Shortcut) => void;
  silent?: boolean;
};

/**
 * Manages keyboard shortcuts with support for scopes, enabling/disabling,
 * dynamic registration, and cheat sheet generation.
 */
export class ShortcutManager extends ScopeManager {
  private shortcuts: Shortcut[] = [];
  private pressedKeys = new Set<string>();
  private activeHoldShortcuts = new Set<string>();
  private typingEmitter = new EventEmitter<{
    key: string;
    event: KeyboardEvent;
  }>();

  private activeSequences: {
    keys: string[];
    buffer: { key: string; time: number }[];
  }[] = [];
  private onShortcutFired: (shortcut: Shortcut) => void = () => {};
  private logger: Logger = new Logger();

  constructor({ onShortcutFired, silent = false }: ShortcutManagerOptions = {}) {
    super();
    this.onShortcutFired = onShortcutFired || (() => {});
    this.logger = new Logger({ silent });

    if (typeof window === 'undefined') {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('[Keybindy] Unsupported environment');
      }
      return;
    }

    this.start();
  }

  start() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Disables all shortcuts in the specified scope or all scopes if no scope is provided.
   * @param scope - The scope to disable shortcuts in.
   */
  disableAll(scope?: string) {
    if (!scope) {
      this.shortcuts.forEach(s => (s.enabled = false));
      return;
    }
    this.shortcuts.forEach(s => (s.options?.scope === scope ? (s.enabled = false) : null));
  }

  /**
   * Enables all shortcuts in the specified scope or all scopes if no scope is provided.
   * @param scope - The scope to enable shortcuts in.
   */
  enableAll(scope?: string) {
    if (!scope) {
      this.shortcuts.forEach(s => (s.enabled = true));
      return;
    }
    this.shortcuts.forEach(s => (s.options?.scope === scope ? (s.enabled = true) : null));
  }

  /**
   * Registers a callback to be called when a key is typed.
   * @param callback - The callback function to be called.
   */
  onTyping(callback: (payload: { key: string; event: KeyboardEvent }) => void) {
    return this.typingEmitter.on(callback);
  }

  /**
   * Handles `keydown` events, checks for matching shortcuts,
   * and triggers the appropriate handler.
   * @param e - The keyboard event object.
   * @private
   */
  private handleKeyDown = (e: KeyboardEvent) => {
    const key = normalizeKey(e.code).toLowerCase();
    const now = Date.now();

    if (!e.repeat) {
      this.pressedKeys.add(key);
    }

    this.typingEmitter.emit({ key: e.key, event: e });

    const simultaneousMatches: Shortcut[] = [];
    let sequentialFired = false;
    let holdFired = false;

    for (const shortcut of this.shortcuts) {
      if (!shortcut.enabled || (shortcut.options?.scope || 'global') !== this.getActiveScope()) {
        continue;
      }

      const expected = shortcut.keys.map(k => k.toLowerCase());
      const allMatch = expected.every(k => this.pressedKeys.has(k));

      if (shortcut.options?.hold) {
        if (allMatch && !this.activeHoldShortcuts.has(shortcut.id)) {
          if (e.repeat && !shortcut.options.repeat) continue;
          if (shortcut.options.preventDefault) e.preventDefault();
          (shortcut.handler as HoldShortcutHandler)(e, 'down');
          this.activeHoldShortcuts.add(shortcut.id);
          this.onShortcutFired(shortcut);
          holdFired = true;
        }
      } else if (shortcut.options?.sequential) {
        if (e.repeat) continue; // Sequential shortcuts should not repeat
        const delay = shortcut.options.sequenceDelay ?? 1000;
        let seq = this.activeSequences.find(
          s => JSON.stringify(s.keys) === JSON.stringify(expected)
        );

        if (!seq) {
          if (key === expected[0]) {
            seq = { keys: expected, buffer: [{ key, time: now }] };
            this.activeSequences.push(seq);
          }
        } else {
          seq.buffer.push({ key, time: now });
          seq.buffer = seq.buffer.filter(entry => now - entry.time <= delay);

          const pressedSeq = seq.buffer.map(entry => entry.key);
          const isMatch = expected.every((k, i) => pressedSeq[i] === k);

          if (isMatch && expected.length === pressedSeq.length) {
            if (shortcut.options.preventDefault) e.preventDefault();
            (shortcut.handler as (event: KeyboardEvent) => void)(e);
            this.onShortcutFired(shortcut);
            this.clearSequence(seq.keys);
            sequentialFired = true;
          }
        }
      } else {
        // Simultaneous
        if (allMatch && shortcut.options?.triggerOn === 'keydown') {
          if (e.repeat && !shortcut.options.repeat) continue;
          simultaneousMatches.push(shortcut);
        }
      }
    }

    if (holdFired || sequentialFired) {
      return;
    }

    if (simultaneousMatches.length > 0) {
      const bestMatch = simultaneousMatches.reduce((best, current) =>
        current.keys.length > best.keys.length ? current : best
      );
      if (bestMatch.options?.preventDefault) e.preventDefault();
      (bestMatch.handler as (event: KeyboardEvent) => void)(e);
      this.onShortcutFired(bestMatch);
    }

    this.activeSequences = this.activeSequences.filter(seq => {
      const delay =
        this.shortcuts.find(s => JSON.stringify(s.keys) === JSON.stringify(seq.keys))?.options
          ?.sequenceDelay ?? 1000;
      return now - seq.buffer[0]?.time <= delay;
    });
  };

  /**
   * Clears a sequence of keys from active sequences.
   * @param keys - The key combination to clear.
   * @private
   */
  private clearSequence(keys: string[]) {
    this.activeSequences = this.activeSequences.filter(
      s => JSON.stringify(s.keys) !== JSON.stringify(keys)
    );
  }

  /**
   * Handles `keyup` events by removing the released key from the pressed keys set.
   * @param e - The keyboard event object.
   * @private
   */
  private handleKeyUp = (e: KeyboardEvent) => {
    const key = normalizeKey(e.code).toLowerCase();

    // Handle hold shortcuts
    for (const shortcutId of this.activeHoldShortcuts) {
      const shortcut = this.shortcuts.find(s => s.id === shortcutId);
      if (shortcut && shortcut.keys.map(k => k.toLowerCase()).includes(key)) {
        if (shortcut.options?.preventDefault) e.preventDefault();
        (shortcut.handler as HoldShortcutHandler)(e, 'up');
        this.activeHoldShortcuts.delete(shortcutId);
      }
    }

    // Handle keyup-triggered simultaneous shortcuts
    const simultaneousMatches: Shortcut[] = [];
    for (const shortcut of this.shortcuts) {
      if (
        shortcut.enabled &&
        (shortcut.options?.scope || 'global') === this.getActiveScope() &&
        shortcut.options?.triggerOn === 'keyup' &&
        !shortcut.options.sequential &&
        !shortcut.options.hold
      ) {
        const expected = shortcut.keys.map(k => k.toLowerCase());
        const allButReleasedMatch = expected
          .filter(k => k !== key)
          .every(k => this.pressedKeys.has(k));

        if (allButReleasedMatch && expected.includes(key)) {
          simultaneousMatches.push(shortcut);
        }
      }
    }

    if (simultaneousMatches.length > 0) {
      const bestMatch = simultaneousMatches.reduce((best, current) =>
        current.keys.length > best.keys.length ? current : best
      );
      if (bestMatch.options?.preventDefault) e.preventDefault();
      (bestMatch.handler as (event: KeyboardEvent) => void)(e);
      this.onShortcutFired(bestMatch);
    }

    this.pressedKeys.delete(key);
  };

  /**
   * Registers a keyboard shortcut with the provided handler and options.
   * Duplicate bindings in the same scope are overwritten.
   *
   * @param keys - A key combination or list of combinations.
   * @param handler - Callback function to execute when shortcut is triggered.
   * @param options - Optional configuration including scope, ID, and metadata.
   */
  register(keys: KeyBinding, handler: ShortcutHandler, options?: ShortcutOptions) {
    const bindings: Keys[][] = Array.isArray(keys[0]) ? (keys as Keys[][]) : [keys as Keys[]];

    const id = options?.data?.id || generateUID();

    for (const binding of bindings) {
      const expandedCombos = expandAliases(binding);

      for (const combo of expandedCombos) {
        const normalized = combo.map(k => k.toLowerCase() as Keys);

        this.shortcuts = this.shortcuts.filter(
          s =>
            JSON.stringify(s.keys) !== JSON.stringify(normalized) ||
            s.options?.scope !== (options?.scope || this.getActiveScope()) ||
            s.id !== id
        );

        this.shortcuts.push({
          id,
          keys: normalized,
          handler,
          options: {
            ...options,
            sequential: options?.sequential || false,
            sequenceDelay: options?.sequenceDelay || 1000,
            scope: options?.scope || this.getActiveScope(),
            hold: options?.hold || false,
            triggerOn: options?.triggerOn || 'keydown',
            repeat: options?.repeat === true,
          },
          enabled: true,
        });
        this.pushScope(options?.scope ?? 'global');
      }
    }
  }

  /**
   * Unregisters a previously registered shortcut based on the key combination and scope.
   * @param keys - The key combination to remove.
   * @param scope - The scope in which the shortcut was registered (default: "global").
   */
  unregister(keys: Keys[], scope: string = 'global') {
    const expandedCombos = expandAliases(keys);

    for (const combo of expandedCombos) {
      const normalized = combo.map(k => k.toLowerCase() as Keys);
      this.shortcuts = this.shortcuts.filter(
        s => s.options?.scope !== scope || JSON.stringify(s.keys) !== JSON.stringify(normalized)
      );
    }
  }

  /**
   * Toggles the state (enabled/disabled) of a shortcut.
   * @param keys - The shortcut key combination.
   * @param scope - The scope to match against.
   * @param state - The new state (`true`, `false`, or `"toggle"`).
   * @private
   */
  private toggleState(keys: Keys[], scope: string, state: boolean | 'toggle') {
    const expandedCombos = expandAliases(keys);
    let matched = false;

    for (const combo of expandedCombos) {
      const normalized = combo.map(k => k.toLowerCase());

      this.shortcuts.forEach(s => {
        const sameScope = !s.options?.scope || s.options.scope === scope;
        const sameKeys = JSON.stringify(s.keys) === JSON.stringify(normalized);

        if (sameKeys && sameScope) {
          matched = true;
          s.enabled = state === 'toggle' ? !s.enabled : state;
        }
      });
    }

    if (!matched) {
      this.logger.warn(`No matching shortcut for ${JSON.stringify(keys)} in scope "${scope}"`);
    }
  }

  /**
   * Enables a specific shortcut based on key combination and scope.
   * @param keys - The key combination to enable.
   * @param scope - The target scope (default: "global").
   */
  enable(keys: Keys[], scope = 'global') {
    this.toggleState(keys, scope, true);
  }

  /**
   * Disables a specific shortcut based on key combination and scope.
   * @param keys - The key combination to disable.
   * @param scope - The target scope (default: "global").
   */
  disable(keys: Keys[], scope = 'global') {
    this.toggleState(keys, scope, false);
  }

  /**
   * Toggles a specific shortcut's enabled state based on key combination and scope.
   * @param keys - The key combination to toggle.
   * @param scope - The target scope (default: "global").
   */
  toggle(keys: Keys[], scope = 'global') {
    this.toggleState(keys, scope, 'toggle');
  }

  /**
   * Clears the internal state, removing all pressed keys and event listeners.
   * This does not unregister shortcuts.
   */
  clear() {
    this.pressedKeys.clear();
    this.activeHoldShortcuts.clear();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.logger.log('Instance cleared');
  }

  /**
   * Completely destroys the manager instance by clearing all listeners and shortcuts.
   * Prevents further registration of shortcuts.
   */
  destroy() {
    this.clear();
    this.shortcuts = [];
    this.resetScope();
    this.activeSequences = [];
    this.activeHoldShortcuts.clear();
    this.logger.log('Instance destroyed');
  }

  /**
   * Generates a simplified cheat sheet of registered shortcuts for the current scope.
   * Useful for displaying in a UI.
   *
   * @param scope - Optional scope filter (default is the currently active scope).
   * @returns An array of objects containing key combos and associated data.
   */
  getCheatSheet(scope = this.getActiveScope()) {
    const grouped = new Map<string, { keys: Set<string>; data: Record<string, string> }>();

    for (const s of this.shortcuts) {
      if (s.options?.scope && s.options.scope !== scope) continue;

      const id = s.id;
      const keyCombo = s.keys
        .map(k => {
          if (k.startsWith('ctrl')) return 'ctrl';
          if (k.startsWith('shift')) return 'shift';
          if (k.startsWith('alt')) return 'alt';
          if (k.startsWith('meta')) return 'meta';
          return k;
        })
        .join(s.options?.sequential ? ' → ' : ' + ')
        .toUpperCase();

      if (!grouped.has(id)) {
        grouped.set(id, {
          keys: new Set([keyCombo]),
          data: s.options?.data ?? {},
        });
      } else {
        grouped.get(id)!.keys.add(keyCombo);
      }
    }

    return Array.from(grouped.values()).map(g => ({
      keys: Array.from(g.keys),
      ...g.data,
    }));
  }

  /**
   * Returns detailed information about all shortcuts organized by scope.
   *
   * @param scope - Optional scope to filter by. If omitted, returns info for all scopes.
   * @returns A scope-specific breakdown of all registered shortcuts.
   */
  getScopesInfo(scope?: string) {
    const scopesMap: Record<
      string,
      {
        shortcuts: {
          keys: string[];
          id: string;
          enabled: boolean;
          data?: Record<string, string>;
        }[];
        isActive?: boolean;
      }
    > = {};

    for (const s of this.shortcuts) {
      const sScope = s.options?.scope || 'global';
      if (scope && sScope !== scope) continue;

      if (!scopesMap[sScope]) {
        scopesMap[sScope] = { shortcuts: [] };
      }

      scopesMap[sScope].shortcuts.push({
        keys: s.keys.map(k => k.toUpperCase()),
        id: s.id,
        enabled: s.enabled ?? true,
        data: s.options?.data ?? {},
      });

      if (sScope === this.getActiveScope()) {
        scopesMap[sScope].isActive = true;
      }
    }

    return scope ? scopesMap[scope] || null : scopesMap;
  }
}
