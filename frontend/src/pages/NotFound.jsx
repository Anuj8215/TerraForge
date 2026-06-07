import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 2 }}>
      <Typography variant="h3" fontWeight={700}>404</Typography>
      <Typography color="text.secondary">Page not found</Typography>
      <Button variant="contained" onClick={() => navigate("/")}>Go Home</Button>
    </Box>
  );
}
