import type {
  Keys,
  ShortcutHandler,
  ShortcutOptions,
  Shortcut,
  ShortcutBinding,
  HoldShortcutHandler,
  ShortcutManagerOptions,
  BeforeEachHook,
  AfterEachHook,
  HookOptions,
} from './types';
import { expandAliases, keyAliases } from './utils/expandAliases';
import { normalizeKey } from './utils/normalizeKey';
import { generateUID } from './utils/generateUID';
import { isInputTarget } from './utils/isInputTarget';
import { ScopeManager } from './ScopeManager';
import { EventEmitter } from './utils/eventemitter';
import { Logger } from './utils/log';

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
    shortcutId: string;
    keys: string[];
    buffer: { key: string; time: number }[];
  }[] = [];
  private onShortcutFired: (shortcut: Shortcut) => void = () => {};
  private logger: Logger = new Logger();
  private ignoreInputs: boolean = false;
  private beforeHooks: {
    id: string;
    hook: BeforeEachHook;
    options?: HookOptions;
  }[] = [];
  private afterHooks: {
    id: string;
    hook: AfterEachHook;
    options?: HookOptions;
  }[] = [];

  constructor({ onShortcutFired, silent = false, ignoreInputs = false, scopeMode }: ShortcutManagerOptions = {}) {
    super();
    this.onShortcutFired = onShortcutFired || (() => {});
    this.logger = new Logger({ silent });
    this.ignoreInputs = ignoreInputs;
    if (scopeMode) {
      this.setScopeMode(scopeMode);
    }

    if (typeof window === 'undefined') {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('[Keybindy] Unsupported environment');
      }
      return;
    }

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  /**
   * Cleans up keys and sequences when window loses focus.
   * @private
   */
  private handleBlur = () => {
    this.pressedKeys.clear();
    this.activeHoldShortcuts.clear();
    this.activeSequences = [];
  };

  /**
   * Checks whether a shortcut should be ignored when typing inside an interactive input element.
   * @private
   */
  private shouldIgnoreForInput(shortcut: Shortcut, target: EventTarget | null): boolean {
    if (!isInputTarget(target)) return false;
    if (shortcut.options?.enableInInput === true) return false;
    if (shortcut.options?.ignoreInputs === true) return true;
    if (shortcut.options?.ignoreInputs === false) return false;
    return this.ignoreInputs;
  }

  /**
   * Checks whether a shortcut matches the filter options for a hook.
   * @private
   */
  private matchesHook(shortcut: Shortcut, options?: HookOptions): boolean {
    if (!options) return true;

    // Scope check
    if (options.scope) {
      const shortcutScope = shortcut.options?.scope || 'global';
      if (shortcutScope !== options.scope) {
        return false;
      }
    }

    // Keys check
    if (options.keys && options.keys.length > 0) {
      const targetBindings = (
        Array.isArray(options.keys[0]) ? options.keys : [options.keys]
      ) as unknown as Keys[][];

      const isSequential = Boolean(shortcut.options?.sequential);
      const normalizeCombo = (combo: Keys[]): string => {
        const ordered = isSequential ? combo : [...combo].sort();
        return ordered.map(k => k.toLowerCase()).join(isSequential ? '>' : '+');
      };

      const expandedCombos: string[] = [];
      for (const binding of targetBindings) {
        const combos = expandAliases(binding);
        for (const combo of combos) {
          expandedCombos.push(normalizeCombo(combo));
        }
      }

      const shortcutCombo = normalizeCombo([...shortcut.keys] as Keys[]);
      if (!expandedCombos.includes(shortcutCombo)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Runs all matching beforeEach guard hooks.
   * If any hook returns `false`, aborts execution.
   * @private
   */
  private runBeforeHooks(shortcut: Shortcut, event: KeyboardEvent): boolean {
    for (const entry of this.beforeHooks) {
      if (this.matchesHook(shortcut, entry.options)) {
        const result = entry.hook(shortcut, event);
        if (result === false) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Runs all matching afterEach interceptor hooks.
   * @private
   */
  private runAfterHooks(shortcut: Shortcut, event: KeyboardEvent): void {
    for (const entry of this.afterHooks) {
      if (this.matchesHook(shortcut, entry.options)) {
        try {
          entry.hook(shortcut, event);
        } catch (err) {
          this.logger.error(err);
        }
      }
    }
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
   * Handles `keydown` events, tracks pressed keys, resolves matching shortcuts,
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
    const holdMatches: Shortcut[] = [];
    const sequentialMatches: Shortcut[] = [];
    let sequentialFired = false;
    let holdFired = false;

    const isCascade = this.getScopeMode() === 'cascade';
    const isShortcutInActiveScope = (s: Shortcut): boolean => {
      if (!s.enabled) return false;
      const sScope = s.options?.scope || 'global';
      if (isCascade) {
        return this.isScopeActive(sScope);
      }
      return sScope === this.getActiveScope();
    };

    const compareShortcuts = (a: Shortcut, b: Shortcut): Shortcut => {
      if (isCascade) {
        const scopeA = a.options?.scope || 'global';
        const scopeB = b.options?.scope || 'global';
        const priorityA = this.getScopePriorityValue(scopeA);
        const priorityB = this.getScopePriorityValue(scopeB);

        if (priorityA !== priorityB) {
          return priorityA > priorityB ? a : b;
        }
      }
      return a.keys.length >= b.keys.length ? a : b;
    };

    for (const shortcut of this.shortcuts) {
      if (!isShortcutInActiveScope(shortcut)) {
        continue;
      }

      if (this.shouldIgnoreForInput(shortcut, e.target)) {
        continue;
      }

      const expected = shortcut.keys.map(k => k.toLowerCase());
      const allMatch = expected.every(k => this.pressedKeys.has(k));

      if (shortcut.options?.hold) {
        if (allMatch && !this.activeHoldShortcuts.has(shortcut.id)) {
          if (e.repeat && !shortcut.options.repeat) continue;
          holdMatches.push(shortcut);
        }
      } else if (shortcut.options?.sequential) {
        if (e.repeat) continue; // Sequential shortcuts should not repeat
        const delay = shortcut.options.sequenceDelay ?? 1000;
        const seqIndex = this.activeSequences.findIndex(s => s.shortcutId === shortcut.id);

        if (seqIndex === -1) {
          // No active sequence yet for this shortcut
          if (key === expected[0]) {
            this.activeSequences.push({
              shortcutId: shortcut.id,
              keys: expected,
              buffer: [{ key, time: now }],
            });
            if (expected.length === 1) {
              sequentialMatches.push(shortcut);
            }
          }
        } else {
          const seq = this.activeSequences[seqIndex];
          const lastKeyTime = seq.buffer[seq.buffer.length - 1]?.time ?? 0;
          const isExpired = now - lastKeyTime > delay;

          if (isExpired) {
            // Sequence expired: check if key can restart from step 1
            if (key === expected[0]) {
              seq.buffer = [{ key, time: now }];
              if (expected.length === 1) {
                sequentialMatches.push(shortcut);
              }
            } else {
              this.activeSequences.splice(seqIndex, 1);
            }
          } else {
            const nextExpectedIndex = seq.buffer.length;
            if (key === expected[nextExpectedIndex]) {
              seq.buffer.push({ key, time: now });
              if (seq.buffer.length === expected.length) {
                sequentialMatches.push(shortcut);
              }
            } else if (key === expected[0]) {
              // Reset and restart sequence from step 1
              seq.buffer = [{ key, time: now }];
              if (expected.length === 1) {
                sequentialMatches.push(shortcut);
              }
            } else {
              // Key does not belong to sequence — purge immediately so buffer never gets poisoned/stuck
              this.activeSequences.splice(seqIndex, 1);
            }
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

    if (holdMatches.length > 0) {
      const bestHold = holdMatches.reduce((best, current) => compareShortcuts(current, best));
      if (!this.activeHoldShortcuts.has(bestHold.id)) {
        if (this.runBeforeHooks(bestHold, e)) {
          if (bestHold.options?.preventDefault) e.preventDefault();
          (bestHold.handler as HoldShortcutHandler)(e, 'down');
          this.activeHoldShortcuts.add(bestHold.id);
          this.onShortcutFired(bestHold);
          this.runAfterHooks(bestHold, e);
          holdFired = true;
        }
      }
    }

    if (sequentialMatches.length > 0) {
      const bestSequential = sequentialMatches.reduce((best, current) =>
        compareShortcuts(current, best)
      );
      const bestExpected = JSON.stringify(bestSequential.keys.map(k => k.toLowerCase()));
      this.activeSequences = this.activeSequences.filter(
        s => JSON.stringify(s.keys) !== bestExpected
      );

      if (this.runBeforeHooks(bestSequential, e)) {
        if (bestSequential.options?.preventDefault) e.preventDefault();
        (bestSequential.handler as (event: KeyboardEvent) => void)(e);
        this.onShortcutFired(bestSequential);
        this.runAfterHooks(bestSequential, e);
        sequentialFired = true;
      }
    }

    if (holdFired || sequentialFired) {
      return;
    }

    if (simultaneousMatches.length > 0) {
      const bestMatch = simultaneousMatches.reduce((best, current) =>
        compareShortcuts(current, best)
      );
      if (this.runBeforeHooks(bestMatch, e)) {
        if (bestMatch.options?.preventDefault) e.preventDefault();
        (bestMatch.handler as (event: KeyboardEvent) => void)(e);
        this.onShortcutFired(bestMatch);
        this.runAfterHooks(bestMatch, e);
      }
    }

    this.activeSequences = this.activeSequences.filter(seq => {
      const shortcut = this.shortcuts.find(s => s.id === seq.shortcutId);
      const delay = shortcut?.options?.sequenceDelay ?? 1000;
      return now - (seq.buffer[seq.buffer.length - 1]?.time ?? 0) <= delay;
    });
  };

  /**
   * Clears a sequence of keys from active sequences.
   * @param keys - The key combination to clear.
   * @private
   */
  private clearSequence(keys: string[]) {
    const target = JSON.stringify(keys.map(k => k.toLowerCase()));
    this.activeSequences = this.activeSequences.filter(s => JSON.stringify(s.keys) !== target);
  }

  /**
   * Handles `keyup` events, resolves hold actions or `keyup`-triggered shortcuts,
   * and updates pressed key tracking.
   * @param e - The keyboard event object.
   * @private
   */
  private handleKeyUp = (e: KeyboardEvent) => {
    const key = normalizeKey(e.code).toLowerCase();

    const isCascade = this.getScopeMode() === 'cascade';
    const isShortcutInActiveScope = (s: Shortcut): boolean => {
      if (!s.enabled) return false;
      const sScope = s.options?.scope || 'global';
      if (isCascade) {
        return this.isScopeActive(sScope);
      }
      return sScope === this.getActiveScope();
    };

    const compareShortcuts = (a: Shortcut, b: Shortcut): Shortcut => {
      if (isCascade) {
        const scopeA = a.options?.scope || 'global';
        const scopeB = b.options?.scope || 'global';
        const priorityA = this.getScopePriorityValue(scopeA);
        const priorityB = this.getScopePriorityValue(scopeB);

        if (priorityA !== priorityB) {
          return priorityA > priorityB ? a : b;
        }
      }
      return a.keys.length >= b.keys.length ? a : b;
    };

    // Handle hold shortcuts
    for (const shortcutId of this.activeHoldShortcuts) {
      const shortcut = this.shortcuts.find(s => s.id === shortcutId);
      if (shortcut && !this.shouldIgnoreForInput(shortcut, e.target) && shortcut.keys.map(k => k.toLowerCase()).includes(key)) {
        if (this.runBeforeHooks(shortcut, e)) {
          if (shortcut.options?.preventDefault) e.preventDefault();
          (shortcut.handler as HoldShortcutHandler)(e, 'up');
          this.activeHoldShortcuts.delete(shortcutId);
          this.runAfterHooks(shortcut, e);
        }
      }
    }

    // Handle keyup-triggered simultaneous shortcuts
    const simultaneousMatches: Shortcut[] = [];
    for (const shortcut of this.shortcuts) {
      if (
        isShortcutInActiveScope(shortcut) &&
        !this.shouldIgnoreForInput(shortcut, e.target) &&
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
        compareShortcuts(current, best)
      );
      if (this.runBeforeHooks(bestMatch, e)) {
        if (bestMatch.options?.preventDefault) e.preventDefault();
        (bestMatch.handler as (event: KeyboardEvent) => void)(e);
        this.onShortcutFired(bestMatch);
        this.runAfterHooks(bestMatch, e);
      }
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
  register(binding: ShortcutBinding, handler: ShortcutHandler, options?: ShortcutOptions) {
    const bindings = (
      Array.isArray(binding[0]) ? binding : [binding]
    ) as unknown as Keys[][];

    const id = options?.data?.id || generateUID();
    const targetScope = options?.scope || 'global';

    for (const binding of bindings) {
      const expandedCombos = expandAliases(binding);

      for (const combo of expandedCombos) {
        const normalized = combo.map(k => k.toLowerCase() as Keys);

        this.shortcuts = this.shortcuts.filter(
          s =>
            JSON.stringify(s.keys) !== JSON.stringify(normalized) ||
            (s.options?.scope || 'global') !== targetScope
        );

        this.shortcuts.push({
          id,
          keys: normalized,
          handler,
          options: {
            ...options,
            sequential: options?.sequential || false,
            sequenceDelay: options?.sequenceDelay || 1000,
            scope: targetScope,
            hold: options?.hold || false,
            triggerOn: options?.triggerOn || 'keydown',
            repeat: options?.repeat === true,
            ignoreInputs: options?.ignoreInputs,
            enableInInput: options?.enableInInput,
          },
          enabled: true,
        });
        this.pushScope(targetScope);
      }
    }
  }

  /**
   * Unregisters a previously registered shortcut based on the key combination and scope.
   * @param keys - The key combination or list of combinations to remove.
   * @param scope - The scope in which the shortcut was registered (default: "global").
   */
  unregister(keys: ShortcutBinding, scope: string = 'global') {
    const bindings = (
      Array.isArray(keys[0]) ? keys : [keys]
    ) as unknown as Keys[][];

    for (const binding of bindings) {
      const expandedCombos = expandAliases(binding as any);

      for (const combo of expandedCombos) {
        const normalized = combo.map(k => k.toLowerCase() as Keys);
        this.shortcuts = this.shortcuts.filter(
          s => s.options?.scope !== scope || JSON.stringify(s.keys) !== JSON.stringify(normalized)
        );
      }
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
   * Registers a guard hook that runs before any matching shortcut executes.
   * Return `false` from the hook function to cancel/abort execution.
   * @param hook - The guard function to run.
   * @param options - Optional filters (scope, keys).
   * @returns Unsubscribe function to remove the hook.
   *
   * @example
   * const unregister = manager.beforeEach((shortcut, event) => {
   *   if (isReadOnly) return false; // Aborts shortcut
   * });
   */
  beforeEach(hook: BeforeEachHook, options?: HookOptions): () => void {
    const id = generateUID();
    this.beforeHooks.push({ id, hook, options });
    return () => {
      this.beforeHooks = this.beforeHooks.filter(h => h.id !== id);
    };
  }

  /**
   * Registers an interceptor hook that runs after any matching shortcut executes.
   * @param hook - The hook function to run.
   * @param options - Optional filters (scope, keys).
   * @returns Unsubscribe function to remove the hook.
   *
   * @example
   * const unregister = manager.afterEach((shortcut, event) => {
   *   markDirty();
   * });
   */
  afterEach(hook: AfterEachHook, options?: HookOptions): () => void {
    const id = generateUID();
    this.afterHooks.push({ id, hook, options });
    return () => {
      this.afterHooks = this.afterHooks.filter(h => h.id !== id);
    };
  }

  /**
   * Clears the internal state, removing all pressed keys and event listeners.
   * This does not unregister shortcuts.
   */
  clear() {
    this.pressedKeys.clear();
    this.activeHoldShortcuts.clear();
    this.activeSequences = [];
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.logger.log('Instance cleared');
  }

  /**
   * Completely destroys the manager instance by clearing all listeners, shortcuts, and hooks.
   * Prevents further registration of shortcuts.
   */
  destroy() {
    this.clear();
    this.shortcuts = [];
    this.beforeHooks = [];
    this.afterHooks = [];
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
  getCheatSheet(scope = this.getActiveScope()): ({
    keys: Keys[] | Keys[][];
    hold: boolean;
    sequential: boolean;
    enabled: boolean;
  } & Record<string, any>)[] {
    const shortcutsInScope = this.shortcuts.filter(s => (s.options?.scope || 'global') === scope);

    const grouped = new Map<string, Shortcut[]>();
    for (const s of shortcutsInScope) {
      const group = grouped.get(s.id);
      if (group) {
        group.push(s);
      } else {
        grouped.set(s.id, [s]);
      }
    }

    const result = [];
    const reverseAliasMap = new Map<string, string>();
    for (const alias in keyAliases) {
      for (const variant of keyAliases[alias]) {
        reverseAliasMap.set(variant, alias);
      }
    }

    const compareBindings = (a: Keys[][], b: Keys[][]): boolean => {
      if (a.length !== b.length) return false;
      // Convert each inner array to a string to preserve its internal order
      const aStrings = a.map(k => k.join(','));
      const bStrings = b.map(k => k.join(','));

      // Sort the array of strings to compare the sets of combinations, ignoring their order
      const aSorted = aStrings.sort();
      const bSorted = bStrings.sort();
      return JSON.stringify(aSorted) === JSON.stringify(bSorted);
    };

    for (const group of grouped.values()) {
      const representative = group[0];
      const actualBindings = group.map(s => s.keys);

      const firstBinding = actualBindings[0];
      const canonicalGuess = firstBinding.map(key => reverseAliasMap.get(key) || key) as Keys[];

      const expandedGuess = expandAliases(canonicalGuess);

      let finalBindings: Keys[][];
      if (compareBindings(actualBindings, expandedGuess)) {
        finalBindings = [canonicalGuess];
      } else {
        finalBindings = actualBindings;
      }

      result.push({
        keys: finalBindings.length === 1 ? finalBindings[0] : finalBindings,
        hold: representative.options?.hold || false,
        sequential: representative.options?.sequential || false,
        enabled: representative.enabled || true,
        ...representative.options?.data,
      });
    }

    return result.filter(
      (item, index, self) =>
        index === self.findIndex(t => JSON.stringify(t) === JSON.stringify(item))
    );
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
