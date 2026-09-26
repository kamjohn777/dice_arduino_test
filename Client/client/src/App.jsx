import { useEffect, useState } from "react";
import "./App.css";

function Die({ value, rolling }) {
  return (
    <div className={`die ${rolling ? "rolling" : ""}`}>
      <div className="die-face">
        {[...Array(value)].map((_, index) => (
          <span key={index} className={`pip pip-${index + 1}`} />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [roll, setRoll] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:3000/api/roll/latest");

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.roll) {
          setRoll((previousRoll) => {
            if (data.roll !== previousRoll) {
              setRolling(true);

              setTimeout(() => {
                setRolling(false);
              }, 600);

              setHistory((previousHistory) => [
                data.roll,
                ...previousHistory,
              ].slice(0, 8));
            }

            return data.roll;
          });
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