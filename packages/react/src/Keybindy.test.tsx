import { render, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Keybindy } from './Keybindy';
import { useKeybindy, useShortcutManager } from './useKeybindy';
import { useShortcut, useShortcuts } from './useShortcuts';

// Mock the core ShortcutManager to spy on its methods
const mockManagerInstance = {
  register: vi.fn(),
  unregister: vi.fn(),
  enableAll: vi.fn(),
  disableAll: vi.fn(),
  setActiveScope: vi.fn(),
  getActiveScope: vi.fn(() => 'global'),
  pushScope: vi.fn(),
  popScope: vi.fn(),
  getScopes: vi.fn(() => ['global', 'editor', 'modal']),
  pushScopePriority: vi.fn(),
  removeScopePriority: vi.fn(),
  setScopePriority: vi.fn(),
  getScopePriority: vi.fn(),
  clearScopePriority: vi.fn(),
  setScopeMode: vi.fn(),
  getScopeMode: vi.fn(() => 'default'),
  beforeEach: vi.fn(() => vi.fn()),
  afterEach: vi.fn(() => vi.fn()),
};

vi.mock('@keybindy/core', () => ({
  default: vi.fn(() => mockManagerInstance),
  ShortcutManager: vi.fn(() => mockManagerInstance),
}));

describe('<Keybindy /> Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register shortcuts on mount', async () => {
    render(
      <Keybindy
        shortcuts={[
          { keys: ['Ctrl', 'S'], handler: () => {} },
          { keys: ['A'], handler: () => {} },
        ]}
        scope="editor"
      />
    );

    await waitFor(() => {
      expect(mockManagerInstance.register).toHaveBeenCalledTimes(2);
      expect(mockManagerInstance.register).toHaveBeenCalledWith(
        ['Ctrl', 'S'],
        expect.any(Function),
        { scope: 'editor', ignoreInputs: undefined }
      );
      expect(mockManagerInstance.register).toHaveBeenCalledWith(['A'], expect.any(Function), {
        scope: 'editor',
        ignoreInputs: undefined,
      });
    });
  });

  it('should register and clean up beforeEach and afterEach on <Keybindy />', async () => {
    const unregisterBefore = vi.fn();
    const unregisterAfter = vi.fn();
    mockManagerInstance.beforeEach.mockReturnValueOnce(unregisterBefore);
    mockManagerInstance.afterEach.mockReturnValueOnce(unregisterAfter);

    const beforeFn = vi.fn();
    const afterFn = vi.fn();

    const { unmount } = render(
      <Keybindy scope="canvas" beforeEach={beforeFn} afterEach={afterFn} />
    );

    await waitFor(() => {
      expect(mockManagerInstance.beforeEach).toHaveBeenCalledWith(expect.any(Function), { scope: 'canvas' });
      expect(mockManagerInstance.afterEach).toHaveBeenCalledWith(expect.any(Function), { scope: 'canvas' });
    });

    unmount();

    expect(unregisterBefore).toHaveBeenCalledOnce();
    expect(unregisterAfter).toHaveBeenCalledOnce();
  });

  it('should unregister shortcuts on unmount', async () => {
    const { unmount } = render(
      <Keybindy shortcuts={[{ keys: ['Ctrl', 'S'], handler: () => {} }]} scope="editor" />
    );

    await waitFor(() => {
      expect(mockManagerInstance.register).toHaveBeenCalled();
    });

    vi.clearAllMocks(); // Isolate the unmount action

    unmount();

    expect(mockManagerInstance.unregister).toHaveBeenCalledOnce();
    expect(mockManagerInstance.unregister).toHaveBeenCalledWith(['Ctrl', 'S'], 'editor');
  });

  it('should set and manage scope correctly', async () => {
    const { unmount } = render(<Keybindy scope="modal" />);

    await waitFor(() => {
      expect(mockManagerInstance.setActiveScope).toHaveBeenCalledWith('modal');
    });

    unmount();

    expect(mockManagerInstance.popScope).toHaveBeenCalledOnce();
  });

  it('should handle priority prop by setting and removing numeric scope priority', async () => {
    const { unmount } = render(<Keybindy scope="timeline" priority={100} />);

    await waitFor(() => {
      expect(mockManagerInstance.setScopePriority).toHaveBeenCalledWith('timeline', 100);
    });

    unmount();

    expect(mockManagerInstance.removeScopePriority).toHaveBeenCalledWith('timeline');
    expect(mockManagerInstance.popScope).toHaveBeenCalledWith('timeline');
  });

  it('should set scopeMode on mount and restore previous mode on unmount', async () => {
    mockManagerInstance.getScopeMode.mockReturnValueOnce('default');
    const { unmount } = render(<Keybindy scopeMode="cascade" />);

    await waitFor(() => {
      expect(mockManagerInstance.setScopeMode).toHaveBeenCalledWith('cascade');
    });

    unmount();

    expect(mockManagerInstance.setScopeMode).toHaveBeenCalledWith('default');
  });

  it('should disable all shortcuts when disabled prop is true', async () => {
    render(<Keybindy scope="test" disabled />);
    await waitFor(() => {
      expect(mockManagerInstance.disableAll).toHaveBeenCalledWith('test');
    });
  });

  it('should handle shortcuts as a function', async () => {
    render(
      <Keybindy shortcuts={() => [{ keys: ['Ctrl', 'K'], handler: () => {} }]} scope="editor" />
    );

    await waitFor(() => {
      expect(mockManagerInstance.register).toHaveBeenCalledTimes(1);
      expect(mockManagerInstance.register).toHaveBeenCalledWith(
        ['Ctrl', 'K'],
        expect.any(Function),
        { scope: 'editor', ignoreInputs: undefined }
      );
    });
  });
});

describe('useShortcut and useShortcuts Hooks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('useShortcut should register single shortcut and clean up on unmount', async () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useShortcut(['Ctrl', 'S'], handler, { scope: 'editor', preventDefault: true })
    );

    await waitFor(() => {
      expect(mockManagerInstance.register).toHaveBeenCalledWith(
        ['Ctrl', 'S'],
        expect.any(Function),
        { scope: 'editor', preventDefault: true, ignoreInputs: undefined }
      );
    });

    unmount();
    expect(mockManagerInstance.unregister).toHaveBeenCalledWith(['Ctrl', 'S'], 'editor');
  });

  it('useShortcuts should register array of shortcuts and clean up on unmount', async () => {
    const { unmount } = renderHook(() =>
      useShortcuts([
        { keys: ['Esc'], handler: () => {} },
        { keys: ['Enter'], handler: () => {} },
      ], { scope: 'modal' })
    );

    await waitFor(() => {
      expect(mockManagerInstance.register).toHaveBeenCalledTimes(2);
      expect(mockManagerInstance.register).toHaveBeenCalledWith(
        ['Esc'],
        expect.any(Function),
        { scope: 'modal', ignoreInputs: undefined }
      );
    });

    unmount();
    expect(mockManagerInstance.unregister).toHaveBeenCalledWith(['Esc'], 'modal');
    expect(mockManagerInstance.unregister).toHaveBeenCalledWith(['Enter'], 'modal');
  });
});

describe('useShortcutManager and useKeybindy Hook', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the mocked manager instance on the client', async () => {
    const { result } = renderHook(() => useShortcutManager());

    await waitFor(() => {
      expect(result.current.manager).not.toBeNull();
    });

    expect(result.current.manager).toBe(mockManagerInstance);
  });

  it('should call register and unregister on the manager instance', async () => {
    const { result } = renderHook(() => useKeybindy());
    const handler = vi.fn();

    await waitFor(() => {
      expect(result.current.manager).not.toBeNull();
    });

    result.current.register(['A'], handler, { scope: 'test' });
    expect(mockManagerInstance.register).toHaveBeenCalledWith(['A'], handler, { scope: 'test' });

    result.current.unregister(['A'], 'test');
    expect(mockManagerInstance.unregister).toHaveBeenCalledWith(['A'], 'test');
  });

  it('should expose beforeEach and afterEach in useShortcutManager', async () => {
    const { result } = renderHook(() => useShortcutManager());
    const beforeFn = vi.fn();
    const afterFn = vi.fn();

    await waitFor(() => {
      expect(result.current.manager).not.toBeNull();
    });

    result.current.beforeEach(beforeFn, { scope: 'canvas' });
    expect(mockManagerInstance.beforeEach).toHaveBeenCalledWith(beforeFn, { scope: 'canvas' });

    result.current.afterEach(afterFn, { scope: 'canvas' });
    expect(mockManagerInstance.afterEach).toHaveBeenCalledWith(afterFn, { scope: 'canvas' });
  });
});


