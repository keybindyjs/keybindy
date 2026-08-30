# @keybindy/core

<p align="center">
  <strong>The lightweight, framework-agnostic keyboard shortcut engine for modern web apps.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@keybindy/core"><img src="https://img.shields.io/npm/v/@keybindy/core.svg?style=flat&colorA=18181B&colorB=3B82F6" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@keybindy/core"><img src="https://img.shields.io/bundlephobia/minzip/@keybindy/core?style=flat&colorA=18181B&colorB=10B981" alt="minzipped size" /></a>
  <a href="https://github.com/keybindyjs/keybindy/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat&colorA=18181B&colorB=6366F1" alt="MIT License" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=flat&colorA=18181B&colorB=3178C6" alt="TypeScript" /></a>
</p>

---

Handling keyboard shortcuts in complex web applications starts simple, but quickly turns chaotic:
- You open a modal and global shortcuts trigger in the background.
- You type in a search input and hotkeys fire unintentionally.
- Conflicting tools (like Canvas vs. Layer panel) fight over the same keys.
- Modifier keys on Mac vs. Windows require messy conditional code.

**Keybindy** is built from the ground up to solve this with a clean, centralized, and delightful API. It weighs **~2KB**, has **zero dependencies**, and works anywhere JavaScript runs — Vanilla JS, React, Vue, Svelte, or Solid.

---

## ✨ Features

- **⚡️ Zero Dependencies & Ultra-Lightweight** — Tiny footprint (~2KB gzipped).
- **🎹 3 Shortcut Models** — Simultaneous chords (`Ctrl+S`), Vim-style sequences (`G` then `D`), and Hold actions (push-to-talk).
- **🎯 Smart Scoping & Layering** — Seamlessly isolate modals or cascade shortcuts across complex layered tools.
- **⚖️ Priority Resolution** — Layer child tools over parent canvases with numeric priority weights.
- **🛡 Guard & Interceptor Hooks** — Run global or scoped `beforeEach` and `afterEach` middlewares.
- **📝 Smart Input Detection** — Automatically ignores typing inside inputs, textareas, and contenteditable elements (with easy per-shortcut overrides).
- **🍎 Forgiving Cross-Platform Aliases** — Write `Cmd`, `Command`, `Option`, `Alt`, `Esc`, or `Escape` — Keybindy normalizes them automatically.
- **🔒 100% TypeScript** — Strict type safety and rich IDE autocomplete.

---

## 📦 Installation

```bash
# npm
npm install @keybindy/core

# pnpm
pnpm add @keybindy/core

# bun
bun add @keybindy/core
```

---

## 🚀 Quick Start

```ts
import ShortcutManager from '@keybindy/core';

// 1. Initialize
const shortcuts = new ShortcutManager({
  ignoreInputs: true, // Automatically ignore hotkeys when typing in inputs/textareas
});

// 2. Register standard shortcuts
shortcuts.register(['Ctrl', 'S'], (event) => {
  console.log('Saved document!');
}, { preventDefault: true });

// 3. Multi-platform bindings (Cmd on Mac, Ctrl on Windows)
shortcuts.register([['Meta', 'K'], ['Ctrl', 'K']], () => {
  console.log('Search palette opened!');
}, { preventDefault: true });
```

---

## 💡 Shortcut Types

### 1. Simultaneous Chords
Fires when all specified keys are pressed down together:

```ts
shortcuts.register(['Ctrl', 'Shift', 'P'], () => {
  openCommandPalette();
}, { preventDefault: true });
```

### 2. Sequential Chains (Vim / GitHub style)
Fires when keys are pressed in sequence within a configurable timeout window:

```ts
// Press 'G' then 'D' to Go to Dashboard
shortcuts.register(['G', 'D'], () => {
  navigateTo('/dashboard');
}, {
  sequential: true,
  sequenceDelay: 800, // max ms between keystrokes (default: 1000)
});
```

### 3. Holdable Actions (Push-to-Talk / Pan Tool)
Fires both on `down` and `up`, allowing continuous actions while held:

```ts
shortcuts.register(['Space'], (event, state) => {
  if (state === 'down') {
    enableCanvasPanning();
  } else {
    disableCanvasPanning();
  }
}, { hold: true });
```

---

## 🎯 Scopes & Layering (`default` vs `cascade`)

Keybindy provides two distinct scoping modes to suit any application UI:

### A. `default` Mode — Strict Isolation (e.g. Modals & Dialogs)
In `default` mode, only the single topmost active scope is enabled. All other scopes (like `global`) are completely deactivated while the modal is open.

```ts
// 1. Register global shortcut
shortcuts.register(['Delete'], deleteSelectedCard, { scope: 'global' });

// 2. Register modal shortcut
shortcuts.register(['Esc'], closeModal, { scope: 'modal', enableInInput: true });

// 3. Open Modal
shortcuts.setActiveScope('modal');
// -> 'Delete' is now blocked so background elements cannot be deleted!

// 4. Close Modal
shortcuts.popScope('modal');
// -> 'global' is restored automatically!
```

### B. `cascade` Mode — Layered Tools & Priority (e.g. Figma / Photoshop)
In `cascade` mode, all active scopes work together. Non-conflicting parent shortcuts pass through, while colliding keys are resolved by **numeric priority weights** or stack order.

```ts
const shortcuts = new ShortcutManager({ scopeMode: 'cascade' });

// Global shortcut
shortcuts.register(['Space'], panCanvas, { scope: 'global' });
shortcuts.register(['V'], selectTool, { scope: 'global' });

// Text Tool Scope (higher priority)
shortcuts.register(['V'], pasteFormattedText, { scope: 'text-editor' });
shortcuts.setScopePriority('text-editor', 100);

// When 'text-editor' is active:
// - 'Space' still pans the canvas (passes through)
// - 'V' triggers pasteFormattedText (overrides global 'V' because 100 > 0)
```

> [!TIP]
> **Isolating a Child / Modal in Cascading Mode**: If your app runs in `cascade` mode, but you want a specific modal or dialog to **trap and block** all parent hotkeys, switch to `'default'` mode while the modal is open:
> ```ts
> // Open isolated modal
> shortcuts.setScopeMode('default');
> shortcuts.setActiveScope('modal');
>
> // Close modal & restore cascade
> shortcuts.popScope('modal');
> shortcuts.setScopeMode('cascade');
> ```

---

## 🛡 Guard & Interceptor Hooks (`beforeEach` / `afterEach`)

Add global or scoped middlewares before or after shortcuts execute:

```ts
// 🛑 Guard: Block all shortcuts when an async modal is loading
const unregisterGuard = shortcuts.beforeEach((shortcut, event) => {
  if (isAppBusy) {
    console.warn('Action blocked: App is busy.');
    return false; // Returning false cancels the shortcut execution
  }
});

// 📊 Interceptor: Log analytics after every shortcut in the 'canvas' scope
shortcuts.afterEach((shortcut, event) => {
  analytics.track('Shortcut Triggered', { keys: shortcut.keys });
}, { scope: 'canvas' });
```

---

## 📝 Input & Editable Target Handling

By default, shortcuts won't trigger while the user is typing inside `<input>`, `<textarea>`, `<select>`, or `[contenteditable="true"]` elements when `ignoreInputs: true` is enabled.

You can customize this globally or per shortcut:

```ts
// Global setting
const shortcuts = new ShortcutManager({ ignoreInputs: true });

// Override per-shortcut: Allow Escape to close dialogs even while focusing an input
shortcuts.register(['Esc'], closeDialog, {
  enableInInput: true,
});
```

---

## 📖 API Reference

### `ShortcutManager` Options

```ts
const manager = new ShortcutManager({
  ignoreInputs?: boolean;             // Default: false
  scopeMode?: 'default' | 'cascade';  // Default: 'default'
  silent?: boolean;                   // Default: true (suppress debug logs)
  onShortcutFired?: (info) => void;   // Event telemetry callback
});
```

### Registration Options (`ShortcutOptions`)

```ts
manager.register(keys, handler, {
  scope?: string;             // Scope identifier (default: 'global')
  preventDefault?: boolean;   // Calls event.preventDefault()
  stopPropagation?: boolean;  // Calls event.stopPropagation()
  sequential?: boolean;       // Treat as sequential chain (e.g. G then D)
  sequenceDelay?: number;     // Milliseconds allowed between sequential keys
  hold?: boolean;             // Fires with 'down' and 'up' state
  repeat?: boolean;           // Allow continuous firing when holding key down
  enableInInput?: boolean;    // Allow shortcut while typing in inputs
  ignoreInputs?: boolean;     // Explicitly ignore shortcut in inputs
  data?: Record<string, any>; // Custom metadata (labels, descriptions for cheat sheets)
});
```

### Scope & Lifecycle Methods

| Method | Description |
| :--- | :--- |
| `setActiveScope(scope)` | Sets the current active scope. |
| `pushScope(scope)` | Pushes a scope onto the stack. |
| `popScope(scope?)` | Pops the topmost scope or removes a specific target scope. |
| `setScopeMode('default' \| 'cascade')` | Switches between strict isolation and layered cascading. |
| `setScopePriority(scope, priority)` | Sets a numeric weight (e.g. `100`) for cascade mode. |
| `removeScopePriority(scope)` | Clears a scope's custom priority weight. |
| `beforeEach(hook, options?)` | Registers a guard callback. Return `false` to abort. |
| `afterEach(hook, options?)` | Registers an interceptor callback after execution. |
| `enableAll(scope?)` / `disableAll(scope?)` | Enables or disables shortcuts globally or by scope. |
| `getCheatSheet(scope?)` | Returns all registered shortcuts and custom `data` metadata. |
| `destroy()` | Cleans up all listeners and memory. |

---

## 📄 License

MIT © [Keybindy Contributors](https://github.com/keybindyjs/keybindy)
