import { Box, TextField, MenuItem, Typography, Switch, FormControlLabel } from "@mui/material";

const MACHINE_TYPES = ["e2-micro", "e2-small", "e2-medium", "n1-standard-1", "n1-standard-2"];
const GCP_ZONES = ["us-central1-a", "us-east1-b", "europe-west1-b", "asia-east1-a"];
const GCS_LOCATIONS = ["US", "EU", "ASIA", "us-central1", "europe-west1"];
const STORAGE_CLASSES = ["STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"];
const KINDS = [
  { value: "compute_instance", label: "Compute Instance (VM)" },
  { value: "storage_bucket", label: "Cloud Storage Bucket" },
];

const DEFAULT = {
  kind: "compute_instance",
  machine_type: "e2-micro",
  zone: "us-central1-a",
  image: "debian-cloud/debian-11",
  disk_size: 20,
  location: "US",
  storage_class: "STANDARD",
  versioning: false,
};

export default function GCPForm({ config = DEFAULT, onChange }) {
  const set = (key, value) => onChange({ ...DEFAULT, ...config, [key]: value });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">GCP Resource Configuration</Typography>
      <TextField
        select label="Resource Kind" value={config.kind || DEFAULT.kind}
        onChange={(e) => set("kind", e.target.value)}
      >
        {KINDS.map((k) => <MenuItem key={k.value} value={k.value}>{k.label}</MenuItem>)}
      </TextField>
      {(config.kind === "compute_instance" || !config.kind) && (
        <>
          <TextField
            select label="Machine Type" value={config.machine_type || DEFAULT.machine_type}
            onChange={(e) => set("machine_type", e.target.value)}
          >
            {MACHINE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField
            select label="Zone" value={config.zone || DEFAULT.zone}
            onChange={(e) => set("zone", e.target.value)}
          >
            {GCP_ZONES.map((z) => <MenuItem key={z} value={z}>{z}</MenuItem>)}
          </TextField>
          <TextField
            label="Boot Image" value={config.image || DEFAULT.image}
            onChange={(e) => set("image", e.target.value)}
          />
          <TextField
            label="Disk Size (GB)" type="number" value={config.disk_size || DEFAULT.disk_size}
            onChange={(e) => set("disk_size", parseInt(e.target.value))}
          />
        </>
      )}
      {config.kind === "storage_bucket" && (
        <>
          <TextField
            select label="Location" value={config.location || DEFAULT.location}
            onChange={(e) => set("location", e.target.value)}
          >
            {GCS_LOCATIONS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </TextField>
          <TextField
            select label="Storage Class" value={config.storage_class || DEFAULT.storage_class}
            onChange={(e) => set("storage_class", e.target.value)}
          >
            {STORAGE_CLASSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={config.versioning ?? false}
                onChange={(e) => set("versioning", e.target.checked)}
              />
            }
            label="Enable Versioning"
          />
        </>
      )}
    </Box>
  );
}

GCPForm.defaultConfig = DEFAULT;
