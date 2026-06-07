import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, CardActionArea, Typography, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import Layout from "../components/Layout/Layout";
import StatusChip from "../components/common/StatusChip";
import EmptyState from "../components/common/EmptyState";
import { fetchProjects, createProject, deleteProject } from "../store/slices/projectsSlice";

const PROVIDERS = ["aws", "azure", "gcp"];
const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "ap-northeast-1"];

export default function Projects() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((s) => s.projects);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", provider: "aws", region: "us-east-1" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  const handleCreate = async () => {
    setCreating(true);
    await dispatch(createProject(form));
    setCreating(false);
    setOpen(false);
    setForm({ name: "", description: "", provider: "aws", region: "us-east-1" });
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await dispatch(deleteProject(id));
  };

  return (
    <Layout title="Projects">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          New Project
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FolderIcon />}
          title="No projects yet"
          description="Create your first infrastructure project"
          actionLabel="New Project"
          onAction={() => setOpen(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {items.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/projects/${project.id}`)}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>{project.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.provider.toUpperCase()} · {project.region}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={(e) => handleDelete(e, project.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    {project.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {project.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2 }}>
                      <StatusChip status={project.status} />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label="Project Name" value={form.name} required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Description" value={form.description} multiline rows={2}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            select label="Cloud Provider" value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          >
            {PROVIDERS.map((p) => <MenuItem key={p} value={p}>{p.toUpperCase()}</MenuItem>)}
          </TextField>
          <TextField
            select label="Region" value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          >
            {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained" onClick={handleCreate}
            disabled={!form.name || creating}
            startIcon={creating && <CircularProgress size={14} />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
