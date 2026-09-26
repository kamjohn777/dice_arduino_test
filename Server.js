const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

let latestRoll = null;

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

  console.log("🎲 Dice roll received:", roll);

  res.json({
    success: true,
    roll: roll
  });

});

// Send latest roll to React
app.get("/api/roll/latest", (req, res) => {

  res.json({
    roll: latestRoll
  });

});

// Start server
app.listen(PORT, () => {
  console.log(`🎲 Street Craps server running on port ${PORT}`);
});