import { useEffect, useState } from 'react';
import { Keybindy, useKeybindy } from '@keybindy/react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const s = useKeybindy();

  useEffect(() => {
    console.log(s.getScopePriority())
  }, [s])


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
      <Keybindy
        scope="global"
        shortcuts={() => {
          let variable = 1;
          return [
            {
              keys: ['Z'],
              handler: () => {
                variable++;
                console.log('Z pressed:', variable);
              },
              options: {
                repeat: true,
                // ignoreInputs: true

              }
            },
            {
              keys: ['X'],
              handler: () => {
                variable++;
                console.log('X pressed:', variable);
              },
            },
          ];
        }}>

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

        <button onClick={() => setIsModelOpen(!isModelOpen)}>Open</button>

        {isModelOpen && <Model setIsModelOpen={setIsModelOpen} />}
        <input type="text" />
        <textarea name="" id=""></textarea>
      </Keybindy>
    </Keybindy>
  );
}

export default App;

const Model = ({ setIsModelOpen }) => {
  return (<Keybindy scope='dialog' shortcuts={[{ keys: ["X"], handler: () => { console.log("x presed from model") } }]}>
    <div style={{ background: "gray", color: "white", padding: "10px", borderRadius: "5px", position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "50vw", aspectRatio: "16 / 9" }}>
      <p>Open</p>
      <button onClick={() => setIsModelOpen(false)}>Close</button>
    </div>
  </Keybindy>)
}