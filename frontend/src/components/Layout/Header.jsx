import { AppBar, Toolbar, Typography, Box, Chip } from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";

export default function Header({ title }) {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
      }}
    >
      <Toolbar>
        <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CloudIcon fontSize="small" color="primary" />
          <Chip label="AWS" size="small" color="primary" variant="outlined" />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
