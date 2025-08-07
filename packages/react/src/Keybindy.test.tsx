import { render, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Keybindy } from './Keybindy';
import { useKeybindy } from './useKeybindy';

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
};

vi.mock('@keybindy/core', () => ({
  default: vi.fn(() => mockManagerInstance),
}));

describe('<Keybindy /> Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register shortcuts on mount', async () => {
    const shortcuts = [
      { keys: ['Ctrl', 'S'], handler: vi.fn() },
      { keys: ['A'], handler: vi.fn() },
    ];
    render(<Keybindy shortcuts={shortcuts} scope="editor" />);

    await waitFor(() => {
      expect(mockManagerInstance.register).toHaveBeenCalledTimes(2);
      expect(mockManagerInstance.register).toHaveBeenCalledWith(
        ['Ctrl', 'S'],
        expect.any(Function),
        { scope: 'editor' }
      );
      expect(mockManagerInstance.register).toHaveBeenCalledWith(['A'], expect.any(Function), {
        scope: 'editor',
      });
    });
  });

  it('should unregister shortcuts on unmount', async () => {
    const shortcuts = [{ keys: ['Ctrl', 'S'], handler: vi.fn() }];
    const { unmount } = render(<Keybindy shortcuts={shortcuts} scope="editor" />);

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

  it('should disable all shortcuts when disabled prop is true', async () => {
    render(<Keybindy scope="test" disabled />);
    await waitFor(() => {
      expect(mockManagerInstance.disableAll).toHaveBeenCalledWith('test');
    });
  });
});

describe('useKeybindy Hook', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the mocked manager instance on the client', async () => {
    const { result } = renderHook(() => useKeybindy());

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
});
