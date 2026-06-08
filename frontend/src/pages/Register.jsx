import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Divider,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { register as registerUser, clearError } from "../store/slices/authSlice";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", username: "", password: "", confirm: "" });
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    dispatch(clearError());
    if (form.password !== form.confirm) {
      setLocalError("Passwords do not match");
      return;
    }
    const result = await dispatch(registerUser({ email: form.email, username: form.username, password: form.password }));
    if (!result.error) navigate("/");
  };

  const displayError = localError || error;

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
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Box
              sx={{
                width: 48, height: 48, borderRadius: "50%",
                bgcolor: "primary.main", display: "flex",
                alignItems: "center", justifyContent: "center", mb: 1.5,
              }}
            >
              <PersonAddIcon sx={{ color: "white" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="primary.light">Create Account</Typography>
            <Typography variant="body2" color="text.secondary">
              First user becomes admin automatically
            </Typography>
          </Box>

          {displayError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => { setLocalError(null); dispatch(clearError()); }}>
              {displayError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email" type="email" required autoFocus
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Username" required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <TextField
              label="Password" type="password" required helperText="Minimum 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <TextField
              label="Confirm Password" type="password" required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
            <Button
              type="submit" variant="contained" size="large" fullWidth
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
            >
              Create Account
            </Button>
          </Box>

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            Already have an account?{" "}
            <Typography component={Link} to="/login" variant="body2" color="primary.light">
              Sign in
            </Typography>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
