import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { metricsApi } from "../../api/metrics";

export const fetchMetrics = createAsyncThunk("metrics/fetch", async () => {
  const res = await metricsApi.get();
  return res.data;
});

const metricsSlice = createSlice({
  name: "metrics",
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetrics.pending, (state) => { state.loading = true; })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default metricsSlice.reducer;
