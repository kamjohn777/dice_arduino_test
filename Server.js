const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

let latestRoll = null;
let latestRollId = 0;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Street Craps server is running!");
});

// Receive dice roll from Arduino
app.post("/api/roll", (req, res) => {
  const { roll } = req.body;

  latestRoll = roll;
  latestRollId += 1;

  console.log("🎲 Dice roll received:", roll, "| ID:", latestRollId);

  res.json({
    success: true,
    roll: roll,
    id: latestRollId,
  });
});

// Send latest roll to React
app.get("/api/roll/latest", (req, res) => {
  res.json({
    roll: latestRoll,
    id: latestRollId,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎲 Street Craps server running on port ${PORT}`);
});