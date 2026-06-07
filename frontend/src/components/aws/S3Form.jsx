import { Box, TextField, Typography, Switch, FormControlLabel } from "@mui/material";

const DEFAULT = {
  bucket_name: "",
  versioning: false,
  force_destroy: false,
};

export default function S3Form({ config = DEFAULT, onChange }) {
  const set = (key, value) => onChange({ ...DEFAULT, ...config, [key]: value });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">S3 Bucket Configuration</Typography>
      <TextField
        label="Bucket Name" value={config.bucket_name || ""}
        onChange={(e) => set("bucket_name", e.target.value)}
        helperText="Must be globally unique across all AWS accounts. Leave blank to auto-generate."
      />
      <FormControlLabel
        control={
          <Switch
            checked={config.versioning ?? DEFAULT.versioning}
            onChange={(e) => set("versioning", e.target.checked)}
          />
        }
        label="Enable Versioning"
      />
      <FormControlLabel
        control={
          <Switch
            checked={config.force_destroy ?? DEFAULT.force_destroy}
            onChange={(e) => set("force_destroy", e.target.checked)}
          />
        }
        label="Force Destroy (delete non-empty bucket)"
      />
      <Typography variant="caption" color="text.secondary">
        AES-256 server-side encryption and public access block are always enabled.
      </Typography>
    </Box>
  );
}

S3Form.defaultConfig = DEFAULT;
