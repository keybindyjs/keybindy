import './style.css';
import ShortcutManager from '../../../packages/core/src';
// import ShortcutManager from "@keybindy/core";

// Create a shortcut manager instance
const manager = new ShortcutManager();

manager.register(
  ['Ctrl', 'Shift'],
  (e, s) => {
    console.log('Sequential GH shortcut triggered!', s);
  },
  {
    hold: true,
  }
);

manager.register(
  ['D'],
  () => {
    console.log('D key released!');
  },
  {
    triggerOn: 'keyup',
  }
);

manager.register(
  ['D'],
  () => {
    console.log('D key pressed!');
  },
  {
    triggerOn: 'keydown',
  }
);

manager.register(['Enter'], () => {
  console.log('Enter key pressed!');
});

manager.register(['g', 'h'], () => {
  console.log('Simultaneous GH shortcut triggered!');
});

manager.register(['ctrl', 's'], e => {
  e.preventDefault();
  console.log('Sequential CTRL+S shortcut triggered!');
});

manager.register(
  ['g', 'g', 'h', 'h'],
  () => {
    console.log('Sequential GG shortcut triggered!');
  },
  {
    sequential: true,
    sequenceDelay: 3000,
  }
);

manager.register(
  ['s', 'p'],
  () => {
    console.log('Sequential SP shortcut triggered!');
  },
  {
    sequential: true,
    sequenceDelay: 3000,
    scope: 'nono',
  }
);

manager.register(
  ['l', 'g'],
  () => {
    console.log('Sequential LG shortcut triggered!');
  },
  {
    sequential: true,
    sequenceDelay: 3000,
    scope: 'lg',
  }
);
manager.register(
  ['l', 'g'],
  () => {
    console.log('Sequential LG shortcut triggered from default!');
  },
  {
    sequential: true,
    sequenceDelay: 3000,
  }
);

manager.register(
  ['Ctrl', 'C'],
  () => {
    console.log('CTRL+C shortcut triggered!');
  },
  {
    ignoreInputs: true,
  }
);

// manager.setActiveScope('nono');

// manager.disableAll();
// Get all methods (including inherited ones)
manager.setScopeMode('cascade');
manager.setScopePriority(scope => ({ ...scope, global: 10 }));
// manager.setScopePriority(scope => ({ ...scope, global: 10 }));
// console.log(manager.getScopesInfo());
// console.log(manager.getScopePriority());

console.log(manager.getScopePriority());
