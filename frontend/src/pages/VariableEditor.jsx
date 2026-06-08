import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Typography, Button, Card, CardContent, Table, TableBody,
  TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Switch, FormControlLabel,
  IconButton, Chip, Alert, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CodeIcon from "@mui/icons-material/Code";
import Layout from "../components/Layout/Layout";
import EmptyState from "../components/common/EmptyState";
import { fetchVariables, createVariable, deleteVariable } from "../store/slices/variablesSlice";
import { fetchProject } from "../store/slices/projectsSlice";

const VAR_TYPES = [
  { value: "string", label: "string" },
  { value: "number", label: "number" },
  { value: "bool", label: "bool" },
  { value: "list(string)", label: "list(string)" },
  { value: "map(string)", label: "map(string)" },
];

const ENV_OPTIONS = ["", "dev", "staging", "prod"];

const DEFAULT_FORM = { name: "", type: "string", description: "", default_value: "", validation_condition: "", validation_message: "", is_sensitive: false, environment: "" };

export default function VariableEditor() {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: project } = useSelector((s) => s.projects);
  const { byProject, loading, error } = useSelector((s) => s.variables);
  const variables = byProject[projectId] || [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    dispatch(fetchProject(projectId));
    dispatch(fetchVariables(projectId));
  }, [projectId, dispatch]);

  const handleCreate = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await dispatch(createVariable({ projectId, data: form })).unwrap();
      setOpen(false);
      setForm(DEFAULT_FORM);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const generatePreview = () => {
    return variables.map((v) => {
      let block = `variable "${v.name}" {\n`;
      if (v.description) block += `  description = "${v.description}"\n`;
      block += `  type        = ${v.type}\n`;
      if (v.is_sensitive) block += `  sensitive   = true\n`;
      if (v.default_value !== null && v.default_value !== undefined && v.default_value !== "") {
        const quoted = v.type === "string" ? `"${v.default_value}"` : v.default_value;
        block += `  default     = ${quoted}\n`;
      }
      if (v.validation_condition) {
        block += `\n  validation {\n`;
        block += `    condition     = ${v.validation_condition}\n`;
        block += `    error_message = "${v.validation_message || "Invalid value."}"\n`;
        block += `  }\n`;
      }
      block += `}`;
      return block;
    }).join("\n\n");
  };

  return (
    <Layout title="Variable Manager">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/projects/${projectId}`)}>
          {project?.name || "Project"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>Terraform Variables</Typography>
          <Typography variant="body2" color="text.secondary">
            Defines variables.tf — injected into every deployment for this project
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {variables.length > 0 && (
            <Button variant="outlined" startIcon={<CodeIcon />} onClick={() => setPreview(true)}>
              Preview variables.tf
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Add Variable
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}><CircularProgress /></Box>
      ) : variables.length === 0 ? (
        <EmptyState
          icon={<CodeIcon />}
          title="No variables defined"
          description="Variables let you parameterize Terraform configurations (e.g. instance_type, environment name)"
          actionLabel="Add Variable"
          onAction={() => setOpen(true)}
        />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Default</TableCell>
                <TableCell>Environment</TableCell>
                <TableCell>Flags</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {variables.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{v.name}</Typography>
                    {v.description && <Typography variant="caption" color="text.secondary">{v.description}</Typography>}
                  </TableCell>
                  <TableCell><Chip label={v.type} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                      {v.default_value ?? <em>none</em>}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {v.environment
                      ? <Chip label={v.environment} size="small" color="info" />
                      : <Typography variant="caption" color="text.secondary">all</Typography>}
                  </TableCell>
                  <TableCell>
                    {v.is_sensitive && <Chip label="sensitive" size="small" color="warning" />}
                    {v.validation_condition && <Chip label="validated" size="small" color="success" sx={{ ml: 0.5 }} />}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => dispatch(deleteVariable({ projectId, variableId: v.id }))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Variable</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <TextField label="Variable Name" value={form.name} required helperText="Lowercase, no spaces (e.g. instance_type)" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {VAR_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label="Default Value (optional)" value={form.default_value} onChange={(e) => setForm({ ...form, default_value: e.target.value })} helperText="Leave blank for required variable (no default)" />
          <TextField select label="Environment" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} helperText="Restrict to a specific environment or leave blank for all">
            {ENV_OPTIONS.map((e) => <MenuItem key={e} value={e}>{e || "All environments"}</MenuItem>)}
          </TextField>
          <TextField label="Validation Condition (optional)" value={form.validation_condition} onChange={(e) => setForm({ ...form, validation_condition: e.target.value })} helperText='e.g. contains(["t3.micro","t3.small"], var.instance_type)' />
          {form.validation_condition && (
            <TextField label="Validation Error Message" value={form.validation_message} onChange={(e) => setForm({ ...form, validation_message: e.target.value })} />
          )}
          <FormControlLabel control={<Switch checked={form.is_sensitive} onChange={(e) => setForm({ ...form, is_sensitive: e.target.checked })} />} label="Sensitive (value hidden in logs)" />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || saving} startIcon={saving && <CircularProgress size={14} />}>
            Add Variable
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={preview} onClose={() => setPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CodeIcon color="primary" /> Generated variables.tf
        </DialogTitle>
        <DialogContent>
          <Box sx={{ bgcolor: "#0d1117", borderRadius: 1, p: 2, fontFamily: "monospace", fontSize: 12, color: "#c9d1d9", whiteSpace: "pre", overflowX: "auto" }}>
            {generatePreview()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
