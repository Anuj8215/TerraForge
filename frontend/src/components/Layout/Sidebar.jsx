import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import StorageIcon from "@mui/icons-material/Storage";

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { label: "Projects", icon: <FolderIcon />, path: "/projects" },
  { label: "Deployments", icon: <RocketLaunchIcon />, path: "/deployments" },
  { label: "Resources", icon: <StorageIcon />, path: "/resources" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="h6" fontWeight={700} color="primary.light">
          TerraForge
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Infrastructure Automation
        </Typography>
      </Box>

      <Divider />

      <List sx={{ px: 1, pt: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={active}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "white",
                  "& .MuiListItemIcon-root": { color: "white" },
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
