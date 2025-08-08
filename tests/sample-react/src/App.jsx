import { useEffect, useState } from 'react';
import { Keybindy, ShortcutLabel, useKeybindy } from '@keybindy/react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const s = useKeybindy();

  useEffect(() => {
    s.register(['Enter'], () => {
      console.log('Enter key pressed!');
    });
    console.log(s.getCheatSheet())
  }, [s]);


  return (
    <Keybindy
      scope="global"
      shortcuts={[
        {
          keys: [['Ctrl (Left)'], ['Alt']],
          handler: (e, state) => {
            console.log(e)
            if (state === 'down') {
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          },
          options: {
            hold: true,
            preventDefault: true,
          },
        },
        {
          keys: ['O', 'P'],
          handler: () => {
            console.log('op pressed');
          },
          options: {
            preventDefault: true,
          },
        },
        {
          keys: ['R'],
          handler: () => {
            window.open('https://react.dev', '_blank');
          },
          options: {
            preventDefault: true,
          },
        },
      ]}
    >
      <div>
        <ShortcutLabel
          keys={[["ctrl","a","shift"]]}
          // render={(keys) => {
          //   console.log(keys)
          //   return keys.map((key) => (
          //     <span
          //       key={key}
          //       className="text-xs font-medium text-foreground rounded px-2 py-1 bg-muted border-muted select-auto"
          //     >
          //       {key}
          //     </span>
          //   ));
          // }}
        />
      </div>
      <h1>Vite + React</h1>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <Keybindy
          scope="dialog"
          shortcuts={[
            {
              keys: ['Esc'],
              handler: () => setIsOpen(false),
              options: {
                preventDefault: true,
              },
            },
          ]}
        >
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90vw',
              height: '200px',
              backgroundColor: '#2e2e2e',
              color: '#fff',
              padding: '20px',
              borderRadius: '5px',
            }}
          >
            <h2>Alert</h2>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </Keybindy>
      )}
      <p>
        Edit <code>src/App.jsx</code> and save to test HMR
      </p>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </Keybindy>
  );
}

export default App;
