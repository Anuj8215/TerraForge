import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Table, TableBody,
  TableCell, TableHead, TableRow, Button, TextField,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Chip, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Layout from "../components/Layout/Layout";
import EmptyState from "../components/common/EmptyState";
import { fetchSecrets, writeSecret, deleteSecret } from "../store/slices/vaultSlice";
import { fetchProject } from "../store/slices/projectsSlice";

const AWS_PRESETS = [
  { key: "aws_access_key_id", label: "AWS Access Key ID" },
  { key: "aws_secret_access_key", label: "AWS Secret Access Key" },
  { key: "aws_session_token", label: "AWS Session Token (optional)" },
];

export default function Secrets() {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { current: project } = useSelector((s) => s.projects);
  const { secretsByProject, loading, error } = useSelector((s) => s.vault);
  const secrets = secretsByProject[projectId] || [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key: "", value: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    dispatch(fetchProject(projectId));
    dispatch(fetchSecrets(projectId));
  }, [projectId, dispatch]);

  const handleWrite = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await dispatch(writeSecret({ projectId, key: form.key, value: form.value })).unwrap();
      setOpen(false);
      setForm({ key: "", value: "" });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (key) => dispatch(deleteSecret({ projectId, key }));

  const handlePreset = (key) => {
    setForm({ key, value: "" });
    setOpen(true);
  };

  return (
    <Layout title="Secrets">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/projects/${projectId}`)}>
          {project?.name || "Project"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>Project Secrets</Typography>
          <Typography variant="body2" color="text.secondary">
            Stored in HashiCorp Vault · Injected as env vars during Terraform runs
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Secret
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            AWS Credential Shortcuts
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {AWS_PRESETS.map((p) => (
              <Chip
                key={p.key}
                label={p.label}
                icon={<LockIcon />}
                onClick={() => handlePreset(p.key)}
                variant="outlined"
                color="primary"
                clickable
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}><CircularProgress /></Box>
      ) : secrets.length === 0 ? (
        <EmptyState
          icon={<LockIcon />}
          title="No secrets stored"
          description="Add your AWS credentials to enable real infrastructure deployments"
          actionLabel="Add AWS Credentials"
          onAction={() => handlePreset("aws_access_key_id")}
        />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Type</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {secrets.map((secret) => (
                <TableRow key={secret.key}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                      {secret.key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {secret.is_sensitive
                        ? <VisibilityOffIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        : null}
                      <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                        {secret.value}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={secret.is_sensitive ? "sensitive" : "plain"}
                      size="small"
                      color={secret.is_sensitive ? "warning" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete secret">
                      <IconButton color="error" size="small" onClick={() => handleDelete(secret.key)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockIcon color="primary" /> Add Secret
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <TextField
            label="Key" value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            helperText="e.g. aws_access_key_id (lowercase, no spaces)"
          />
          <TextField
            label="Value" value={form.value} type="password"
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            helperText="Value is encrypted at rest in Vault"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained" onClick={handleWrite}
            disabled={!form.key || !form.value || saving}
            startIcon={saving ? <CircularProgress size={14} /> : <LockIcon />}
          >
            Save to Vault
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
