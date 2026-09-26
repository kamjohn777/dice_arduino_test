import { useEffect, useRef, useState } from "react";
import "./App.css";

const PIP_POSITIONS = {
  1: [{ top: 50, left: 50 }],
  2: [
    { top: 25, left: 25 },
    { top: 75, left: 75 },
  ],
  3: [
    { top: 25, left: 25 },
    { top: 50, left: 50 },
    { top: 75, left: 75 },
  ],
  4: [
    { top: 25, left: 25 },
    { top: 25, left: 75 },
    { top: 75, left: 25 },
    { top: 75, left: 75 },
  ],
  5: [
    { top: 25, left: 25 },
    { top: 25, left: 75 },
    { top: 50, left: 50 },
    { top: 75, left: 25 },
    { top: 75, left: 75 },
  ],
  6: [
    { top: 25, left: 25 },
    { top: 25, left: 75 },
    { top: 50, left: 25 },
    { top: 50, left: 75 },
    { top: 75, left: 25 },
    { top: 75, left: 75 },
  ],
};

function Die({ value, rolling }) {
  const pips = PIP_POSITIONS[value] || [];

  return (
    <div className={`die ${rolling ? "rolling" : ""}`}>
      <div className="die-face">
        {pips.map((pip, index) => (
          <span
            key={`${value}-${index}`}
            className="pip"
            style={{ top: `${pip.top}%`, left: `${pip.left}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [roll, setRoll] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState([]);
  const lastRollIdRef = useRef(null);

  const triggerRollAnimation = () => {
    setRolling(false);

    requestAnimationFrame(() => {
      setRolling(true);
    });

    setTimeout(() => {
      setRolling(false);
    }, 600);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:3000/api/roll/latest");

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.roll == null) {
          return;
        }

        const isNewRoll = data.id !== undefined && data.id !== lastRollIdRef.current;

        if (isNewRoll || lastRollIdRef.current === null) {
          lastRollIdRef.current = data.id ?? lastRollIdRef.current;

          setHistory((previousHistory) => [
            data.roll,
            ...previousHistory,
          ].slice(0, 8));

          setRoll(data.roll);
          triggerRollAnimation();
        }
      } catch (error) {
        console.log("Waiting for server...");
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="game">

      <header className="header">
        <p className="eyebrow">SHAKE • ROLL • PLAY</p>
        <h1>STREET CRAPS</h1>
      </header>

      <section className="table">

        <div className="status">
          <span className="status-dot"></span>
          READY
        </div>

        <div className="dice-area">

          <Die
            value={roll}
            rolling={rolling}
          />

        </div>

        <div className="roll-display">
          <span>LAST ROLL</span>
          <strong>{roll}</strong>
        </div>

        <p className="instruction">
          SHAKE THE DICE
        </p>

      </section>

      <section className="history">

        <h2>ROLL HISTORY</h2>

        <div className="history-list">

          {history.length === 0 ? (
            <span className="empty">
              Waiting for first roll...
            </span>
          ) : (
            history.map((number, index) => (
              <span key={index} className="history-roll">
                {number}
              </span>
            ))
          )}

        </div>

      </section>

    </main>
  );
}

export default App;