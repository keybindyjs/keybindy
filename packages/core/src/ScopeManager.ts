import { warn } from './utils/log';
import type { ScopeMode, ScopePriorityInput, ScopePriorityRecord } from './types';

export class ScopeManager {
  private scopeStack: string[] = ['global'];
  private scopePriorities: Map<string, number> = new Map();
  private scopeMode: ScopeMode = 'default';
  private explicitCascadeMode: boolean = false;

  /**
   * Sets the operating mode for scopes:
   * - 'default': (Default) Single active scope mode — enables active scope and isolates/disables the rest.
   * - 'cascade': Cascading scope mode — multiple scopes active with numeric priority resolution (higher number = higher priority).
   * @param mode - 'default' | 'cascade'
   */
  setScopeMode(mode: ScopeMode) {
    this.scopeMode = mode;
    this.explicitCascadeMode = mode === 'cascade';
  }

  /**
   * Returns the current scope mode ('default' | 'cascade').
   */
  getScopeMode(): ScopeMode {
    return this.scopeMode;
  }

  /**
   * Pushes a new scope onto the scope stack.
   * @param scope - The scope to push.
   */
  pushScope(scope: string) {
    if (!scope) return;
    if (this.scopeStack.includes(scope)) return;
    this.scopeStack.push(scope);
  }

  /**
   * Pops a scope from the scope stack.
   * If a specific scope name is passed, removes that scope from the stack.
   * Otherwise pops the top scope from the stack.
   * @param scope - Optional scope name to remove.
   */
  popScope(scope?: string) {
    if (scope && scope !== 'global') {
      this.scopeStack = this.scopeStack.filter(s => s !== scope);
      if (this.scopeStack.length === 0) {
        this.scopeStack = ['global'];
      }
      return;
    }
    if (this.scopeStack.length > 1) {
      this.scopeStack.pop();
    }
  }

  /**
   * Activates the given scope by bringing it to the top of the stack.
   * @param scope - The scope to activate.
   */
  setActiveScope(scope: string) {
    if (!scope) return;
    if (!this.scopeStack.includes(scope)) {
      warn('Scope not found: ' + scope);
      return;
    }
    // Remove scope from its current position and push to the top of the stack
    this.scopeStack = this.scopeStack.filter(s => s !== scope);
    this.scopeStack.push(scope);
  }

  /**
   * Resets the scope stack to default and clears all priority weights and mode.
   */
  resetScope() {
    this.scopeStack = ['global'];
    this.scopePriorities.clear();
    this.scopeMode = 'default';
    this.explicitCascadeMode = false;
  }

  /**
   * Sets the numeric priority for a specific scope, or sets a map/record of scope priorities.
   * Automatically switches `scopeMode` to 'cascade'.
   * Higher numbers indicate higher priority (e.g. 100 > 10 > 0).
   *
   * @example
   * manager.setScopePriority('modal', 100);
   * manager.setScopePriority({ modal: 100, timeline: 10 });
   * manager.setScopePriority((prev) => ({ ...prev, modal: 100 }));
   */
  setScopePriority(scope: string, priority: number): void;
  setScopePriority(input: ScopePriorityInput): void;
  setScopePriority(scopeOrInput: string | ScopePriorityInput, priority?: number) {
    if (typeof scopeOrInput === 'string' && typeof priority === 'number') {
      this.scopePriorities.set(scopeOrInput, priority);
      this.scopeMode = 'cascade';
      return;
    }

    let resolved: ScopePriorityRecord | Map<string, number>;
    if (typeof scopeOrInput === 'function') {
      const currentRecord: ScopePriorityRecord = {};
      const allScopes = Array.from(new Set([...this.scopeStack, ...this.scopePriorities.keys()]));
      for (const s of allScopes) {
        currentRecord[s] = this.getScopePriorityValue(s);
      }
      resolved = scopeOrInput(currentRecord);
    } else {
      resolved = scopeOrInput as ScopePriorityRecord | Map<string, number>;
    }

    this.scopePriorities.clear();
    if (resolved instanceof Map) {
      for (const [s, p] of resolved.entries()) {
        if (typeof p === 'number') this.scopePriorities.set(s, p);
      }
    } else if (resolved && typeof resolved === 'object') {
      for (const [s, p] of Object.entries(resolved)) {
        if (typeof p === 'number') this.scopePriorities.set(s, p);
      }
    }

    if (this.scopePriorities.size === 0) {
      this.scopeMode = 'default';
      this.explicitCascadeMode = false;
      return;
    }

    this.scopeMode = 'cascade';
    this.explicitCascadeMode = true;
  }

  /**
   * Returns the numeric priority for a scope, or a record of all configured scope priorities.
   * If scope is omitted, returns a record of all priorities, or `null` if none set.
   * @param scope - Optional scope name to get priority for.
   */
  getScopePriority(scope?: string): number | ScopePriorityRecord | null {
    if (scope) {
      return this.getScopePriorityValue(scope);
    }
    if (this.scopeMode === 'cascade' || this.scopePriorities.size > 0) {
      const result: ScopePriorityRecord = {};
      const allScopes = Array.from(new Set([...this.scopeStack, ...this.scopePriorities.keys()]));
      for (const s of allScopes) {
        result[s] = this.getScopePriorityValue(s);
      }
      return result;
    }
    return null;
  }

  /**
   * Returns the numeric priority weight for a scope.
   * If not explicitly configured, defaults to its position in the scopeStack (index * 1).
   * @param scope - The scope name.
   */
  getScopePriorityValue(scope: string): number {
    if (this.scopePriorities.has(scope)) {
      return this.scopePriorities.get(scope)!;
    }
    const index = this.scopeStack.indexOf(scope);
    if (index !== -1) {
      return index * 1;
    }
    return 0;
  }

  /**
   * Returns all active scopes sorted in descending order of numeric priority.
   * Ties are broken by position in the scope stack (more recent on top).
   */
  getSortedScopes(): string[] {
    if (this.scopeMode !== 'cascade') {
      return [this.getActiveScope()];
    }

    const allScopes = Array.from(new Set([...this.scopeStack, ...this.scopePriorities.keys()]));
    return allScopes.sort((a, b) => {
      const pA = this.getScopePriorityValue(a);
      const pB = this.getScopePriorityValue(b);
      if (pA !== pB) {
        return pB - pA; // Descending: highest number first
      }
      // Tie breaker: stack position
      const indexA = this.scopeStack.indexOf(a);
      const indexB = this.scopeStack.indexOf(b);
      return indexB - indexA;
    });
  }

  /**
   * Clears all scope priority weights and restores strict single-scope mode ('default').
   */
  clearScopePriority() {
    this.scopePriorities.clear();
    this.scopeMode = 'default';
    this.explicitCascadeMode = false;
  }

  /**
   * Removes the numeric priority weight for a scope.
   * If no dynamic priorities remain, restores 'default' mode.
   * @param scope - The scope name to remove.
   */
  removeScopePriority(scope: string) {
    this.scopePriorities.delete(scope);

    if (!this.explicitCascadeMode && this.scopePriorities.size === 0) {
      this.scopeMode = 'default';
      if (scope !== 'global') {
        this.popScope(scope);
      }
    }
  }

  /**
   * Returns the active scope.
   * In cascade mode, returns the scope with the highest numeric priority.
   * In default mode, returns the top of the scope stack.
   */
  getActiveScope(): string {
    if (this.scopeMode === 'cascade') {
      const sorted = this.getSortedScopes();
      return sorted[0] || this.scopeStack[this.scopeStack.length - 1];
    }
    return this.scopeStack[this.scopeStack.length - 1];
  }

  /**
   * Checks if the given scope is active.
   * In 'cascade' mode, returns true if the scope is in the priority map or scope stack.
   * In 'default' mode, returns true if the scope is the single active scope.
   * @param scope - The scope to check.
   * @returns `true` if the scope is active, `false` otherwise.
   */
  isScopeActive(scope?: string): boolean {
    const target = scope || 'global';
    if (this.scopeMode === 'cascade') {
      return this.scopePriorities.has(target) || this.scopeStack.includes(target);
    }
    return this.getActiveScope() === target;
  }

  /**
   * Returns all scopes in the stack.
   * @returns An array of scopes.
   */
  getScopes(): string[] {
    return [...this.scopeStack];
  }
}
