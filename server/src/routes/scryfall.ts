import { Router } from "express";

const router = Router();

router.get("/search", async (req, res, next) => {
  const searchQuery = String(req.query.q || "").trim();
  if (!searchQuery) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.details || `Scryfall API returned status ${response.status}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching from Scryfall:", err);
    res.status(500).json({
      error: "An error occurred while fetching data from Scryfall.",
    });
  }
});

export default router;