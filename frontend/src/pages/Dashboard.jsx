import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
} from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import StorageIcon from "@mui/icons-material/Storage";
import SecurityIcon from "@mui/icons-material/Security";
import apiClient from "../api/client";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/health")
      .then((res) => setHealth(res.data))
      .catch(() => setHealth({ status: "error" }))
      .finally(() => setLoading(false));
  }, []);

  const services = [
    { label: "API", icon: <CloudIcon />, status: health?.status },
    { label: "Infrastructure", icon: <StorageIcon />, status: "ready" },
    { label: "Vault", icon: <SecurityIcon />, status: "ready" },
  ];

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          TerraForge
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={0.5}>
          AWS Infrastructure Automation Platform
        </Typography>
      </Box>

      {loading ? (
        <CircularProgress color="primary" />
      ) : (
        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid item xs={12} sm={4} key={service.label}>
              <Card>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ color: "primary.main" }}>{service.icon}</Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {service.label}
                    </Typography>
                    <Chip
                      label={service.status || "unknown"}
                      size="small"
                      color={service.status === "ok" || service.status === "ready" ? "success" : "error"}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
