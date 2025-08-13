import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { AppBar, Toolbar, Typography, Container, Button, TextField, Card, CardContent } from "@mui/material";

type Deck = { id: number; name: string };
type ScryfallCard = {
  id: string;
  name: string;
  type_line?: string;
  mana_cost?: string;
  oracle_text?: string;
  image_uris?: { normal?: string };
};

const App = () => {

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className="flex-1">MTG Stack</Typography>
          <Button color="inherit" component={Link} to="/">Decks</Button>
          <Button color="inherit" component={Link} to="/build">Build</Button>
        </Toolbar>
      </AppBar>

      <Container className="mt-2">
        <Routes>
          <Route path="/" element={<Decks />} />
          <Route path="/build" element={<Builder />} />
          <Route path="/deck/:id" element={<DeckView />} />
        </Routes>
      </Container>
    </>
  );
}
export default App

const Decks = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/decks")
      .then(response => response.json())
      .then(setDecks);
  }, []);

  const createDeck = async () => {
    const createdDeck = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDeckName })
    }).then(response => response.json());

    navigate(`/deck/${createdDeck.id}`);
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>Decks</Typography>

      <TextField
        size="small"
        label="New deck name"
        value={newDeckName}
        onChange={e => setNewDeckName(e.target.value)}
      />
      <Button
        className="ml-1"
        variant="contained"
        onClick={createDeck}
        disabled={!newDeckName.trim()}
      >
        Create
      </Button>

      <div className="container-grid grid-decks mt-2">
        {decks.map(deck => (
          <Card key={deck.id}>
            <CardContent>
              <Typography variant="h6">{deck.name}</Typography>
              <Button size="small" onClick={() => navigate(`/deck/${deck.id}`)}>Open</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

const Builder = () => {
  const [searchQuery, setSearchQuery] = useState("type:creature power>3");
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [deckId, setDeckId] = useState<number | "">("");

  const searchCards = async () => {
    const searchData = await fetch(`/api/scryfall/search?q=${encodeURIComponent(searchQuery)}`)
      .then(response => response.json());
    setSearchResults(searchData.data || []);
  };

  const addCardToDeck = async (card: ScryfallCard) => {
    if (!deckId) return;
    await fetch(`/api/decks/${deckId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card: {
          id: card.id,
          name: card.name,
          typeLine: card.type_line,
          manaCost: card.mana_cost,
          oracleText: card.oracle_text,
          imageUri: card.image_uris?.normal
        }
      })
    });
    alert("Added!");
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>Card Search</Typography>

      <TextField
        size="small"
        label="Deck ID (create a deck first)"
        value={deckId}
        onChange={e => setDeckId(Number(e.target.value) || "")}
        className="ml-1"
      />
      <TextField
        size="small"
        fullWidth
        label="Scryfall query"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="mt-1"
      />
      <Button className="mt-1" variant="contained" onClick={searchCards}>Search</Button>

      <div className="container-grid grid-cards mt-2">
        {searchResults.map(card => (
          <Card
            key={card.id}
            onClick={() => addCardToDeck(card)}
            style={{ cursor: "pointer" }}
          >
            <CardContent>
              <Typography variant="subtitle1">{card.name}</Typography>
              {card.image_uris?.normal && <img src={card.image_uris.normal} className="card-image" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

const DeckView = () => {
  const { id } = useParams();
  const [deck, setDeck] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/decks/${id}`)
      .then(response => response.json())
      .then(setDeck);
  }, [id]);

  if (!deck) return null;

  return (
    <>
      <Typography variant="h5">{deck.name}</Typography>
      <Typography className="mt-1" variant="subtitle1">Cards</Typography>

      <div className="container-grid grid-cards">
        {deck.cards?.map((deckCard: any) => (
          <Card key={deckCard.cardId}>
            <CardContent>
              <Typography variant="subtitle2">
                {deckCard.card.name} x{deckCard.qty}
              </Typography>
              {deckCard.card.imageUri && <img src={deckCard.card.imageUri} className="card-image" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};