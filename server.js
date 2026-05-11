const express = require("express");
const app = express();

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Trading Journal API is running");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});