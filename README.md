# Keybindy

**A lightweight, fast, and framework-agnostic TypeScript library for managing keyboard shortcuts in modern web applications.**

Keybindy provides a simple yet powerful API to register, manage, and scope keyboard shortcuts with a tiny footprint and zero dependencies. It is designed to be flexible, tree-shakeable, and easy to integrate into any project, from vanilla JavaScript to React.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## About Keybindy

Keyboard shortcuts are essential for a productive user experience, but managing them across different components, contexts, and frameworks can be complex. Keybindy solves this by providing a robust, centralized, and framework-agnostic solution.

- **Tiny & Dependency-Free**: Approximately 2KB gzipped, with no external dependencies.
- **Framework-Agnostic**: Works with Vanilla JS, React, Vue, Svelte, and any other framework.
- **Simple yet Powerful API**: Clean and intuitive methods to register, scope, and manage shortcuts.
- **Type-Safe**: Written entirely in TypeScript for a great developer experience.
- **SSR-Safe**: Designed to work flawlessly in server-side rendering environments like Next.js.

## Packages

This repository is a monorepo managed by [pnpm](https://pnpm.io/). It contains the following packages:

| Package                               | Version                                                                                                         | Description                                                                  | Docs                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| [`@keybindy/core`](./packages/core)   | [![npm version](https://badge.fury.io/js/@keybindy%2Fcore.svg)](https://www.npmjs.com/package/@keybindy/core)   | The core, framework-agnostic shortcut management library.                    | [Docs](./packages/core/README.md)  |
| [`@keybindy/react`](./packages/react) | [![npm version](https://badge.fury.io/js/@keybindy%2Freact.svg)](https://www.npmjs.com/package/@keybindy/react) | React components and hooks for seamless integration with React applications. | [Docs](./packages/react/README.md) |

## Installation

Install the package you need using your preferred package manager:

```bash
# For the core library
pnpm add @keybindy/core

# For the React integration
pnpm add @keybindy/react
```

## Getting Started

Here is a quick example of how to use `@keybindy/core` in a vanilla JavaScript project.

```ts
import ShortcutManager from '@keybindy/core';

// 1. Initialize the manager
const manager = new ShortcutManager();

// 2. Define a handler
const saveDocument = () => {
  console.log('Document saved!');
};

// 3. Register the shortcut
manager.register(['Ctrl', 'S'], saveDocument, {
  // Optional: prevent the browser's default save action
  preventDefault: true,
});
```

For framework-specific usage, please see the `README.md` file in the corresponding package directory.

## Development and Contributing

This project is a monorepo, and we welcome contributions! To get started with local development, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/keybindyjs/keybindy.git
    cd keybindy
    ```

2.  **Install dependencies:**

    This project uses `pnpm` for workspace management. Install it if you haven't already (`npm install -g pnpm`), then run:

    ```bash
    pnpm install
    ```

3.  **Run tests:**

    You can run tests for all packages or for a specific one.

    ```bash
    # Run all tests
    pnpm test

    # Run tests for a specific package (e.g., @keybindy/react)
    pnpm --filter @keybindy/react test
    ```

We encourage you to open an issue or a pull request if you have ideas for improvement or have found a bug.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
