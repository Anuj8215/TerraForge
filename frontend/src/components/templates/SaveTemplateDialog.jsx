import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Box, Chip, Button, Alert, CircularProgress, Typography,
} from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { createTemplate } from "../../store/slices/templatesSlice";

export default function SaveTemplateDialog({ open, onClose, resources, provider, region }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: "", description: "", tagInput: "", tags: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const addTag = () => {
    const tag = form.tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag], tagInput: "" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await dispatch(createTemplate({
        name: form.name,
        description: form.description,
        provider,
        region,
        resources,
        tags: form.tags,
      })).unwrap();
      onClose();
      setForm({ name: "", description: "", tagInput: "", tags: [] });
    } catch (e) {
      setError(e.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <BookmarkIcon color="primary" /> Save as Template
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}

        <Typography variant="body2" color="text.secondary">
          Saving {resources.length} resource{resources.length !== 1 ? "s" : ""} as a reusable template.
        </Typography>

        <TextField
          label="Template Name" value={form.name} required
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextField
          label="Description" value={form.description} multiline rows={2}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Box>
          <TextField
            label="Add Tag" value={form.tagInput} size="small"
            onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            helperText="Press Enter to add"
            sx={{ mr: 1 }}
          />
          <Button size="small" onClick={addTag}>Add</Button>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
            {form.tags.map((tag) => (
              <Chip
                key={tag} label={tag} size="small"
                onDelete={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSave}
          disabled={!form.name || saving}
          startIcon={saving ? <CircularProgress size={14} /> : <BookmarkIcon />}
        >
          Save Template
        </Button>
      </DialogActions>
    </Dialog>
  );
}
