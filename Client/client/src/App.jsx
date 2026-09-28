import { useEffect, useRef, useState } from "react";
import "./App.css";
import PhoneController from "./PhoneController";
import { io } from "socket.io-client";

const getDefaultServerUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const serverFromUrl = params.get("server");

  if (serverFromUrl) {
    return serverFromUrl;
  }

  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const hostname = window.location.hostname;

  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `${protocol}://${hostname}:3000`;
  }

  return "http://localhost:3000";
};

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
            style={{
              top: `${pip.top}%`,
              left: `${pip.left}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Game() {
  const [roll, setRoll] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState([]);
  const [serverUrl, setServerUrl] = useState(getDefaultServerUrl());

  const socketRef = useRef(null);

  // ------------------------------------
  // DICE ROLL ANIMATION
  // ------------------------------------

  const triggerRollAnimation = () => {
    setRolling(false);

    requestAnimationFrame(() => {
      setRolling(true);
    });

    setTimeout(() => {
      setRolling(false);
    }, 600);
  };

  // ------------------------------------
  // HANDLE ROLL FROM ARDUINO OR PHONE
  // ------------------------------------

  const handleRoll = (roll, source) => {
    console.log(`🎲 Roll received from ${source}:`, roll);

    setRoll(roll);

    setHistory((previousHistory) => [roll, ...previousHistory].slice(0, 8));

    triggerRollAnimation();
  };

  // ------------------------------------
  // CONNECT TO SOCKET.IO SERVER
  // ------------------------------------

  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Connected to Street Craps server.");
      console.log("Socket ID:", socket.id);
      console.log("Connected to:", serverUrl);
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
    });

    socket.on("dice-roll", (data) => {
      console.log("🎲 Dice roll received:", data);

      if (data?.roll == null) {
        return;
      }

      handleRoll(Number(data.roll), data.source || "unknown");
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected from Street Craps server.");
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serverFromUrl = params.get("server");

    if (serverFromUrl) {
      setServerUrl(serverFromUrl);
    }
  }, []);

  return (
    <main className="game">
      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}

      <header className="header">
        <p className="eyebrow">SHAKE • ROLL • PLAY</p>
        <h1>STREET CRAPS</h1>
      </header>

      {/* -------------------------------- */}
      {/* GAME TABLE */}
      {/* -------------------------------- */}

      <section className="table">
        <div className="status">
          <span className="status-dot"></span>
          READY
        </div>

        {/* DICE */}

        <div className="dice-area">
          <Die value={roll} rolling={rolling} />
        </div>

        {/* LAST ROLL */}

        <div className="roll-display">
          <span>LAST ROLL</span>
          <strong>{roll}</strong>
        </div>

        {/* INSTRUCTION */}

        <p className="instruction">SHAKE THE DICE</p>
      </section>

      {/* -------------------------------- */}
      {/* ROLL HISTORY */}
      {/* -------------------------------- */}

      <section className="history">
        <h2>ROLL HISTORY</h2>

        <div className="history-list">
          {history.length === 0 ? (
            <span className="empty">Waiting for first roll...</span>
          ) : (
            history.map((number, index) => (
              <span key={`${number}-${index}`} className="history-roll">
                {number}
              </span>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

// ------------------------------------
// MAIN APP
// ------------------------------------

function App() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");

  // Phone controller mode
  if (mode === "phone") {
    return <PhoneController />;
  }

  // Normal game mode
  return <Game />;
}

export default App;