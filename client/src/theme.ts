import { createTheme } from "@mui/material/styles";

export const getTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === "light" ? "#7c3aed" : "#9d8cff" }, 
      secondary: { main: mode === "light" ? "#22c55e" : "#34d399" }, 
      background: {
        default: mode === "light" ? "#fafafa" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1e1e1e",
      },
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: [
        "Inter",
        "Roboto",
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Arial",
      ].join(","),
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: { transition: "transform .12s ease, box-shadow .12s ease" },
        },
      },
      MuiButton: {
        defaultProps: { variant: "contained" },
      },
    },
  });
