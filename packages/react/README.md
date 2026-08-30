# @keybindy/react

<p align="center">
  <strong>Modern, rock-solid React hooks and components for keyboard shortcuts.</strong><br />
  <em>Zero lifecycle blinking. Zero stale closures. 100% headless.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@keybindy/react"><img src="https://img.shields.io/npm/v/@keybindy/react.svg?style=flat&colorA=18181B&colorB=3B82F6" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@keybindy/react"><img src="https://img.shields.io/bundlephobia/minzip/@keybindy/react?style=flat&colorA=18181B&colorB=10B981" alt="minzipped size" /></a>
  <a href="https://github.com/keybindyjs/keybindy/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat&colorA=18181B&colorB=6366F1" alt="MIT License" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=flat&colorA=18181B&colorB=3178C6" alt="TypeScript" /></a>
</p>

---

Most React keyboard shortcut hooks fail in subtle, frustrating ways:
1. **The "Blinking" Problem**: Every state change re-renders the component, causing the hook to unregister and re-register the hotkey. Rapid typing or animations cause micro-gaps where shortcuts are dropped.
2. **Stale Closures**: Forgetting to update dependency arrays traps shortcuts with initial state values.
3. **Modal Leaks**: Closing a dialog forgets to re-enable background shortcuts or corrupts the active scope.

**`@keybindy/react`** completely eliminates these bugs with a **stable ref architecture**. Handlers always execute with the freshest state without ever re-registering the listener.

---

## Why `@keybindy/react`?

- ⚡️ **Zero Lifecycle Blinking** — Listeners register once on mount and unregister on unmount. No keystrokes are ever dropped during state updates.
- 🔄 **Always Fresh State** — Access your component's latest state and props inside callbacks without stale closures.
- 🎯 **Modal Isolation & Cascading Tools** — Effortlessly trap shortcuts in modals or cascade layered hotkeys.
- 🛡 **Hooks & Components** — Use `useShortcut`, `useShortcuts`, `useShortcutManager`, or `<Keybindy />` JSX.
- ⚡️ **SSR & Next.js App Router Ready** — Client-safe initialization that never crashes during server rendering.

---

## 📦 Installation

```bash
# npm
npm install @keybindy/react

# pnpm
pnpm add @keybindy/react

# bun
bun add @keybindy/react
```

---

## 🚀 Quick Start

### 1. The `useShortcut` Hook (Single Shortcut)

The cleanest, most ergonomic way to bind hotkeys in any functional component:

```tsx
import { useState } from 'react';
import { useShortcut } from '@keybindy/react';

function DocumentEditor() {
  const [content, setContent] = useState('');

  // ⚡️ Always accesses the latest `content` state without re-registering!
  useShortcut(['Ctrl', 'S'], (event) => {
    saveDocument(content);
  }, {
    preventDefault: true,
    ignoreInputs: true, // Won't trigger if user is typing in a textarea
  });

  // Cross-platform Command/Ctrl + K
  useShortcut([['Meta', 'K'], ['Ctrl', 'K']], () => {
    openSearchPalette();
  }, { preventDefault: true });

  return <textarea value={content} onChange={e => setContent(e.target.value)} />;
}
```

---

### 2. The `useShortcuts` Hook (Multiple Shortcuts)

Great for components with many hotkeys (e.g. video players, canvas apps, tables):

```tsx
import { useShortcuts } from '@keybindy/react';

function VideoPlayer({ isPlaying, onPlayPause, onSeekForward, onSeekBackward }) {
  useShortcuts([
    {
      keys: ['Space'],
      handler: onPlayPause,
      options: { preventDefault: true },
    },
    {
      keys: ['ArrowRight'],
      handler: () => onSeekForward(5),
      options: { preventDefault: true },
    },
    {
      keys: ['ArrowLeft'],
      handler: () => onSeekBackward(5),
      options: { preventDefault: true },
    },
    {
      // Push-to-talk / Hold action
      keys: ['M'],
      handler: (e, state) => setTemporaryMute(state === 'down'),
      options: { hold: true },
    },
  ], {
    scope: 'video-player',
  });

  return <div>{/* Player UI */}</div>;
}
```

---

### 3. The `<Keybindy />` Component (Declarative JSX)

If you prefer wrapping views declaratively, `<Keybindy />` provides the same rock-solid behavior in JSX:

```tsx
import { Keybindy } from '@keybindy/react';

function App() {
  return (
    <Keybindy
      scope="global"
      shortcuts={[
        {
          keys: ['Ctrl', 'S'],
          handler: () => console.log('Saved!'),
          options: { preventDefault: true },
        },
      ]}
    >
      <MainLayout />
    </Keybindy>
  );
}
```

---

## 🎯 Scoping: Modals vs. Layered Tools

### A. Modal Isolation (`default` mode)
When opening a modal or dialog, you want to **trap hotkeys** so background shortcuts cannot fire. When the modal unmounts, background shortcuts are automatically restored:

```tsx
function DeleteConfirmationModal({ isOpen, onClose, onDelete }) {
  // Opening this modal automatically deactivates global shortcuts
  useShortcuts([
    {
      keys: ['Enter'],
      handler: onDelete,
    },
    {
      keys: ['Esc'],
      handler: onClose,
      options: { enableInInput: true }, // Escape works even inside modal inputs
    },
  ], {
    scope: 'delete-dialog',
    disabled: !isOpen,
  });

  if (!isOpen) return null;
  return <div className="modal">Are you sure?</div>;
}
```

---

### B. Layered Tools with Priority (`cascade` mode)
In Figma / Photoshop style apps, global canvas shortcuts (like `Space` to pan or `Z` to zoom) should continue working while editing in a sub-tool, but sub-tool shortcuts should override colliding keys:

```tsx
// 1. Root Canvas (in cascade mode)
function CanvasApp() {
  return (
    <Keybindy scopeMode="cascade" scope="canvas" shortcuts={[
      { keys: ['Space'], handler: panCanvas, options: { hold: true } },
      { keys: ['V'], handler: selectTool },
    ]}>
      <Toolbox />
      <TextLayerEditor />
    </Keybindy>
  );
}

// 2. Focused Text Layer (higher priority weight)
function TextLayerEditor() {
  useShortcuts([
    {
      keys: ['V'], // Overrides global 'V' tool while text editor is focused
      handler: pastePlainText,
    }
  ], {
    scope: 'text-editor',
    priority: 100, // Higher priority wins colliding keys
  });
}

// 3. Isolated Modal inside a cascading app
function SettingsModal({ isOpen, onClose }) {
  // 💡 Want to trap shortcuts in a specific modal and block parent cascading?
  // Pass scopeMode="default" to isolate this child from parent shortcuts!
  useShortcuts([
    { keys: ['Esc'], handler: onClose, options: { enableInInput: true } }
  ], {
    scope: 'settings-modal',
    scopeMode: 'default', // Traps shortcuts: parent canvas keys won't fire
    disabled: !isOpen,
  });

  if (!isOpen) return null;
  return <div className="modal">Settings</div>;
}
```

> [!TIP]
> **Isolating a Child from Parent Cascading**: If your parent container is in `scopeMode="cascade"`, but you want a specific modal or dialog to **trap and block** all parent hotkeys, simply pass `scopeMode="default"` to that child `<Keybindy />` or `useShortcuts` / `useShortcut`. When the modal closes or unmounts, the parent's `cascade` mode is automatically restored.

---

## 🛡 Guard & Interceptor Hooks

Hook into shortcut lifecycles cleanly from any component:

```tsx
import { useBeforeShortcut, useAfterShortcut } from '@keybindy/react';

function GlobalHotkeysManager() {
  // 🛑 Guard: Block all shortcuts while an async mutation is pending
  useBeforeShortcut((shortcut, event) => {
    if (isSaving) {
      console.warn('Action blocked: Save in progress.');
      return false; // Returning false cancels the shortcut
    }
  });

  // 📊 Interceptor: Log analytics after shortcuts execute
  useAfterShortcut((shortcut, event) => {
    analytics.track('Shortcut Fired', { keys: shortcut.keys });
  });
}
```

---

## 🛠 Programmatic Manager: `useShortcutManager`

When you need direct programmatic control over scopes, priorities, or cheat sheets:

```tsx
import { useShortcutManager } from '@keybindy/react';

function ShortcutsHelpModal() {
  const { getCheatSheet, setScope, getActiveScope } = useShortcutManager();

  const allShortcuts = getCheatSheet();

  return (
    <dialog>
      <h2>Keyboard Shortcuts</h2>
      {allShortcuts.map((s, i) => (
        <div key={i}>
          <kbd>{s.keys.join(' + ')}</kbd>
          <span>{s.data?.description}</span>
        </div>
      ))}
    </dialog>
  );
}
```
*(Note: `useKeybindy` is retained as an exact alias to `useShortcutManager`)*.

---

## 📝 Input Handling

Prevent shortcuts from firing while users type in `<input>`, `<textarea>`, `<select>`, or `contenteditable` elements:

```tsx
// Ignore inputs by default for this shortcut
useShortcut(['D'], deleteItem, { ignoreInputs: true });

// Allow this shortcut even while typing in an input
useShortcut(['Esc'], clearSearch, { enableInInput: true });
```

---

## 📖 Hook Options Reference

### `useShortcut(keys, handler, options?)`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `scope` | `string` | `'global'` | Scope context for the shortcut. |
| `scopeMode` | `'default' \| 'cascade'` | `'default'` | Scope resolution behavior. |
| `priority` | `number` | `undefined` | Numeric priority weight for cascade mode (e.g. `100`). |
| `disabled` | `boolean` | `false` | Disable the shortcut without unmounting. |
| `preventDefault` | `boolean` | `false` | Calls `event.preventDefault()`. |
| `stopPropagation` | `boolean` | `false` | Calls `event.stopPropagation()`. |
| `sequential` | `boolean` | `false` | Treat keys as a sequence (e.g. `['G', 'D']`). |
| `sequenceDelay` | `number` | `1000` | Max milliseconds between sequential keys. |
| `hold` | `boolean` | `false` | Triggers handler with `state: 'down' \| 'up'`. |
| `repeat` | `boolean` | `false` | Allow continuous firing when holding key. |
| `ignoreInputs` | `boolean` | `false` | Ignore shortcut when typing in inputs/textareas. |
| `enableInInput` | `boolean` | `false` | Explicitly enable shortcut while typing in inputs. |
| `data` | `object` | `{}` | Custom metadata for cheat sheets. |

---

## 📄 License

MIT © [Keybindy Contributors](https://github.com/keybindyjs/keybindy)
