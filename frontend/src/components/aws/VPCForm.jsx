import { Box, TextField, Typography, Switch, FormControlLabel } from "@mui/material";

const DEFAULT = {
  cidr_block: "10.0.0.0/16",
  public_subnet_cidr: "10.0.1.0/24",
  private_subnet_cidr: "10.0.2.0/24",
  availability_zone: "us-east-1a",
  enable_dns: true,
  create_igw: true,
};

export default function VPCForm({ config = DEFAULT, onChange }) {
  const set = (key, value) => onChange({ ...DEFAULT, ...config, [key]: value });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">VPC Configuration</Typography>
      <TextField
        label="VPC CIDR Block" value={config.cidr_block || DEFAULT.cidr_block}
        onChange={(e) => set("cidr_block", e.target.value)}
        helperText="e.g. 10.0.0.0/16"
      />
      <TextField
        label="Public Subnet CIDR" value={config.public_subnet_cidr || DEFAULT.public_subnet_cidr}
        onChange={(e) => set("public_subnet_cidr", e.target.value)}
      />
      <TextField
        label="Private Subnet CIDR" value={config.private_subnet_cidr || DEFAULT.private_subnet_cidr}
        onChange={(e) => set("private_subnet_cidr", e.target.value)}
      />
      <TextField
        label="Availability Zone" value={config.availability_zone || DEFAULT.availability_zone}
        onChange={(e) => set("availability_zone", e.target.value)}
      />
      <FormControlLabel
        control={
          <Switch
            checked={config.enable_dns ?? DEFAULT.enable_dns}
            onChange={(e) => set("enable_dns", e.target.checked)}
          />
        }
        label="Enable DNS Support & Hostnames"
      />
      <FormControlLabel
        control={
          <Switch
            checked={config.create_igw ?? DEFAULT.create_igw}
            onChange={(e) => set("create_igw", e.target.checked)}
          />
        }
        label="Create Internet Gateway + Public Route Table"
      />
    </Box>
  );
}

VPCForm.defaultConfig = DEFAULT;
