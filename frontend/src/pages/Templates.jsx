import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button,
  Chip, CircularProgress, IconButton, Tooltip, Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LockIcon from "@mui/icons-material/Lock";
import Layout from "../components/Layout/Layout";
import EmptyState from "../components/common/EmptyState";
import { fetchTemplates, deleteTemplate } from "../store/slices/templatesSlice";

const PROVIDER_COLORS = { aws: "#FF9900", azure: "#0078D4", gcp: "#4285F4" };

export default function Templates() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, error } = useSelector((s) => s.templates);
  const { items: projects } = useSelector((s) => s.projects);

  useEffect(() => { dispatch(fetchTemplates()); }, [dispatch]);

  const handleUseTemplate = (template) => {
    navigate("/projects", { state: { template } });
  };

  const handleDelete = (id) => dispatch(deleteTemplate(id));

  const builtins = items.filter((t) => t.is_builtin);
  const custom = items.filter((t) => !t.is_builtin);

  return (
    <Layout title="Templates">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<AutoAwesomeIcon />}
          title="No templates"
          description="Templates are auto-created when you save a deployment configuration"
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {builtins.length > 0 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <AutoAwesomeIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Built-in Templates</Typography>
              </Box>
              <Grid container spacing={2}>
                {builtins.map((t) => <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />)}
              </Grid>
            </Box>
          )}

          {custom.length > 0 && (
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Your Templates</Typography>
              <Grid container spacing={2}>
                {custom.map((t) => (
                  <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} onDelete={handleDelete} />
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Layout>
  );
}

function TemplateCard({ template, onUse, onDelete }) {
  const providerColor = PROVIDER_COLORS[template.provider] || "#7C3AED";
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Chip label={template.provider.toUpperCase()} size="small" sx={{ bgcolor: providerColor, color: "white", fontWeight: 700 }} />
            {template.is_builtin && (
              <Chip label="Built-in" size="small" icon={<LockIcon />} variant="outlined" />
            )}
          </Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>{template.name}</Typography>
          {template.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
              {template.description}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
            {template.resources.map((r, i) => (
              <Chip key={i} label={r.type} size="small" variant="outlined" color="primary" />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {template.tags?.map((tag) => (
              <Chip key={tag} label={tag} size="small" sx={{ fontSize: 10 }} />
            ))}
          </Box>
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0, justifyContent: "space-between" }}>
          <Button
            variant="contained" size="small" startIcon={<RocketLaunchIcon />}
            onClick={() => onUse(template)}
          >
            Use Template
          </Button>
          {onDelete && !template.is_builtin && (
            <Tooltip title="Delete template">
              <IconButton size="small" color="error" onClick={() => onDelete(template.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      </Card>
    </Grid>
  );
}
