import { Box, TextField, MenuItem, Typography, Switch, FormControlLabel } from "@mui/material";

const INSTANCE_TYPES = ["t3.micro", "t3.small", "t3.medium", "t3.large", "m5.large", "c5.large"];

const DEFAULT = {
  instance_type: "t3.micro",
  ami: "ami-0c55b159cbfafe1f0",
  volume_size: 20,
  associate_public_ip: true,
  key_name: "",
};

export default function EC2Form({ config = DEFAULT, onChange }) {
  const set = (key, value) => onChange({ ...DEFAULT, ...config, [key]: value });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">EC2 Instance Configuration</Typography>
      <TextField
        select label="Instance Type" value={config.instance_type || DEFAULT.instance_type}
        onChange={(e) => set("instance_type", e.target.value)}
      >
        {INSTANCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
      </TextField>
      <TextField
        label="AMI ID" value={config.ami || DEFAULT.ami}
        onChange={(e) => set("ami", e.target.value)}
        helperText="Amazon Machine Image ID"
      />
      <TextField
        label="Root Volume Size (GB)" type="number" value={config.volume_size || DEFAULT.volume_size}
        onChange={(e) => set("volume_size", parseInt(e.target.value))}
        inputProps={{ min: 8, max: 1000 }}
      />
      <TextField
        label="Key Pair Name (optional)" value={config.key_name || ""}
        onChange={(e) => set("key_name", e.target.value)}
        helperText="SSH key pair for remote access"
      />
      <FormControlLabel
        control={
          <Switch
            checked={config.associate_public_ip ?? DEFAULT.associate_public_ip}
            onChange={(e) => set("associate_public_ip", e.target.checked)}
          />
        }
        label="Associate Public IP"
      />
    </Box>
  );
}

EC2Form.defaultConfig = DEFAULT;
