import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShortcutManager } from './ShortcutManager';

// Helper to dispatch keyboard events
const dispatchKeyEvent = (
  type: 'keydown' | 'keyup',
  code: string,
  repeat = false,
  target: EventTarget = window
) => {
  const event = new KeyboardEvent(type, {
    code,
    bubbles: true,
    ...(type === 'keydown' && { repeat }),
  });
  target.dispatchEvent(event);
};

describe('ShortcutManager', () => {
  let manager: ShortcutManager;
  const onShortcutFired = vi.fn();

  beforeEach(() => {
    // Create a new manager for each test to ensure isolation
    manager = new ShortcutManager({ onShortcutFired, silent: true });
  });

  afterEach(() => {
    // Clean up manager and mocks
    manager.destroy();
    onShortcutFired.mockClear();
    vi.clearAllMocks();
  });

  it('should register and trigger a simple shortcut', () => {
    const handler = vi.fn();
    manager.register(['A'], handler);

    dispatchKeyEvent('keydown', 'KeyA');

    expect(handler).toHaveBeenCalledOnce();
    expect(onShortcutFired).toHaveBeenCalledOnce();
  });

  it('should handle enter and numpad enter alias', () => {
    const handler = vi.fn();
    manager.register(['Enter'], handler);

    dispatchKeyEvent('keydown', 'Enter');
    expect(handler).toHaveBeenCalledTimes(1);

    dispatchKeyEvent('keydown', 'NumpadEnter');
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should register and trigger a simultaneous shortcut', () => {
    const handler = vi.fn();
    manager.register(['Ctrl', 'S'], handler);

    dispatchKeyEvent('keydown', 'ControlLeft');
    dispatchKeyEvent('keydown', 'KeyS');

    expect(handler).toHaveBeenCalledOnce();
    expect(onShortcutFired).toHaveBeenCalledOnce();
  });

  it('should not trigger a simultaneous shortcut if not all keys are pressed', () => {
    const handler = vi.fn();
    manager.register(['Ctrl', 'S'], handler);

    dispatchKeyEvent('keydown', 'KeyS');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should register and trigger a sequential shortcut', () => {
    const handler = vi.fn();
    manager.register(['G', 'D'], handler, { sequential: true });

    dispatchKeyEvent('keydown', 'KeyG');
    dispatchKeyEvent('keyup', 'KeyG');
    dispatchKeyEvent('keydown', 'KeyD');
    dispatchKeyEvent('keyup', 'KeyD');

    expect(handler).toHaveBeenCalledOnce();
    expect(onShortcutFired).toHaveBeenCalledOnce();
  });

  it('should not trigger a sequential shortcut if delay is exceeded', async () => {
    const handler = vi.fn();
    manager.register(['G', 'D'], handler, { sequential: true, sequenceDelay: 100 });

    dispatchKeyEvent('keydown', 'KeyG');
    dispatchKeyEvent('keyup', 'KeyG');

    // Wait for more than the delay
    await new Promise(r => setTimeout(r, 150));

    dispatchKeyEvent('keydown', 'KeyD');
    dispatchKeyEvent('keyup', 'KeyD');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle "hold" shortcuts, triggering on down and up', () => {
    const holdHandler = vi.fn();
    manager.register(['Shift', 'A'], holdHandler, { hold: true });

    // Press keys down
    dispatchKeyEvent('keydown', 'ShiftLeft');
    dispatchKeyEvent('keydown', 'KeyA');

    expect(holdHandler).toHaveBeenCalledOnce();
    expect(holdHandler).toHaveBeenCalledWith(expect.any(KeyboardEvent), 'down');
    expect(onShortcutFired).toHaveBeenCalledOnce();

    // Release one key
    dispatchKeyEvent('keyup', 'KeyA');

    expect(holdHandler).toHaveBeenCalledTimes(2);
    expect(holdHandler).toHaveBeenCalledWith(expect.any(KeyboardEvent), 'up');
  });

  it('should unregister a shortcut', () => {
    const handler = vi.fn();
    manager.register(['B'], handler);
    manager.unregister(['B']);

    dispatchKeyEvent('keydown', 'KeyB');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should respect scopes', () => {
    const globalHandler = vi.fn();
    const editorHandler = vi.fn();
    manager.register(['C'], globalHandler, { scope: 'global' });
    manager.register(['C'], editorHandler, { scope: 'editor' });

    // Set active scope to 'global' first
    manager.setActiveScope('global');
    dispatchKeyEvent('keydown', 'KeyC');

    // Assert that only the global handler was called
    expect(globalHandler).toHaveBeenCalledOnce();
    expect(editorHandler).not.toHaveBeenCalled();

    // Now, change scope to 'editor'
    manager.setActiveScope('editor');
    dispatchKeyEvent('keydown', 'KeyC');

    // Assert that the editor handler was called
    expect(editorHandler).toHaveBeenCalledOnce();
    // And, crucially, that the global handler was NOT called again
    expect(globalHandler).toHaveBeenCalledOnce();
  });

  it('should disable and enable a shortcut', () => {
    const handler = vi.fn();
    manager.register(['D'], handler);

    manager.disable(['D']);
    dispatchKeyEvent('keydown', 'KeyD');
    expect(handler).not.toHaveBeenCalled();

    manager.enable(['D']);
    dispatchKeyEvent('keydown', 'KeyD');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should trigger a shortcut on keyup when specified', () => {
    const handler = vi.fn();
    manager.register(['Ctrl', 'P'], handler, { triggerOn: 'keyup' });

    // Press keys down
    dispatchKeyEvent('keydown', 'ControlLeft');
    dispatchKeyEvent('keydown', 'KeyP');

    // Handler should not be called on keydown
    expect(handler).not.toHaveBeenCalled();

    // Release the final key
    dispatchKeyEvent('keyup', 'KeyP');

    // Handler should be called on keyup
    expect(handler).toHaveBeenCalledOnce();
    expect(onShortcutFired).toHaveBeenCalledOnce();
  });

  it('should trigger a shortcut on keydown and not on keyup', () => {
    const handler = vi.fn();
    // triggerOn: 'keydown' is the default, but we are explicit for clarity
    manager.register(['Ctrl', 'P'], handler, { triggerOn: 'keydown' });

    // Press keys down
    dispatchKeyEvent('keydown', 'ControlLeft');
    dispatchKeyEvent('keydown', 'KeyP');

    // Handler should be called on keydown
    expect(handler).toHaveBeenCalledOnce();
    expect(onShortcutFired).toHaveBeenCalledOnce();

    // Release the final key
    dispatchKeyEvent('keyup', 'KeyP');

    // Assert that the handler was NOT called a second time on keyup
    expect(handler).toHaveBeenCalledOnce();
    expect(onShortcutFired).toHaveBeenCalledOnce();
  });

  it('should not repeat by default', () => {
    const handler = vi.fn();
    manager.register(['A'], handler);

    dispatchKeyEvent('keydown', 'KeyA');
    dispatchKeyEvent('keydown', 'KeyA', true); // Repeat event

    expect(handler).toHaveBeenCalledOnce();
  });

  it('should repeat when specified', () => {
    const handler = vi.fn();
    manager.register(['A'], handler, { repeat: true });

    dispatchKeyEvent('keydown', 'KeyA');
    dispatchKeyEvent('keydown', 'KeyA');
    dispatchKeyEvent('keydown', 'KeyA');

    expect(handler).toHaveBeenCalledTimes(3);
  });

  describe('Scope Prioritization', () => {
    it('should allow setting, getting, and clearing numeric scope priority', () => {
      expect(manager.getScopePriority()).toBeNull();

      manager.setScopePriority('scope2', 20);
      manager.setScopePriority('scope1', 10);
      expect(manager.getScopePriority()).toEqual({ global: 0, scope2: 20, scope1: 10 });
      expect(manager.getScopePriority('scope2')).toBe(20);
      expect(manager.getSortedScopes()).toEqual(['scope2', 'scope1', 'global']);

      manager.setScopePriority('modal', 100);
      expect(manager.getSortedScopes()).toEqual(['modal', 'scope2', 'scope1', 'global']);

      manager.removeScopePriority('modal');
      expect(manager.getSortedScopes()).toEqual(['scope2', 'scope1', 'global']);

      manager.clearScopePriority();
      expect(manager.getScopePriority()).toBeNull();
    });

    it('should prioritize conflicting shortcuts in higher-priority scope while running uncommon shortcuts from all active scopes', () => {
      const scope1Copy = vi.fn();
      const scope1Select = vi.fn();
      const scope1Delete = vi.fn();

      const scope2Copy = vi.fn();
      const scope2Play = vi.fn();

      // Scope 1 has Ctrl+C, V, Del
      manager.register(['Ctrl', 'C'], scope1Copy, { scope: 'scope1' });
      manager.register(['V'], scope1Select, { scope: 'scope1' });
      manager.register(['Delete'], scope1Delete, { scope: 'scope1' });

      // Scope 2 has Ctrl+C, Space
      manager.register(['Ctrl', 'C'], scope2Copy, { scope: 'scope2' });
      manager.register(['Space'], scope2Play, { scope: 'scope2' });

      // Prioritize scope2 (100) over scope1 (50)
      manager.setScopePriority({ scope2: 100, scope1: 50 });

      // 1. Press conflicting Ctrl+C -> Scope 2 handler should run, Scope 1 handler should NOT
      dispatchKeyEvent('keydown', 'ControlLeft');
      dispatchKeyEvent('keydown', 'KeyC');
      expect(scope2Copy).toHaveBeenCalledOnce();
      expect(scope1Copy).not.toHaveBeenCalled();

      // Release keys
      dispatchKeyEvent('keyup', 'ControlLeft');
      dispatchKeyEvent('keyup', 'KeyC');

      // 2. Press uncommon V (only in Scope 1) -> Scope 1 handler should run
      dispatchKeyEvent('keydown', 'KeyV');
      expect(scope1Select).toHaveBeenCalledOnce();
      dispatchKeyEvent('keyup', 'KeyV');

      // 3. Press uncommon Space (only in Scope 2) -> Scope 2 handler should run
      dispatchKeyEvent('keydown', 'Space');
      expect(scope2Play).toHaveBeenCalledOnce();
      dispatchKeyEvent('keyup', 'Space');

      // 4. Press uncommon Delete (only in Scope 1) -> Scope 1 handler should run
      dispatchKeyEvent('keydown', 'Delete');
      expect(scope1Delete).toHaveBeenCalledOnce();
      dispatchKeyEvent('keyup', 'Delete');
    });

    it('should revert to single-scope isolation when priority is cleared', () => {
      const scope1Handler = vi.fn();
      const scope2Handler = vi.fn();

      manager.register(['A'], scope1Handler, { scope: 'scope1' });
      manager.register(['B'], scope2Handler, { scope: 'scope2' });

      // In single-scope mode with scope1 active
      manager.setActiveScope('scope1');
      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');

      dispatchKeyEvent('keydown', 'KeyB');
      dispatchKeyEvent('keyup', 'KeyB');

      expect(scope1Handler).toHaveBeenCalledOnce();
      expect(scope2Handler).not.toHaveBeenCalled();
    });

    it('should support numeric priority assignment, objects, and functional updaters with populated prev', () => {
      // Pushing scopes creates default internal priority based on stack position
      manager.pushScope('canvas');
      manager.pushScope('timeline');

      // Functional updater receives a populated prev object with default priorities: global: 0, canvas: 1, timeline: 2
      manager.setScopePriority(prev => {
        expect(prev).toEqual({ global: 0, canvas: 1, timeline: 2 });
        return { ...prev, modal: 100 };
      });

      expect(manager.getScopePriority()).toEqual({ global: 0, canvas: 1, timeline: 2, modal: 100 });
      expect(manager.getSortedScopes()).toEqual(['modal', 'timeline', 'canvas', 'global']);
    });

    it('should automatically prioritize scopes by internal stack order when cascade mode is simply enabled', () => {
      const canvasHandler = vi.fn();
      const timelineHandler = vi.fn();

      manager.register(['A'], canvasHandler, { scope: 'canvas' });
      manager.register(['A'], timelineHandler, { scope: 'timeline' });

      // Simply switch mode to cascade without manual priority assignment
      manager.setScopeMode('cascade');

      // timeline was pushed after canvas so timeline (2) > canvas (1) > global (0)
      expect(manager.getScopePriority()).toEqual({ global: 0, canvas: 1, timeline: 2 });
      expect(manager.getSortedScopes()).toEqual(['timeline', 'canvas', 'global']);

      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');

      expect(timelineHandler).toHaveBeenCalledOnce();
      expect(canvasHandler).not.toHaveBeenCalled();
    });

    it('should respect scopeMode default vs cascade with numeric priorities', () => {
      const scope1Handler = vi.fn();
      const scope2Handler = vi.fn();

      manager.register(['A'], scope1Handler, { scope: 'scope1' });
      manager.register(['A'], scope2Handler, { scope: 'scope2' });

      // Prioritize scope2 (100) > scope1 (10)
      manager.setScopePriority({ scope2: 100, scope1: 10 });
      expect(manager.getScopeMode()).toBe('cascade');

      // When mode is explicitly set to 'default', only active scope runs
      manager.setScopeMode('default');
      manager.setActiveScope('scope1');

      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');

      expect(scope1Handler).toHaveBeenCalledOnce();
      expect(scope2Handler).not.toHaveBeenCalled();

      // Switch back to cascade mode -> scope2 priority (100) runs
      manager.setScopeMode('cascade');
      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');

      expect(scope2Handler).toHaveBeenCalledOnce();
    });

    it('should correctly fire prioritized sequential shortcut with numeric priority (e.g. L -> G)', () => {
      const lgHandler = vi.fn();
      const defaultHandler = vi.fn();

      manager.register(['L', 'G'], lgHandler, {
        sequential: true,
        sequenceDelay: 3000,
        scope: 'lg',
      });

      manager.register(['L', 'G'], defaultHandler, {
        sequential: true,
        sequenceDelay: 3000,
      });

      // Give 'lg' higher numeric priority than default 'global' (0)
      manager.setScopePriority('lg', 100);

      // Type 'l' then 'g'
      dispatchKeyEvent('keydown', 'KeyL');
      dispatchKeyEvent('keyup', 'KeyL');
      dispatchKeyEvent('keydown', 'KeyG');
      dispatchKeyEvent('keyup', 'KeyG');

      expect(lgHandler).toHaveBeenCalledOnce();
      expect(defaultHandler).not.toHaveBeenCalled();
    });

    it('should not get stuck on sequential typos and allow immediate retry without waiting for delay', () => {
      const handler = vi.fn();
      manager.register(['L', 'G'], handler, {
        sequential: true,
        sequenceDelay: 5000,
      });

      // Type 'l' then typo 'x'
      dispatchKeyEvent('keydown', 'KeyL');
      dispatchKeyEvent('keyup', 'KeyL');
      dispatchKeyEvent('keydown', 'KeyX');
      dispatchKeyEvent('keyup', 'KeyX');
      expect(handler).not.toHaveBeenCalled();

      // Immediately type 'l' then 'g' (within delay window)
      dispatchKeyEvent('keydown', 'KeyL');
      dispatchKeyEvent('keyup', 'KeyL');
      dispatchKeyEvent('keydown', 'KeyG');
      dispatchKeyEvent('keyup', 'KeyG');

      expect(handler).toHaveBeenCalledOnce();
    });

    it('should restart sequence if start key is pressed consecutively (e.g. L -> L -> G)', () => {
      const handler = vi.fn();
      manager.register(['L', 'G'], handler, {
        sequential: true,
        sequenceDelay: 5000,
      });

      // Type 'l', then 'l' again, then 'g'
      dispatchKeyEvent('keydown', 'KeyL');
      dispatchKeyEvent('keyup', 'KeyL');
      dispatchKeyEvent('keydown', 'KeyL');
      dispatchKeyEvent('keyup', 'KeyL');
      dispatchKeyEvent('keydown', 'KeyG');
      dispatchKeyEvent('keyup', 'KeyG');

      expect(handler).toHaveBeenCalledOnce();
    });

    it('should clear stuck keys and sequences on window blur', () => {
      const handler = vi.fn();
      manager.register(['L', 'G'], handler, { sequential: true });

      // Start sequence
      dispatchKeyEvent('keydown', 'KeyL');
      dispatchKeyEvent('keyup', 'KeyL');

      // Window loses focus
      window.dispatchEvent(new Event('blur'));

      // Press 'g' -> sequence was cleared on blur, so should not fire
      dispatchKeyEvent('keydown', 'KeyG');
      dispatchKeyEvent('keyup', 'KeyG');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should cleanly remove numeric scope priority and restore default mode', () => {
      const globalHandler = vi.fn();
      const modalHandler = vi.fn();

      manager.register(['X'], globalHandler, { scope: 'global' });

      // Initially single-scope mode with 'global'
      expect(manager.getScopeMode()).toBe('default');
      expect(manager.getActiveScope()).toBe('global');

      dispatchKeyEvent('keydown', 'KeyX');
      dispatchKeyEvent('keyup', 'KeyX');
      expect(globalHandler).toHaveBeenCalledOnce();

      // Dynamic modal opens with 'dialog' and priority 100
      manager.register(['X'], modalHandler, { scope: 'dialog' });
      manager.setScopePriority('dialog', 100);
      expect(manager.getScopeMode()).toBe('cascade');
      expect(manager.getScopePriority('dialog')).toBe(100);

      dispatchKeyEvent('keydown', 'KeyX');
      dispatchKeyEvent('keyup', 'KeyX');
      expect(modalHandler).toHaveBeenCalledOnce();
      expect(globalHandler).toHaveBeenCalledOnce(); // Still 1

      // Dynamic modal closes
      manager.unregister(['X'], 'dialog');
      manager.removeScopePriority('dialog');
      manager.popScope('dialog');

      expect(manager.getScopeMode()).toBe('default');
      expect(manager.getScopePriority()).toBeNull();
      expect(manager.getActiveScope()).toBe('global');

      // Global shortcut MUST fire again
      dispatchKeyEvent('keydown', 'KeyX');
      dispatchKeyEvent('keyup', 'KeyX');
      expect(globalHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Input Target Handling', () => {
    it('should ignore shortcuts with ignoreInputs: true when target is an input or textarea', () => {
      const toolHandler = vi.fn();
      const escHandler = vi.fn();

      manager.register(['T'], toolHandler, { ignoreInputs: true });
      manager.register(['Esc'], escHandler, { enableInInput: true });

      const input = document.createElement('input');
      document.body.appendChild(input);

      // Typing 'T' inside input element should NOT trigger toolHandler
      dispatchKeyEvent('keydown', 'KeyT', false, input);
      dispatchKeyEvent('keyup', 'KeyT', false, input);
      expect(toolHandler).not.toHaveBeenCalled();

      // Pressing Escape inside input SHOULD trigger escHandler
      dispatchKeyEvent('keydown', 'Escape', false, input);
      dispatchKeyEvent('keyup', 'Escape', false, input);
      expect(escHandler).toHaveBeenCalledOnce();

      // Typing 'T' outside input SHOULD trigger toolHandler
      dispatchKeyEvent('keydown', 'KeyT');
      dispatchKeyEvent('keyup', 'KeyT');
      expect(toolHandler).toHaveBeenCalledOnce();

      document.body.removeChild(input);
    });

    it('should ignore all shortcuts in input when manager has ignoreInputs: true unless enableInInput is specified', () => {
      const customManager = new ShortcutManager({ ignoreInputs: true, silent: true });
      const deleteHandler = vi.fn();
      const saveHandler = vi.fn();

      customManager.register(['Delete'], deleteHandler);
      customManager.register(['Ctrl', 'S'], saveHandler, { enableInInput: true });

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      // Delete inside textarea should NOT fire deleteHandler
      const delEvent = new KeyboardEvent('keydown', { code: 'Delete', bubbles: true });
      textarea.dispatchEvent(delEvent);
      expect(deleteHandler).not.toHaveBeenCalled();

      // Ctrl+S inside textarea SHOULD fire saveHandler
      const ctrlEvent = new KeyboardEvent('keydown', { code: 'ControlLeft', bubbles: true });
      const sEvent = new KeyboardEvent('keydown', { code: 'KeyS', bubbles: true });
      textarea.dispatchEvent(ctrlEvent);
      textarea.dispatchEvent(sEvent);
      expect(saveHandler).toHaveBeenCalledOnce();

      document.body.removeChild(textarea);
      customManager.destroy();
    });
  });

  describe('beforeEach and afterEach Hooks', () => {
    it('should execute beforeEach and afterEach hooks in order', () => {
      const order: string[] = [];
      const handler = vi.fn(() => order.push('handler'));

      const unregisterBefore = manager.beforeEach((shortcut, event) => {
        expect(shortcut.keys).toEqual(['a']);
        expect(event).toBeInstanceOf(KeyboardEvent);
        order.push('before');
      });

      const unregisterAfter = manager.afterEach((shortcut, event) => {
        expect(shortcut.keys).toEqual(['a']);
        expect(event).toBeInstanceOf(KeyboardEvent);
        order.push('after');
      });

      manager.register(['A'], handler);

      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');

      expect(order).toEqual(['before', 'handler', 'after']);
      expect(handler).toHaveBeenCalledOnce();

      unregisterBefore();
      unregisterAfter();
    });

    it('should abort shortcut execution and skip afterEach when beforeEach returns false', () => {
      const handler = vi.fn();
      const afterHook = vi.fn();

      let allowExecution = false;
      manager.beforeEach(() => {
        if (!allowExecution) return false;
      });
      manager.afterEach(afterHook);

      manager.register(['A'], handler);

      // Blocked
      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');

      expect(handler).not.toHaveBeenCalled();
      expect(afterHook).not.toHaveBeenCalled();

      // Allowed
      allowExecution = true;
      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');

      expect(handler).toHaveBeenCalledOnce();
      expect(afterHook).toHaveBeenCalledOnce();
    });

    it('should filter hooks by scope and keys', () => {
      const globalOrder: string[] = [];
      const canvasOrder: string[] = [];

      const canvasHandler = vi.fn();
      const globalHandler = vi.fn();

      manager.register(['A'], canvasHandler, { scope: 'canvas' });
      manager.register(['B'], globalHandler, { scope: 'global' });

      // Scoped hook only for canvas
      manager.beforeEach(() => {
        canvasOrder.push('canvas-before');
      }, { scope: 'canvas' });

      // Key-filtered hook only for 'B'
      manager.beforeEach(() => {
        globalOrder.push('b-before');
      }, { keys: ['B'] });

      // Trigger 'B' (global)
      manager.setActiveScope('global');
      dispatchKeyEvent('keydown', 'KeyB');
      dispatchKeyEvent('keyup', 'KeyB');

      expect(globalOrder).toEqual(['b-before']);
      expect(canvasOrder).toEqual([]);

      // Switch to canvas scope & trigger 'A'
      manager.setActiveScope('canvas');
      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');

      expect(canvasOrder).toEqual(['canvas-before']);
    });

    it('should allow unregistering hooks', () => {
      const beforeHook = vi.fn();
      const unregister = manager.beforeEach(beforeHook);

      const handler = vi.fn();
      manager.register(['A'], handler);

      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');
      expect(beforeHook).toHaveBeenCalledOnce();

      unregister();

      dispatchKeyEvent('keydown', 'KeyA');
      dispatchKeyEvent('keyup', 'KeyA');
      expect(beforeHook).toHaveBeenCalledOnce(); // Still 1, not called again
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should preserve key order when filtering hooks on sequential shortcuts', () => {
      const gdBeforeHook = vi.fn();
      const dgBeforeHook = vi.fn();

      manager.beforeEach(gdBeforeHook, { keys: ['G', 'D'] });
      manager.beforeEach(dgBeforeHook, { keys: ['D', 'G'] });

      const gdHandler = vi.fn();
      manager.register(['G', 'D'], gdHandler, { sequential: true });

      // Trigger G then D sequence
      dispatchKeyEvent('keydown', 'KeyG');
      dispatchKeyEvent('keyup', 'KeyG');
      dispatchKeyEvent('keydown', 'KeyD');
      dispatchKeyEvent('keyup', 'KeyD');

      expect(gdHandler).toHaveBeenCalledOnce();
      expect(gdBeforeHook).toHaveBeenCalledOnce();
      expect(dgBeforeHook).not.toHaveBeenCalled();
    });
  });
});








