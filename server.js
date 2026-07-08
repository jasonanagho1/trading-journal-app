const multer = require("multer");
const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: function (req, file,cb){
    cb(null, "uploads/");
  },

  filename: function (req, file, cb){
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

let trades = JSON.parse(fs.readFileSync("trades.json"));

app.post("/trades", upload.single("screenshot"), (req, res) => {
  //add trade
  const newTrade ={
    id: Date.now(),
    date: new Date().toISOString(),
    pair: req.body.pair,
    direction: req.body.direction,
    profitLoss: req.body.profitLoss,
    risk: req.body.risk,
    notes: req.body.notes,
    tags: JSON.parse(req.body.tags || "[]"),
    screenshot: req.file ? "/uploads/" + req.file.filename : ""
    

  };




  trades.push(newTrade);
  fs.writeFileSync("trades.json", JSON.stringify(trades));
  res.json({
    message:"Trade added succesfully",
    trade: newTrade
  });
});

app.delete("/trades/:id", (req, res) => {
  const tradeId = Number(req.params.id);

  const tradeIndex = trades.findIndex(
    trade => trade.id === tradeId
  );

  if (tradeIndex === -1){
    return res.status(404).json({
      message: "Trade not found"
    });
  }

  trades.splice(tradeIndex, 1);
  fs.writeFileSync("trades.json", JSON.stringify(trades));
  res.json({
    message: "Trade deleted successfully"
  });
});

app.put("/trades/:id", upload.single("screenshot"), (req, res) => {
  const tradeId = Number(req.params.id);

  const tradeIndex = trades.findIndex((trade) => trade.id === tradeId);

  if (tradeIndex === -1) {
    return res.status(404).json({ message: "Trade not found" });
  }

  let screenshotPath = trades[tradeIndex].screenshot;

  if (req.body.removeScreenshot === "true") {
  screenshotPath = "";
  } else if (req.file) {
  screenshotPath = "/uploads/" + req.file.filename;
  }

  trades[tradeIndex] = {
  ...trades[tradeIndex],
  pair: req.body.pair,
  direction: req.body.direction,
  profitLoss: req.body.profitLoss,
  risk: req.body.risk,
  notes: req.body.notes,
  tags: JSON.parse(req.body.tags || "[]"),
  screenshot: screenshotPath
  };

  fs.writeFileSync("trades.json", JSON.stringify(trades));

  res.json(trades[tradeIndex]);
});

app.get("/trades", (req,res) => {
  res.json(trades);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
