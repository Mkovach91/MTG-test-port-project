import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import decksRouter from "./routes/decks.js";
import matchesRouter from "./routes/matches.js";
import scryfallRouter from "./routes/scryfall.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/decks", decksRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/scryfall", scryfallRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on ${port}`));