import { useEffect, useState } from 'react';
import { Keybindy, useKeybindy, useShortcuts } from '@keybindy/react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const s = useKeybindy();

  useEffect(() => {
    console.log(s.getScopePriority())
  }, [s])


  return (
    <Keybindy
      scope="global"
      beforeEach={()=> {console.log("before 1")}}
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
        beforeEach={()=> {console.log("before 2")}}
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

        <button onClick={() => setIsModalOpen(!isModalOpen)}>Open</button>

        {isModalOpen && <Modal setIsModalOpen={setIsModalOpen} />}
        <input type="text" />
        <textarea name="" id=""></textarea>

        <section style={{ marginTop: 24 }}>
          <h2>Instance mode: duplicate modals + Enter</h2>
          <p>
            Increment a counter, press Enter. The log must show the counter of
            the modal you interacted with.
          </p>
          <InstanceModal label="modal 1" />
          <InstanceModal label="modal 2" />
        </section>

        <section style={{ marginTop: 24 }}>
          <h2>Duplicate warning: non-instance hooks</h2>
          <p>
            Two mounted global hooks bind Q without instance mode. Watch the
            console for one &quot;Duplicate shortcut detected&quot; warning.
          </p>
          <NonInstanceDuplicate />
          <NonInstanceDuplicate />
        </section>
      </Keybindy>
    </Keybindy>
  );
}

export default App;

const InstanceModal = ({ label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [counter, setCounter] = useState(0);

  useShortcuts(
    [
      {
        keys: ['Enter'],
        handler: () => {
          console.log(`${label} fired — counter: ${counter}`);
        },
        options: {
          preventDefault: true,
        },
      },
    ],
    {
      // disabled: !isOpen,
    }
  );

  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setIsOpen(true)}>Open {label}</button>
      {isOpen && (
        <div
          style={{
            background: 'gray',
            color: 'white',
            padding: 10,
            borderRadius: 5,
            marginTop: 8,
          }}
        >
          <p>
            {label} counter: {counter}
          </p>
          <button onClick={() => setCounter(counter + 1)}>Increment</button>
          <button style={{ marginLeft: 8 }} onClick={() => setIsOpen(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

const NonInstanceDuplicate = () => {
  useShortcuts([
    {
      keys: ['Q'],
      handler: () => console.log('Q pressed'),
    },
  ]);

  return null;
};

const Modal = ({ setIsModalOpen }) => {
  return (<Keybindy scope='dialog' shortcuts={[{ keys: ["X"], handler: () => { console.log("x pressed from Modal") } }]}>
    <div style={{ background: "gray", color: "white", padding: "10px", borderRadius: "5px", position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "50vw", aspectRatio: "16 / 9" }}>
      <p>Open</p>
      <button onClick={() => setIsModalOpen(false)}>Close</button>
    </div>
  </Keybindy>)
}