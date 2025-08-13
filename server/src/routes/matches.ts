import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.post("/", async (req, res, next) => {
  const { deckId, opponent, result } = req.body; // WIN | LOSS | DRAW
  const match = await prisma.match.create({ data: { deckId, opponent, result } });
  res.json(match);
});

export default router;