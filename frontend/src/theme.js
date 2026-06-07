import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7C3AED",
      light: "#A78BFA",
      dark: "#5B21B6",
    },
    secondary: {
      main: "#10B981",
    },
    background: {
      default: "#0F0F1A",
      paper: "#1A1A2E",
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#94A3B8",
    },
    divider: "#2D2D44",
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #2D2D44",
        },
      },
    },
  },
});
