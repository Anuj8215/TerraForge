import { Box, Card, CardActionArea, CardContent, Typography, Chip, Divider } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import FolderIcon from "@mui/icons-material/Folder";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CloudIcon from "@mui/icons-material/Cloud";
import PublicIcon from "@mui/icons-material/Public";

const SERVICE_GROUPS = [
  {
    provider: "AWS",
    color: "#FF9900",
    services: [
      { type: "ec2", label: "EC2 Instance", description: "Virtual server in the cloud", icon: <StorageIcon />, tags: ["Compute"] },
      { type: "s3", label: "S3 Bucket", description: "Object storage with versioning & encryption", icon: <FolderIcon />, tags: ["Storage"] },
      { type: "vpc", label: "VPC + Subnets", description: "Isolated virtual network with public/private subnets", icon: <AccountTreeIcon />, tags: ["Networking"] },
    ],
  },
  {
    provider: "Azure",
    color: "#0078D4",
    services: [
      { type: "azure", label: "Azure Resource", description: "Resource Group or Storage Account", icon: <CloudIcon />, tags: ["Azure"] },
    ],
  },
  {
    provider: "GCP",
    color: "#4285F4",
    services: [
      { type: "gcp", label: "GCP Resource", description: "Compute Instance or Cloud Storage Bucket", icon: <PublicIcon />, tags: ["GCP"] },
    ],
  },
];

export default function ServiceSelector({ onSelect, projectProvider = "aws" }) {
  const relevantGroups = projectProvider === "aws"
    ? SERVICE_GROUPS
    : SERVICE_GROUPS.filter((g) => g.provider.toLowerCase() === projectProvider);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {relevantGroups.map((group) => (
        <Box key={group.provider}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Chip label={group.provider} size="small" sx={{ bgcolor: group.color, color: "white", fontWeight: 600 }} />
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {group.services.map((svc) => (
              <Card key={svc.type} sx={{ width: 200 }}>
                <CardActionArea onClick={() => onSelect(svc.type)}>
                  <CardContent>
                    <Box sx={{ color: "primary.main", mb: 1 }}>{svc.icon}</Box>
                    <Typography variant="subtitle2" fontWeight={600}>{svc.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{svc.description}</Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {svc.tags.map((t) => (
                        <Chip key={t} label={t} size="small" variant="outlined" color="primary" />
                      ))}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
          <Divider sx={{ mt: 2 }} />
        </Box>
      ))}
    </Box>
  );
}
