import { Box, TextField, MenuItem, Typography, Switch, FormControlLabel } from "@mui/material";

const AWS_REGIONS = ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"];

const DEFAULT = {
  bucket_name: "",
  versioning: false,
  force_destroy: false,
};

export default function S3Form({ config = DEFAULT, region = "", onRegionChange, onChange }) {
  const set = (key, value) => onChange({ ...DEFAULT, ...config, [key]: value });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">S3 Bucket Configuration</Typography>
      <TextField
        label="Bucket Name" value={config.bucket_name || ""}
        onChange={(e) => set("bucket_name", e.target.value)}
        helperText="Must be globally unique. Leave blank to auto-generate."
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
      {onRegionChange && (
        <TextField
          select label="Region Override (optional)" value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          helperText="Overrides the project default region — triggers a provider alias"
        >
          <MenuItem value=""><em>Use project default</em></MenuItem>
          {AWS_REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
      )}
    </Box>
  );
}

S3Form.defaultConfig = DEFAULT;
