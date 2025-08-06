import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShortcutManager } from './ShortcutManager';

// Helper to dispatch keyboard events
const dispatchKeyEvent = (type: 'keydown' | 'keyup', code: string, repeat = false) => {
  const event = new KeyboardEvent(type, {
    code,
    bubbles: true,
    ...(type === 'keydown' && { repeat }),
  });
  window.dispatchEvent(event);
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
});
