import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../../api/auth";

const TOKEN_KEY = "tf_token";

export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const res = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, res.data.access_token);
    return res.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.detail || "Login failed");
  }
});

export const register = createAsyncThunk("auth/register", async (data, { rejectWithValue }) => {
  try {
    const res = await authApi.register(data);
    localStorage.setItem(TOKEN_KEY, res.data.access_token);
    return res.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.detail || "Registration failed");
  }
});

export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const res = await authApi.me();
    return res.data;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return rejectWithValue("Session expired");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; state.error = null; };
    const handleAuth = (state, action) => {
      state.loading = false;
      state.token = action.payload.access_token;
      state.user = action.payload.user;
    };
    const handleReject = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleAuth)
      .addCase(login.rejected, handleReject)
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleAuth)
      .addCase(register.rejected, handleReject)
      .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(fetchMe.rejected, (state) => { state.token = null; state.user = null; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
