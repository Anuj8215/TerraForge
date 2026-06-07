import { Box, Card, CardActionArea, CardContent, Typography, Chip } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import FolderIcon from "@mui/icons-material/Folder";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

const SERVICES = [
  {
    type: "ec2",
    label: "EC2 Instance",
    description: "Virtual server in the cloud",
    icon: <StorageIcon />,
    tags: ["Compute"],
  },
  {
    type: "s3",
    label: "S3 Bucket",
    description: "Object storage with versioning and encryption",
    icon: <FolderIcon />,
    tags: ["Storage"],
  },
  {
    type: "vpc",
    label: "VPC + Subnets",
    description: "Isolated virtual network with public and private subnets",
    icon: <AccountTreeIcon />,
    tags: ["Networking"],
  },
];

export default function ServiceSelector({ onSelect }) {
  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {SERVICES.map((svc) => (
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
  );
}
