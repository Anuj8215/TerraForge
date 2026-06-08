import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Divider,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { login, clearError } from "../store/slices/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(form));
    if (!result.error) navigate("/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Box
              sx={{
                width: 48, height: 48, borderRadius: "50%",
                bgcolor: "primary.main", display: "flex",
                alignItems: "center", justifyContent: "center", mb: 1.5,
              }}
            >
              <LockOutlinedIcon sx={{ color: "white" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="primary.light">TerraForge</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email" type="email" required autoFocus
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Password" type="password" required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Button
              type="submit" variant="contained" size="large" fullWidth
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
            >
              Sign In
            </Button>
          </Box>

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            No account?{" "}
            <Typography component={Link} to="/register" variant="body2" color="primary.light">
              Register here
            </Typography>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
