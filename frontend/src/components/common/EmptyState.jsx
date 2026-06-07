import { Box, Typography, Button } from "@mui/material";

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <Box
      sx={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", py: 10, gap: 2, color: "text.secondary",
      }}
    >
      {icon && <Box sx={{ fontSize: 48, opacity: 0.4 }}>{icon}</Box>}
      <Typography variant="h6" color="text.secondary">{title}</Typography>
      {description && <Typography variant="body2">{description}</Typography>}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
