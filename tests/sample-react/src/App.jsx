import { useEffect, useState } from 'react';
import { Keybindy, ShortcutLabel, useKeybindy } from '../../../packages/react/src';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const s = useKeybindy();

  useEffect(() => {
    s.register(['Enter'], () => {
      console.log('Enter key pressed!');
    });
  }, [s]);

  return (
    <Keybindy
      scope="global"
      shortcuts={[
        {
          keys: ['Ctrl', 'Shift'],
          handler: () => {
            setIsOpen(true);
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
          keys={['ctrl', 'alt', 'delete']}
          renderKey={(key, i, all) => (
            <>
              <span style={{ color: '#00eaff' }}>{key.toUpperCase()}</span>
              {i < all.length - 1 && <span style={{ opacity: 0.5 }}> + </span>}
            </>
          )}
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
