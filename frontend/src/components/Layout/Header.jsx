import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, Chip, IconButton, Tooltip, Avatar } from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "../../store/slices/authSlice";

const ROLE_COLORS = { admin: "error", operator: "warning", viewer: "default" };

export default function Header({ title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
      }}
    >
      <Toolbar>
        <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CloudIcon fontSize="small" color="primary" />
          <Chip label="AWS" size="small" color="primary" variant="outlined" />

          {user && (
            <>
              <Chip
                label={user.role}
                size="small"
                color={ROLE_COLORS[user.role] || "default"}
                variant="outlined"
              />
              <Tooltip title={`${user.email} — click to logout`}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }} onClick={handleLogout}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: 12 }}>
                    {user.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                    {user.username}
                  </Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton size="small" color="inherit" onClick={handleLogout}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
