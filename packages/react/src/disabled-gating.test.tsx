import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useShortcut, useShortcuts } from './useShortcuts';

const dispatchKeydown = (code: string) => {
  fireEvent.keyDown(window, { code, key: code, bubbles: true });
};

describe('disabled gating for parallel instances', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes Enter to the open instance instead of the last-mounted one', async () => {
    const calls: Array<[string, number]> = [];
    const record = (label: string, size: number) => calls.push([label, size]);

    function Picker({ isOpen, label }: { isOpen: boolean; label: string }) {
      const [selected, setSelected] = React.useState<Map<string, string>>(new Map());

      useShortcuts([{ keys: ['Enter'], handler: () => record(label, selected.size) }], {
        disabled: !isOpen,
      });

      if (!isOpen) return null;
      return (
        <button data-label={label} onClick={() => setSelected(p => new Map(p).set('a', 'a'))}>
          add-{label}
        </button>
      );
    }

    const { getByText } = render(
      <>
        <Picker isOpen label="basic-info" />
        <Picker isOpen={false} label="variant" />
        <Picker isOpen={false} label="group" />
        <Picker isOpen={false} label="seo" />
      </>
    );

    fireEvent.click(getByText('add-basic-info'));
    await act(async () => {});
    dispatchKeydown('Enter');

    expect(calls).toEqual([['basic-info', 1]]);
  });

  it('does not register anything while disabled', async () => {
    const handler = vi.fn();

    function Picker({ isOpen }: { isOpen: boolean }) {
      useShortcuts([{ keys: ['Enter'], handler }], { disabled: !isOpen });
      return null;
    }

    render(
      <>
        <Picker isOpen={false} />
        <Picker isOpen={false} />
      </>
    );

    dispatchKeydown('Enter');
    expect(handler).not.toHaveBeenCalled();
  });

  it('fires the handler with fresh state after reopening', async () => {
    const calls: Array<[string, number]> = [];

    function Picker({ isOpen, label }: { isOpen: boolean; label: string }) {
      const [count, setCount] = React.useState(0);

      useShortcuts([{ keys: ['Enter'], handler: () => calls.push([label, count]) }], {
        disabled: !isOpen,
      });

      if (!isOpen) return null;
      return <button onClick={() => setCount(c => c + 1)}>inc-{label}</button>;
    }

    const { getByText, rerender } = render(<Picker isOpen={false} label="a" />);

    rerender(<Picker isOpen label="a" />);
    fireEvent.click(getByText('inc-a'));
    fireEvent.click(getByText('inc-a'));
    await act(async () => {});
    dispatchKeydown('Enter');
    expect(calls).toEqual([['a', 2]]);

    rerender(<Picker isOpen={false} label="a" />);
    await act(async () => {});
    dispatchKeydown('Enter');
    expect(calls).toEqual([['a', 2]]);

    rerender(<Picker isOpen label="a" />);
    await act(async () => {});
    dispatchKeydown('Enter');
    expect(calls).toEqual([
      ['a', 2],
      ['a', 2],
    ]);
  });

  it('useShortcut supports disabled gating too', async () => {
    const calls: string[] = [];

    function Picker({ isOpen, label }: { isOpen: boolean; label: string }) {
      useShortcut(['Enter'], () => calls.push(label), { disabled: !isOpen });
      return null;
    }

    render(
      <>
        <Picker isOpen label="open" />
        <Picker isOpen={false} label="closed" />
      </>
    );

    dispatchKeydown('Enter');
    expect(calls).toEqual(['open']);
  });

  it('warns once about duplicate registrations and suggests disabled', async () => {
    function Picker() {
      useShortcuts([{ keys: ['Enter'], handler: () => {} }]);
      return null;
    }

    render(
      <>
        <Picker />
        <Picker />
        <Picker />
      </>
    );

    const warnSpy = console.warn as unknown as ReturnType<typeof vi.fn>;
    const keybindyWarnings = warnSpy.mock.calls.filter(([msg]) =>
      String(msg).includes('Duplicate shortcut detected')
    );

    expect(keybindyWarnings).toHaveLength(1);
    expect(String(keybindyWarnings[0][0])).toContain('Enter');
    expect(String(keybindyWarnings[0][0])).toContain('disabled: !isOpen');
  });

  it('warns again after all colliding registrations unmount', async () => {
    function Picker({ id }: { id: string }) {
      useShortcuts([{ keys: ['KeyQ'], handler: () => {} }]);
      return <span>{id}</span>;
    }

    const { rerender } = render(
      <>
        <Picker id="one" />
        <Picker id="two" />
      </>
    );

    const warnSpy = console.warn as unknown as ReturnType<typeof vi.fn>;
    expect(
      warnSpy.mock.calls.filter(([m]) => String(m).includes('Duplicate shortcut detected')).length
    ).toBe(1);

    rerender(<span>empty</span>);
    await act(async () => {});

    render(
      <>
        <Picker id="three" />
        <Picker id="four" />
      </>
    );

    expect(
      warnSpy.mock.calls.filter(([m]) => String(m).includes('Duplicate shortcut detected')).length
    ).toBe(2);
  });
});
