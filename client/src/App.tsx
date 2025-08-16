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
  LinearProgress,
  CardMedia,
  Chip,
  Snackbar,
  Divider,
  Autocomplete,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Box,
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

const SET_OPTIONS = [
    { code: "any", label: "Any Set" },
    { code: "mh3", label: "Modern Horizons 3" },
    { code: "otj", label: "Outlaws of Thunder Junction" },
    { code: "rvr", label: "Ravnica Remastered" },
    { code: "ltr", label: "The Lord of the Rings: Tales of Middle-earth" },
    { code: "one", label: "Phyrexia: All Will Be One" },
  ];

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

type FiltersState = {
  type: string;
  colors: string[];
  cmc: [number, number];
  setCode: string;
}

const buildQueryWithFilters = (
  baseQuery: string,
  filters: FiltersState
) => {
  let searchQuery = baseQuery.trim();

  if (filters.type && filters.type !== "any") searchQuery += ` t:${filters.type}`;

  if (filters.color && filters.colors.length > 0) {
    const joined = filters.colors.join("");
    searchQuery += ` id<=${joined}`;
  }


  if (filters.cmc) {
    const [min, max] = filters.cmc;

    if (min > 0) searchQuery += ` cmc>=${min}`;
    if (max < 20) searchQuery += ` cmc<=${max}`;
  }

  if (filters.setCode && filters.setCode !== "any") {
    searchQuery += ` s:${filters.setCode}`;
  }


  return searchQuery.trim();

}
/* --------------------------------- DECKS --------------------------------- */
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

/* ---------------------------- CARD DATABASE PAGE ---------------------------- */

const CardDatabase: React.FC = () => {
  const [scryfallQuery, setScryfallQuery] = useState("type:creature power>3");
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<string>("any");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [cmcRange, setCmcRange] = useState<[number, number]>([0, 20]);
  const [selectedSet, setSelectedSet] = useState<string>("any");
  const [predictiveOptions, setPredictiveOptions] = useState<string[]>([]);
  const [isPredictiveLoading, setIsPredictiveLoading] = useState(false);
  const [predictiveDebounceId, setPredictiveDebounceId] = useState<number | null>(null);

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


  useEffect(() => {
    return () => {
      if (predictiveDebounceId) window.clearTimeout(predictiveDebounceId);
    };
  }, [predictiveDebounceId]);

  const searchCards = async () => {
    setIsSearching(true);
    try {
      const finalQuery = buildQueryWithFilters(scryfallQuery, {
        type: selectedType,
        colors: selectedColors,
        cmc: cmcRange,
        setCode: selectedSet,
      });
      const response = await fetch(`/api/scryfall/search?q=${encodeURIComponent(finalQuery)}`);
      const scryfallResponse = await response.json();
      const cards: ScryfallCard[] = scryfallResponse.data || [];
      setSearchResults(cards);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchPredictiveOptions = async (userInput: string) => {
    if (!userInput) {
      setPredictiveOptions([]);
      return;
    }
    setIsPredictiveLoading(true);
    try {

      const response = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(userInput)}`
      );
      const responseJson = await response.json();
      setPredictiveOptions(responseJson.data || []);
    } finally {
      setIsPredictiveLoading(false);
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

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Card Database</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={"center"}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1.5, whiteSpace: "nowrap" }}>
              Colors
            </Typography>
            <ToggleButtonGroup
              value={selectedColors}
              onChange={(_e, next) => setSelectedColors(next ?? [])}
              size="small"
              aria-label="colors"
            >
              <ToggleButton value="W" aria-label="white">W</ToggleButton>
              <ToggleButton value="U" aria-label="blue">U</ToggleButton>
              <ToggleButton value="B" aria-label="black">B</ToggleButton>
              <ToggleButton value="R" aria-label="red">R</ToggleButton>
              <ToggleButton value="G" aria-label="green">G</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", minWidth: 240 }}>
            <Typography variant="body2" sx={{ mr: 1.5, whiteSpace: "nowrap" }}>
              Mana Value
            </Typography>
            <Box sx={{ px: 1, flex: 1, minWidth: 160 }}>
              <Slider
                value={cmcRange}
                min={0}
                max={20}
                step={1}
                onChange={(_e, next) => setCmcRange(next as [number, number])}
                valueLabelDisplay="auto"
                getAriaLabel={() => "Mana value range"}
              />
            </Box>
          </Box>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="set-filter-label">Set</InputLabel>
            <Select
              labelId="set-filter-label"
              label="Set"
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
            >
              {SET_OPTIONS.map((opt) => (
                <MenuItem key={opt.code} value={opt.code}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="type-filter-label">Card Type</InputLabel>
          <Select
            labelId="type-filter-label"
            label="Card Type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <MenuItem value="any">Any</MenuItem>
            <MenuItem value="creature">Creature</MenuItem>
            <MenuItem value="instant">Instant</MenuItem>
            <MenuItem value="sorcery">Sorcery</MenuItem>
            <MenuItem value="artifact">Artifact</MenuItem>
            <MenuItem value="enchantment">Enchantment</MenuItem>
            <MenuItem value="planeswalker">Planeswalker</MenuItem>
            <MenuItem value="land">Land</MenuItem>
          </Select>
        </FormControl>
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

        <Autocomplete
          freeSolo
          options={predictiveOptions}
          loading={isPredictiveLoading}
          inputValue={scryfallQuery}
          onInputChange={(_event, newInputValue) => {
            setScryfallQuery(newInputValue);
            if (predictiveDebounceId) window.clearTimeout(predictiveDebounceId);
            const timeoutId = window.setTimeout(() => {
              fetchPredictiveOptions(newInputValue);
            }, 250);
            setPredictiveDebounceId(timeoutId);
          }}
          onChange={(_event, selectedValue) => {
            if (!selectedValue) return;
            setScryfallQuery(selectedValue);
            searchCards();
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Search cards… (e.g. t:instant cmc<=2)"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  searchCards();
                }
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isPredictiveLoading ? <CircularProgress size={18} /> : null}
                    {params.InputProps.endAdornment}
                    <IconButton
                      aria-label="search"
                      onClick={(e) => {
                        e.preventDefault();
                        searchCards();
                      }}
                      edge="end"
                    >
                      <SearchIcon />
                    </IconButton>
                  </>
                ),
              }}
            />
          )}
          sx={{ flex: 1, minWidth: 260 }}
        />
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

/* ------------------------------- DECK VIEW ------------------------------- */

const DeckView: React.FC = () => {
  const { id: deckIdParam } = useParams();
  const [deckDetails, setDeckDetails] = useState<any>(null);

  const [deckSearchQuery, setDeckSearchQuery] = useState("type:creature power>3");
  const [deckSearchResults, setDeckSearchResults] = useState<ScryfallCard[]>([]);
  const [isDeckSearching, setIsDeckSearching] = useState(false);
  const [deckSnackbarMessage, setDeckSnackbarMessage] = useState<string | null>(null);
  const [deckSelectedType, setDeckSelectedType] = useState<string>("any");
  const [deckSelectedColors, setDeckSelectedColors] = useState<string[]>([]);
  const [deckCmcRange, setDeckCmcRange] = useState<[number, number]>([0, 20]);
  const [deckSelectedSet, setDeckSelectedSet] = useState<string>("any");
  const [deckPredictiveOptions, setDeckPredictiveOptions] = useState<string[]>([]);
  const [isDeckPredictiveLoading, setIsDeckPredictiveLoading] = useState(false);
  const [deckPredictiveDebounceId, setDeckPredictiveDebounceId] = useState<number | null>(null);

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


  useEffect(() => {
    return () => {
      if (deckPredictiveDebounceId) window.clearTimeout(deckPredictiveDebounceId);
    };
  }, [deckPredictiveDebounceId]);

  const searchCardsForDeck = async () => {
    setIsDeckSearching(true);
    try {
      const finalDeckQuery = buildQueryWithFilters(deckSearchQuery, {
        type: deckSelectedType,
        colors: deckSelectedColors,
        cmc: deckCmcRange,
        setCode: deckSelectedSet,
      });
      const response = await fetch(`/api/scryfall/search?q=${encodeURIComponent(finalDeckQuery)}`);
      const scryfallResponse = await response.json();
      const cards: ScryfallCard[] = scryfallResponse.data || [];
      setDeckSearchResults(cards);
    } finally {
      setIsDeckSearching(false);
    }
  };

  const fetchDeckPredictiveOptions = async (userInput: string) => {
    if (!userInput) {
      setDeckPredictiveOptions([]);
      return;
    }
    setIsDeckPredictiveLoading(true);
    try {

      const response = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(userInput)}`
      );
      const responseJson = await response.json();
      setDeckPredictiveOptions(responseJson.data || []);
    } finally {
      setIsDeckPredictiveLoading(false);
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

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="deck-type-filter-label">Card Type</InputLabel>
        <Select
          labelId="deck-type-filter-label"
          label="Card Type"
          value={deckSelectedType}
          onChange={(e) => setDeckSelectedType(e.target.value)}
        >
          <MenuItem value="any">Any</MenuItem>
          <MenuItem value="creature">Creature</MenuItem>
          <MenuItem value="instant">Instant</MenuItem>
          <MenuItem value="sorcery">Sorcery</MenuItem>
          <MenuItem value="artifact">Artifact</MenuItem>
          <MenuItem value="enchantment">Enchantment</MenuItem>
          <MenuItem value="planeswalker">Planeswalker</MenuItem>
          <MenuItem value="land">Land</MenuItem>
        </Select>
      </FormControl>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems="center"
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" sx={{ mr: 1.5, whiteSpace: "nowrap" }}>
            Colors
          </Typography>
          <ToggleButtonGroup
            value={deckSelectedColors}
            onChange={(_e, next) => setDeckSelectedColors(next ?? [])}
            size="small"
            aria-label="colors"
          >
            <ToggleButton value="W" aria-label="white">W</ToggleButton>
            <ToggleButton value="U" aria-label="blue">U</ToggleButton>
            <ToggleButton value="B" aria-label="black">B</ToggleButton>
            <ToggleButton value="R" aria-label="red">R</ToggleButton>
            <ToggleButton value="G" aria-label="green">G</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", minWidth: 240 }}>
          <Typography variant="body2" sx={{ mr: 1.5, whiteSpace: "nowrap" }}>
            Mana Value
          </Typography>
          <Box sx={{ px: 1, flex: 1, minWidth: 160 }}>
            <Slider
              value={deckCmcRange}
              min={0}
              max={20}
              step={1}
              onChange={(_e, next) => setDeckCmcRange(next as [number, number])}
              valueLabelDisplay="auto"
              getAriaLabel={() => "Mana value range"}
            />
          </Box>
        </Box>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="deck-set-filter-label">Set</InputLabel>
          <Select
            labelId="deck-set-filter-label"
            label="Set"
            value={deckSelectedSet}
            onChange={(e) => setDeckSelectedSet(e.target.value)}
          >
            {SET_OPTIONS.map((opt) => (
              <MenuItem key={opt.code} value={opt.code}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Autocomplete
        freeSolo
        options={deckPredictiveOptions}
        loading={isDeckPredictiveLoading}
        inputValue={deckSearchQuery}
        onInputChange={(_event, newInputValue) => {
          setDeckSearchQuery(newInputValue);
          if (deckPredictiveDebounceId) window.clearTimeout(deckPredictiveDebounceId);
          const timeoutId = window.setTimeout(() => {
            fetchDeckPredictiveOptions(newInputValue);
          }, 250);
          setDeckPredictiveDebounceId(timeoutId);
        }}
        onChange={(_event, selectedValue) => {
          if (!selectedValue) return;
          setDeckSearchQuery(selectedValue);
          searchCardsForDeck();
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="Search cards to add… (e.g. t:instant cmc<=2)"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSubmitDeckSearch(event as unknown as React.FormEvent<HTMLFormElement>);
              }
            }}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isDeckPredictiveLoading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                  <IconButton
                    aria-label="search"
                    onClick={(e) => {
                      e.preventDefault();
                      searchCardsForDeck();
                    }}
                    edge="end"
                  >
                    <SearchIcon />
                  </IconButton>
                </>
              ),
            }}
          />
        )}
        sx={{ minHeight: 48 }}
      />

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
