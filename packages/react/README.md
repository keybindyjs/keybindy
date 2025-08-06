# @keybindy/react

`@keybindy/react` is the official React integration for the [Keybindy](https://www.npmjs.com/package/@keybindy/core) keyboard shortcut system. Built on top of `@keybindy/core`, this package brings powerful and scoped keyboard bindings to your React applications — with components and hooks tailored to React’s architecture.

[![npm version](https://badge.fury.io/js/@keybindy%2Freact.svg)](https://www.npmjs.com/package/@keybindy/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🧠 What is @keybindy/react?

While `@keybindy/core` gives you the underlying logic to register and manage shortcuts in any JavaScript environment, **@keybindy/react** wraps it in a React-friendly API with scoped context, declarative components, and hooks for full control.

---

## Installation

```bash
# npm
npm install @keybindy/react

# yarn
yarn add @keybindy/react

# bun
bun add @keybindy/react
```

---

## Usage

#### `<Keybindy />` component

The core declarative component. Register all your scoped or global shortcuts with ease.

| Prop              | Type                 | Default     | Description                                                    |
| ----------------- | -------------------- | ----------- | -------------------------------------------------------------- |
| `logs`            | `boolean`            | `false`     | Whether to enable debug logs in the console.                   |
| `onShortcutFired` | `fn(info: Shortcut)` | `undefined` | Optional callback to handle shortcut firing events.            |
| `disabled`        | `boolean`            | `false`     | Whether to disable all shortcuts within the component's scope. |
| `scope`           | `string`             | `global`    | The scope to apply the shortcuts to.                           |
| `shortcuts`       | `Shortcut[]`         | `[]`        | Array of shortcut objects to register.                         |
| `children`        | `React.ReactNode`    | `undefined` | The content to render inside the component.                    |

##### Example

```ts
import { Keybindy } from '@keybindy/react';

<Keybindy
  scope="global"
  shortcuts={[
    {
      keys: ['A'],
      handler: () => console.log('A pressed'),
      options: {
        preventDefault: true,
      },
    },
    {
      keys: ['O', 'P'],
      handler: () => setIsOpen(true),
      options: {
        sequenceDelay: 1000,
        sequential: true,
        preventDefault: true,
      },
    },
    {
      keys: ['R'],
      handler: () => window.open('https://react.dev', '_blank'),
      options: {
        preventDefault: true,
      },
    },
  ]}
/>;
```

#### `<ShortcutLabel />` component

A lightweight UI component to render visually styled shortcut hints.

| Prop        | Type                                           | Default     | Description                                    |
| ----------- | ---------------------------------------------- | ----------- | ---------------------------------------------- |
| `keys`      | `Keys`                                         | `[]`        | The key combination(s) to display.             |
| `renderKey` | `fn(key: string, index: number, keys: Keys[])` | `undefined` | Custom renderer for each key badge or segment. |

##### Example

```ts
import { ShortcutLabel } from '@keybindy/react';

<ShortcutLabel
  keys={['ctrl', 'alt', 'delete']}
  renderKey={(key, i, all) => (
    <>
      <span style={{ color: '#00eaff' }}>{key.toUpperCase()}</span>
      {i < all.length - 1 && <span style={{ opacity: 0.5 }}> + </span>}
    </>
  )}
/>;
```

#### `useKeybindy` Hook

A powerful hook that gives you full control over the shortcut system via the ShortcutManager under the hood. Best for dynamic or advanced use cases.

##### Available methods

| Method                                                                   | Description                                  |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| [`register()`](https://github.com/keybindy/core#register)                | Register a shortcut                          |
| [`unregister()`](https://github.com/keybindy/core#unregister)            | Unregister a shortcut                        |
| [`enable()`](https://github.com/keybindy/core#enable--disable--toggle)   | Enable a specific shortcut                   |
| [`disable()`](https://github.com/keybindy/core#enable--disable--toggle)  | Disable a specific shortcut                  |
| [`toggle()`](https://github.com/keybindy/core#enable--disable--toggle)   | Toggle a shortcut on/off                     |
| [`enableAll()`](https://github.com/keybindy/core#enableall--disableall)  | Enable all shortcuts (global or scoped)      |
| [`disableAll()`](https://github.com/keybindy/core#enableall--disableall) | Disable all shortcuts (global or scoped)     |
| [`setScope()`](https://github.com/keybindy/core#setactivescope)          | Set the active scope                         |
| [`resetScope()`](https://github.com/keybindy/core#resetScope)            | Reset to default scope                       |
| [`getScopes()`](https://github.com/keybindy/core#getScopes)              | Get all defined scopes                       |
| [`getActiveScope()`](https://github.com/keybindy/core#getActiveScope)    | Get the current active scope                 |
| [`popScope()`](https://github.com/keybindy/core#popScope)                | Remove the top scope from the scope stack    |
| [`pushScope()`](https://github.com/keybindy/core#pushScope)              | Push a new scope onto the scope stack        |
| [`getCheatSheet()`](https://github.com/keybindy/core#getCheatsheet)      | Retrieve all shortcuts (optionally by scope) |
| [`onTyping()`](https://github.com/keybindy/core#onTyping)                | Listen to every key press                    |
| [`destroy()`](https://github.com/keybindy/core#destroy)                  | Tear down the current manager instance       |
| [`clear()`](https://github.com/keybindy/core#clear)                      | Unregister all shortcuts                     |
| [`getScopeInfo()`](https://github.com/keybindy/core#getScopeInfo)        | Retrieve metadata about a specific scope     |
| [`isScopeActive()`](https://github.com/keybindy/core#isScopeActive)      | Check if a scope is currently active         |

> _All methods mirror `@keybindy/core` with a React-friendly API._

##### Example

```ts
import { useKeybindy } from '@keybindy/react';

const { register, unregister, setScope, getCheatSheet } = useKeybindy();

React.useEffect(() => {
  register(
    ['ctrl', 'k'],
    () => {
      console.log('Shortcut fired!');
    },
    {
      scope: 'editor',
      preventDefault: true,
    }
  );

  return () => {
    unregister(['ctrl', 'k'], 'editor');
  };
}, []);
```

---

## Reference

If you're looking for more detailed implementation logic and architecture, check out the [@keybindy/core](https://www.npmjs.com/package/@keybindy/core) documentation for an in-depth look at how shortcut handling works under the hood.

---

## 🧩 Want More?

This package is part of the Keybindy Ecosystem:

| Package                                                        | Description                                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`@keybindy/core`](https://npmjs.com/package/@keybindy/core)   | The core JavaScript library. Framework-agnostic, fully typed, and tree-shakable. |
| [`@keybindy/react`](https://npmjs.com/package/@keybindy/react) | React bindings with hooks and components for easy integration.                   |
| _Coming Soon_                                                  | Stay tuned!                                                                      |

---

## Contributing

PRs, issues, and ideas are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

If you're adding a new framework integration (like Vue or Svelte), feel free to open a draft PR — we'd love to collaborate.

---

> _Might be new in the shortcut game, but Keybindy’s here to change the frame — fast, flexible, and ready to claim. 🎯_
