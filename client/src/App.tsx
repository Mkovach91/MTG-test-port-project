import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Paper,
  InputBase,
  LinearProgress,
  CardMedia,
  Chip,
  Snackbar,
  Divider,
  Autocomplete,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

type AppProps = { mode: "light" | "dark"; setMode: (m: "light" | "dark") => void };

type Deck = { id: number; name: string };

type ScryfallCard = {
  id: string;
  name: string;
  type_line?: string;
  mana_cost?: string;
  oracle_text?: string;
  image_uris?: { normal?: string };
};

const App: React.FC<AppProps> = ({ mode, setMode }) => {
  const handleToggleTheme = () => setMode(mode === "light" ? "dark" : "light");

  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 800 }}>
            MTG Stack
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button color="inherit" component={Link} to="/">
              Decks
            </Button>
            <Button color="inherit" component={Link} to="/cards">
              Card Database
            </Button>
            <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
              <IconButton color="inherit" onClick={handleToggleTheme}>
                {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<Decks />} />
          <Route path="/cards" element={<CardDatabase />} />
          <Route path="/deck/:id" element={<DeckView />} />
        </Routes>
      </Container>
    </>
  );
};

const Decks: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState("");
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAllDecks = async () => {
    try {
      const response = await fetch("/api/decks");
      const deckList: Deck[] = await response.json();
      setDecks(deckList);
    } catch {
      setDecks([]);
    }
  };

  useEffect(() => {
    fetchAllDecks();
  }, []);

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDeckName }),
    });
    const createdDeck: Deck = await response.json();

    setCreatedMessage(`Created deck: ${createdDeck.name}`);
    setNewDeckName("");
    setDecks((previousDecks) => [...previousDecks, createdDeck]);
    navigate(`/deck/${createdDeck.id}`);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Decks</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          label="New deck name"
          size="small"
          value={newDeckName}
          onChange={(event) => setNewDeckName(event.target.value)}
        />
        <Button onClick={handleCreateDeck} disabled={!newDeckName.trim()}>
          Create
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {decks.map((deckItem) => (
          <Grid item xs={12} sm={6} md={4} key={deckItem.id}>
            <Card
              elevation={2}
              sx={{ "&:hover": { transform: "translateY(-2px)", boxShadow: 6 } }}
            >
              <CardContent>
                <Typography variant="h6">{deckItem.name}</Typography>
              </CardContent>
              <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                <Button size="small" onClick={() => navigate(`/deck/${deckItem.id}`)}>
                  Open
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={!!createdMessage}
        autoHideDuration={1600}
        onClose={() => setCreatedMessage(null)}
        message={createdMessage ?? ""}
      />
    </Stack>
  );
};


const CardDatabase: React.FC = () => {
  const [scryfallQuery, setScryfallQuery] = useState("type:creature power>3");
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAllDecks = async () => {
    try {
      const response = await fetch("/api/decks");
      const deckList: Deck[] = await response.json();
      setAllDecks(deckList);
    } catch {
      setAllDecks([]);
    }
  };

  useEffect(() => {
    fetchAllDecks();
  }, []);

  const searchCards = async () => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/scryfall/search?q=${encodeURIComponent(scryfallQuery)}`
      );
      const scryfallResponse = await response.json();
      const cards: ScryfallCard[] = scryfallResponse.data || [];
      setSearchResults(cards);
    } finally {
      setIsSearching(false);
    }
  };

  const addCardToSelectedDeck = async (cardToAdd: ScryfallCard) => {
    if (!selectedDeck) {
      setSnackbarMessage("Select a deck first.");
      return;
    }

    await fetch(`/api/decks/${selectedDeck.id}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card: {
          id: cardToAdd.id,
          name: cardToAdd.name,
          typeLine: cardToAdd.type_line,
          manaCost: cardToAdd.mana_cost,
          oracleText: cardToAdd.oracle_text,
          imageUri: cardToAdd.image_uris?.normal,
        },
      }),
    });

    setSnackbarMessage(`${cardToAdd.name} added to ${selectedDeck.name}`);
  };

  const handleSubmitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchCards();
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Card Database</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
        <Autocomplete
          options={allDecks}
          value={selectedDeck}
          onChange={(_event, newValue) => setSelectedDeck(newValue)}
          getOptionLabel={(deckOption) => `${deckOption.name} (ID: ${deckOption.id})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Select a Deck"
              placeholder="Type deck name…"
            />
          )}
          sx={{ width: { xs: "100%", sm: 360 } }}
        />

        <Button
          variant="outlined"
          onClick={() => navigate("/")}
          sx={{ whiteSpace: "nowrap" }}
        >
          Create / Manage Decks
        </Button>

        <Paper
          component="form"
          onSubmit={handleSubmitSearch}
          sx={{ p: "2px 8px", display: "flex", alignItems: "center", flex: 1, minWidth: 260 }}
          elevation={2}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Scryfall query (e.g. t:instant cmc<=2)"
            value={scryfallQuery}
            onChange={(event) => setScryfallQuery(event.target.value)}
          />
          <IconButton type="submit" aria-label="search">
            <SearchIcon />
          </IconButton>
        </Paper>
      </Stack>

      {isSearching && <LinearProgress />}

      <Grid container spacing={2}>
        {searchResults.map((cardResult) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={cardResult.id}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
              }}
            >
              {cardResult.image_uris?.normal && (
                <CardMedia
                  component="img"
                  image={cardResult.image_uris.normal}
                  alt={cardResult.name}
                  sx={{ aspectRatio: "3/4", objectFit: "cover" }}
                />
              )}
              <CardContent sx={{ flex: 1 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {cardResult.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cardResult.type_line}
                  </Typography>
                  {cardResult.mana_cost && (
                    <Chip
                      size="small"
                      color="secondary"
                      label={cardResult.mana_cost}
                      sx={{ alignSelf: "flex-start" }}
                    />
                  )}
                </Stack>
              </CardContent>
              <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                <Button startIcon={<AddIcon />} onClick={() => addCardToSelectedDeck(cardResult)}>
                  Add to deck
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={2000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage ?? ""}
      />
    </Stack>
  );
};

const DeckView: React.FC = () => {
  const { id: deckIdParam } = useParams();
  const [deckDetails, setDeckDetails] = useState<any>(null);

  const [deckSearchQuery, setDeckSearchQuery] = useState("type:creature power>3");
  const [deckSearchResults, setDeckSearchResults] = useState<ScryfallCard[]>([]);
  const [isDeckSearching, setIsDeckSearching] = useState(false);
  const [deckSnackbarMessage, setDeckSnackbarMessage] = useState<string | null>(null);

  const fetchDeckDetails = async (deckId: string | undefined) => {
    if (!deckId) return;
    try {
      const response = await fetch(`/api/decks/${deckId}`);
      const deckPayload = await response.json();
      setDeckDetails(deckPayload);
    } catch {
      setDeckDetails(null);
    }
  };

  useEffect(() => {
    fetchDeckDetails(deckIdParam);
  }, [deckIdParam]);

  const searchCardsForDeck = async () => {
    setIsDeckSearching(true);
    try {
      const response = await fetch(
        `/api/scryfall/search?q=${encodeURIComponent(deckSearchQuery)}`
      );
      const scryfallResponse = await response.json();
      const cards: ScryfallCard[] = scryfallResponse.data || [];
      setDeckSearchResults(cards);
    } finally {
      setIsDeckSearching(false);
    }
  };

  const handleSubmitDeckSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchCardsForDeck();
  };

  const addCardDirectlyToDeck = async (cardToAdd: ScryfallCard) => {
    if (!deckIdParam) return;

    await fetch(`/api/decks/${deckIdParam}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card: {
          id: cardToAdd.id,
          name: cardToAdd.name,
          typeLine: cardToAdd.type_line,
          manaCost: cardToAdd.mana_cost,
          oracleText: cardToAdd.oracle_text,
          imageUri: cardToAdd.image_uris?.normal,
        },
      }),
    });

    setDeckSnackbarMessage(`${cardToAdd.name} added to deck`);
    
    fetchDeckDetails(deckIdParam);
  };

  if (!deckDetails) return null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {deckDetails.name}
        </Typography>
        <Chip label={`${deckDetails.cards?.length ?? 0} unique cards`} />
      </Stack>

      <Paper
        component="form"
        onSubmit={handleSubmitDeckSearch}
        sx={{ p: "2px 8px", display: "flex", alignItems: "center", minHeight: 48 }}
        elevation={2}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search cards to add (e.g. type:instant cmc<=2)"
          value={deckSearchQuery}
          onChange={(event) => setDeckSearchQuery(event.target.value)}
        />
        <IconButton type="submit" aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>

      {isDeckSearching && <LinearProgress />}

      {deckSearchResults.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            Search Results
          </Typography>
          <Grid container spacing={2}>
            {deckSearchResults.map((cardResult) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={cardResult.id}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
                  }}
                >
                  {cardResult.image_uris?.normal && (
                    <CardMedia
                      component="img"
                      image={cardResult.image_uris.normal}
                      alt={cardResult.name}
                      sx={{ aspectRatio: "3/4", objectFit: "cover" }}
                    />
                  )}
                  <CardContent sx={{ flex: 1 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {cardResult.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cardResult.type_line}
                      </Typography>
                      {cardResult.mana_cost && (
                        <Chip
                          size="small"
                          color="secondary"
                          label={cardResult.mana_cost}
                          sx={{ alignSelf: "flex-start" }}
                        />
                      )}
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                    <Button startIcon={<AddIcon />} onClick={() => addCardDirectlyToDeck(cardResult)}>
                      Add to deck
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      <Typography variant="subtitle1">Current Deck</Typography>
      <Grid container spacing={2}>
        {(deckDetails.cards ?? []).map((deckCardLink: any) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={deckCardLink.cardId}>
            <Card elevation={2} sx={{ height: "100%" }}>
              {deckCardLink.card.imageUri && (
                <CardMedia
                  component="img"
                  image={deckCardLink.card.imageUri}
                  alt={deckCardLink.card.name}
                  sx={{ aspectRatio: "3/4", objectFit: "cover" }}
                />
              )}
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {deckCardLink.card.name}
                  </Typography>
                  <Chip size="small" color="primary" label={`x${deckCardLink.qty}`} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={!!deckSnackbarMessage}
        autoHideDuration={2000}
        onClose={() => setDeckSnackbarMessage(null)}
        message={deckSnackbarMessage ?? ""}
      />
    </Stack>
  );
};

export default App;