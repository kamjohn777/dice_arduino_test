import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function PhoneController() {
  const [connected, setConnected] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const [error, setError] = useState("");
  const [serverUrl, setServerUrl] = useState("");

  const socketRef = useRef(null);
  const previousAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeTime = useRef(0);

  // ------------------------------------
  // URL QUERY PARAMS
  // ------------------------------------

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serverFromUrl = params.get("server");

    if (serverFromUrl) {
      setServerUrl(serverFromUrl);
    } else {
      const fallbackUrl = "http://localhost:3000";
      setServerUrl(fallbackUrl);
    }
  }, []);

  // ------------------------------------
  // CONNECT TO SERVER
  // ------------------------------------

  useEffect(() => {
    if (!serverUrl) {
      return;
    }

    console.log("📡 Phone connecting to:", serverUrl);

    const socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Phone connected to server");
      setConnected(true);
      setError("");
    });

    socket.on("disconnect", () => {
      console.log("🔴 Phone disconnected");
      setConnected(false);
    });

    socket.on("connect_error", (socketError) => {
      console.error("Socket connection error:", socketError);
      setConnected(false);
      setError("Could not connect to Street Craps server. Check the server URL.");
    });

    socket.on("connect_timeout", () => {
      console.error("Socket connection timed out");
      setConnected(false);
      setError("The Street Craps server did not respond in time.");
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  // ------------------------------------
  // SEND DICE ROLL
  // ------------------------------------

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;

    console.log("📱 PHONE ROLL:", roll);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("phone-roll", roll);
      console.log("📡 Roll sent to server:", roll);
    } else {
      console.log("❌ Phone is not connected");
      setError("Phone is not connected to the server.");
    }
  };

  // ------------------------------------
  // PHONE SHAKE DETECTION
  // ------------------------------------

  const handleMotion = (event) => {
    const acceleration =
      event.accelerationIncludingGravity ?? event.acceleration ?? null;

    if (!acceleration) {
      return;
    }

    const x = Number(acceleration.x || 0);
    const y = Number(acceleration.y || 0);
    const z = Number(acceleration.z || 0);

    const previous = previousAcceleration.current;
    const previousMagnitude = Math.sqrt(
      previous.x ** 2 + previous.y ** 2 + previous.z ** 2
    );
    const currentMagnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    const movement = Math.abs(currentMagnitude - previousMagnitude);

    previousAcceleration.current = { x, y, z };

    if (movement > 12) {
      const now = Date.now();

      if (now - lastShakeTime.current > 900) {
        lastShakeTime.current = now;

        console.log("🎲 PHONE SHAKE DETECTED!");

        setMotionDetected(true);
        setTimeout(() => {
          setMotionDetected(false);
        }, 300);

        rollDice();
      }
    }
  };

  // ------------------------------------
  // ENABLE MOTION SENSOR
  // ------------------------------------

  const enableMotion = async () => {
    try {
      setError("");

      if (typeof DeviceMotionEvent === "undefined") {
        setError("This phone does not support motion detection.");
        return;
      }

      if (typeof DeviceMotionEvent.requestPermission === "function") {
        const permission = await DeviceMotionEvent.requestPermission();

        console.log("📱 Motion permission:", permission);

        if (permission !== "granted") {
          setError("Motion permission was not granted.");
          return;
        }
      }

      window.addEventListener("devicemotion", handleMotion, { passive: true });
      setMotionEnabled(true);
      console.log("🟢 Phone motion detection enabled");
    } catch (motionError) {
      console.error("Motion setup error:", motionError);
      setError("Unable to access the phone motion sensor.");
    }
  };

  // ------------------------------------
  // CLEAN UP
  // ------------------------------------

  useEffect(() => {
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);

  // ------------------------------------
  // PHONE UI
  // ------------------------------------

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <p style={{ letterSpacing: "3px", opacity: 0.6 }}>STREET CRAPS</p>

        <h1>PHONE CONTROLLER</h1>

        <div
          style={{
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "10px",
            background: connected ? "#143d24" : "#3d1414",
          }}
        >
          {connected ? "🟢 CONNECTED TO GAME" : "🔴 CONNECTING..."}
        </div>

        <div
          style={{
            marginBottom: "20px",
            background: "#1b1b1b",
            borderRadius: "10px",
            padding: "12px",
            textAlign: "left",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "12px",
              opacity: 0.7,
              marginBottom: "8px",
            }}
          >
            SERVER URL
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(event) => setServerUrl(event.target.value)}
            placeholder="http://192.168.1.50:3000"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #333",
              background: "#111",
              color: "white",
              fontSize: "14px",
            }}
          />
        </div>

        {!motionEnabled && (
          <button
            onClick={enableMotion}
            style={{
              width: "100%",
              padding: "20px",
              fontSize: "18px",
              fontWeight: "bold",
              borderRadius: "12px",
              border: "none",
              background: "#f2c94c",
              color: "#111",
              cursor: "pointer",
            }}
          >
            📱 ENABLE PHONE DICE
          </button>
        )}

        {motionEnabled && (
          <div>
            <div
              style={{
                padding: "35px 20px",
                borderRadius: "15px",
                background: motionDetected ? "#244dff" : "#1c1c1c",
              }}
            >
              <div style={{ fontSize: "60px", marginBottom: "15px" }}>📱</div>

              <h2>SHAKE YOUR PHONE</h2>

              <p style={{ opacity: 0.65 }}>Shake your phone to roll the dice.</p>

              {motionDetected && (
                <p style={{ fontWeight: "bold", marginTop: "20px" }}>
                  🎲 SHAKE DETECTED!
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <p
            style={{
              color: "#ff6b6b",
              marginTop: "20px",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

export default PhoneController;