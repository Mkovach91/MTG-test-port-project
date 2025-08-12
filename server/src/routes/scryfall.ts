import { Router } from "express";

const router = Router();

router.get("/search", async (req, res, next) => {
  const q = String(req.query.q || "");
  if (!q) return res.status(400).json({ error: "missing q" });

  const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}`);
  const data = await response.json();
  res.json(data);
});

export default router