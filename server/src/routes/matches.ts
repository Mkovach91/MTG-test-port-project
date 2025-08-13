import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { deckId, opponent, result } = req.body; // Expected: WIN | LOSS | DRAW

    if (!deckId || !opponent || !result) {
      return res.status(400).json({ error: "deckId, opponent, and result are required." });
    }

    const validResults = ["WIN", "LOSS", "DRAW"];
    if (!validResults.includes(result)) {
      return res.status(400).json({ error: `Invalid result. Must be one of: ${validResults.join(", ")}` });
    }

    const newMatchRecord = await prisma.match.create({
      data: { deckId, opponent, result }
    });

    res.json(newMatchRecord);
  } catch (error) {
    next(error);
  }
});

export default router;