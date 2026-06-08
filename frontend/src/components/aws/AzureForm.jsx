import { Box, TextField, MenuItem, Typography } from "@mui/material";

const LOCATIONS = ["East US", "West US 2", "West Europe", "Southeast Asia", "Australia East"];
const KINDS = [
  { value: "resource_group", label: "Resource Group" },
  { value: "storage_account", label: "Storage Account" },
];
const REPLICATION_TYPES = ["LRS", "GRS", "ZRS", "RAGRS"];

const DEFAULT = {
  kind: "resource_group",
  location: "East US",
  account_tier: "Standard",
  replication_type: "LRS",
};

export default function AzureForm({ config = DEFAULT, onChange }) {
  const set = (key, value) => onChange({ ...DEFAULT, ...config, [key]: value });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">Azure Resource Configuration</Typography>
      <TextField
        select label="Resource Kind" value={config.kind || DEFAULT.kind}
        onChange={(e) => set("kind", e.target.value)}
      >
        {KINDS.map((k) => <MenuItem key={k.value} value={k.value}>{k.label}</MenuItem>)}
      </TextField>
      <TextField
        select label="Location" value={config.location || DEFAULT.location}
        onChange={(e) => set("location", e.target.value)}
      >
        {LOCATIONS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
      </TextField>
      {config.kind === "storage_account" && (
        <>
          <TextField
            select label="Replication Type" value={config.replication_type || DEFAULT.replication_type}
            onChange={(e) => set("replication_type", e.target.value)}
          >
            {REPLICATION_TYPES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField
            label="Resource Group Name" value={config.resource_group_name || ""}
            onChange={(e) => set("resource_group_name", e.target.value)}
            helperText="The resource group this storage account belongs to"
          />
        </>
      )}
    </Box>
  );
}

AzureForm.defaultConfig = DEFAULT;
