require("dotenv").config();

const express = require("express");
const cors = require("cors");

const poisRouter = require("./routes/pois");
const crowdRouter = require("./routes/crowd");
const routeRouter = require("./routes/route");
const geocodeRouter = require("./routes/geocode");
const lostfoundRouter = require("./routes/lostfound");
const chatRouter = require("./routes/chat");
const landmarks = require("./data/landmarks.json");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "bhramastra-server" }));
app.get("/api/landmarks", (req, res) => res.json(landmarks));

app.use("/api/pois", poisRouter);
app.use("/api/crowd", crowdRouter);
app.use("/api/route", routeRouter);
app.use("/api/geocode", geocodeRouter);
app.use("/api/lostfound", lostfoundRouter);
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`Bhramastra server running on http://localhost:${PORT}`);
});
