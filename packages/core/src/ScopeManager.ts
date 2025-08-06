import { warn } from './utils/log';

export class ScopeManager {
  private scopeStack: string[] = ['global'];

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
   * Pops the last scope from the scope stack.
   */
  popScope() {
    if (this.scopeStack.length > 1) {
      this.scopeStack.pop();
    }
  }

  /**
   * Swaps the active scope with the scope at the given index.
   * @param scope - The scope to swap.
   * @param index - The index of the scope to swap.
   * @private
   */
  private swap(scope: string, index: number) {
    const temp = this.scopeStack[index];
    this.scopeStack[index] = scope;
    this.scopeStack[this.scopeStack.length - 1] = temp;
  }

  /**
   * Activates the scope at the given index.
   * @param scope - The scope to activate.
   */
  setActiveScope(scope: string) {
    if (!scope) return;
    if (!this.scopeStack.includes(scope)) {
      warn('Scope not found: ' + scope);
      return;
    }
    const index = this.scopeStack.indexOf(scope);
    if (index === -1) return;
    this.swap(this.getActiveScope(), index);
  }

  /**
   * Resets the scope stack to the default state.
   */
  resetScope() {
    this.scopeStack = ['global'];
  }

  /**
   * Returns the active scope.
   * @returns The active scope.
   */
  getActiveScope(): string {
    return this.scopeStack[this.scopeStack.length - 1];
  }

  /**
   * Checks if the given scope is active.
   * @param scope - The scope to check.
   * @returns `true` if the scope is active, `false` otherwise.
   */
  isScopeActive(scope?: string): boolean {
    return this.getActiveScope() === (scope || 'global');
  }

  /**
   * Returns all scopes in the stack.
   * @returns An array of scopes.
   */
  getScopes(): string[] {
    return [...this.scopeStack];
  }
}
