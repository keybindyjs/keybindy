# Keybindy

<p align="center">
  <strong>The lightweight, framework-agnostic keyboard shortcut engine for modern web apps.</strong><br />
  <em>Fast, tiny, type-safe, and zero dependencies.</em>
</p>

<p align="center">
  <a href="https://github.com/keybindyjs/keybindy/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat&colorA=18181B&colorB=6366F1" alt="MIT License" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=flat&colorA=18181B&colorB=3178C6" alt="TypeScript" /></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-monorepo-orange?style=flat&colorA=18181B&colorB=F69220" alt="pnpm" /></a>
</p>

---

## 🎯 About Keybindy

Handling keyboard shortcuts in modern web applications shouldn't require messy event listeners, broken modal state, or bulky dependencies.

**Keybindy** is a centralized, high-performance keyboard shortcut engine (~2KB gzipped) designed to handle everything from simple hotkeys to complex Figma/Vim-style layered tools with ease:

- **Simultaneous, Hold, & Sequential Chains**: Support for chords (`Ctrl+Shift+P`), holdable push-to-talk keys, and Vim sequences (`G` then `D`).
- **Modal Isolation & Cascading Tools**: Strict scope isolation (`default` mode) or layered priority overrides (`cascade` mode).
- **Smart Input Detection**: Automatically ignores keystrokes when typing in inputs, textareas, and contenteditables (with per-shortcut overrides).
- **Lifecycle Safety in React**: Stable ref architecture that completely eliminates hook "blinking" and stale closures.
- **Zero Dependencies & 100% Type-Safe**: Written in TypeScript with rich autocomplete.

---

## 📦 Packages

| Package | Version | Description | Docs |
| :--- | :--- | :--- | :--- |
| [`@keybindy/core`](./packages/core) | [![npm version](https://img.shields.io/npm/v/@keybindy/core.svg?style=flat&colorA=18181B&colorB=3B82F6)](https://www.npmjs.com/package/@keybindy/core) | Core framework-agnostic shortcut engine. | [Core Docs](./packages/core/README.md) |
| [`@keybindy/react`](./packages/react) | [![npm version](https://img.shields.io/npm/v/@keybindy/react.svg?style=flat&colorA=18181B&colorB=3B82F6)](https://www.npmjs.com/package/@keybindy/react) | Modern React hooks & components (`useShortcut`, `useShortcuts`, `<Keybindy />`). | [React Docs](./packages/react/README.md) |

---

## 🚀 Quick Look

### Vanilla JS / Framework-Agnostic (`@keybindy/core`)

```ts
import ShortcutManager from '@keybindy/core';

const shortcuts = new ShortcutManager({ ignoreInputs: true });

// Register shortcut
shortcuts.register(['Ctrl', 'S'], () => {
  saveDocument();
}, { preventDefault: true });

// Sequential Vim-style shortcut (G then D)
shortcuts.register(['G', 'D'], () => {
  navigateToDashboard();
}, { sequential: true });
```

### React (`@keybindy/react`)

```tsx
import { useShortcut, useShortcuts } from '@keybindy/react';

function Canvas() {
  const [scale, setScale] = useState(1);

  // ⚡️ Always accesses latest state with ZERO re-registration flickering
  useShortcut(['Ctrl', '+'], () => setScale(s => s + 0.1), {
    preventDefault: true,
  });

  useShortcuts([
    { keys: ['Space'], handler: (e, state) => setPanning(state === 'down'), options: { hold: true } },
    { keys: ['Esc'], handler: deselectAll, options: { enableInInput: true } },
  ]);
}
```

---

## 🛠 Local Development & Testing

```bash
# 1. Clone repo
git clone https://github.com/keybindyjs/keybindy.git
cd keybindy

# 2. Install dependencies
pnpm install

# 3. Run all unit tests
pnpm test

# 4. Build packages
pnpm build
```

---

## 📄 License

MIT © [Keybindy Contributors](https://github.com/keybindyjs/keybindy)
