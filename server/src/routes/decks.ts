import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.post("/", async (req, res, next) => {
  const { name, userId } = req.body;
  const deck = await prisma.deck.create({ data: { name, userId } });
  res.json(deck);
});

router.get("/", async (_req, res, next) => {
  const decks = await prisma.deck.findMany({
    include: { cards: { include: { card: true } }, matches: true }
  });
  res.json(decks);
});

router.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  const deck = await prisma.deck.findUnique({
    where: { id },
    include: { cards: { include: { card: true } }, matches: true }
  });
  if (!deck) return res.status(404).json({ error: "Not found" });
  res.json(deck);
});

router.post("/:id/cards", async (req, res) => {
  const deckId = Number(req.params.id);
  const { card } = req.body; // { id, name, typeLine, manaCost, oracleText, imageUri }
  await prisma.card.upsert({
    where: { id: card.id },
    create: card,
    update: card
  });
  const link = await prisma.deckCard.upsert({
    where: { deckId_cardId: { deckId, cardId: card.id } },
    create: { deckId, cardId: card.id, qty: 1 },
    update: { qty: { increment: 1 } }
  });
  res.json(link);
});

router.delete("/:id/cards/:cardId", async (req, res) => {
  const deckId = Number(req.params.id);
  const { cardId } = req.params;
  await prisma.deckCard.delete({ where: { deckId_cardId: { deckId, cardId } } });
  res.status(204).end();
});

export default router;