const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 3000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

let latestRoll = null;
let rollId = 0;

// ------------------------------------
// BASIC SERVER TEST
// ------------------------------------

app.get("/", (req, res) => {
  res.send("🎲 Street Craps server is running!");
});

// ------------------------------------
// ARDUINO ROLL
// ------------------------------------

app.post("/api/roll", (req, res) => {
  const { roll } = req.body;

  if (roll == null) {
    return res.status(400).json({
      success: false,
      error: "Roll is required",
    });
  }

  rollId++;

  latestRoll = {
    id: rollId,
    roll: Number(roll),
    source: "arduino",
  };

  console.log("🎲 Arduino roll received:", roll);

  // Send roll to every connected browser
  io.emit("dice-roll", latestRoll);

  res.json({
    success: true,
    ...latestRoll,
  });
});

// ------------------------------------
// GET LATEST ROLL
// ------------------------------------

app.get("/api/roll/latest", (req, res) => {
  res.json(latestRoll);
});

// ------------------------------------
// PHONE CONNECTION
// ------------------------------------

io.on("connection", (socket) => {
  console.log("🔌 Browser connected:", socket.id);

  // Phone sends a roll
  socket.on("phone-roll", (roll) => {
    rollId++;

    latestRoll = {
      id: rollId,
      roll: Number(roll),
      source: "phone",
    };

    console.log("📱 Phone roll received:", roll);

    // Send the roll to all connected browsers
    io.emit("dice-roll", latestRoll);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Browser disconnected:", socket.id);
  });
});

// ------------------------------------
// START SERVER
// ------------------------------------

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🎲 Street Craps server running on port ${PORT}`);
});