import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deploymentsApi } from "../../api/deployments";
import { terraformApi } from "../../api/terraform";

export const fetchDeployments = createAsyncThunk("deployments/fetchAll", async (params) => {
  const res = await deploymentsApi.list(params);
  return res.data;
});

export const fetchDeployment = createAsyncThunk("deployments/fetchOne", async (id) => {
  const res = await deploymentsApi.get(id);
  return res.data;
});

export const triggerPlan = createAsyncThunk("deployments/plan", async (data) => {
  const res = await terraformApi.plan(data);
  return res.data;
});

export const triggerApply = createAsyncThunk("deployments/apply", async (data) => {
  const res = await terraformApi.apply(data);
  return res.data;
});

export const triggerDestroy = createAsyncThunk("deployments/destroy", async (data) => {
  const res = await terraformApi.destroy(data);
  return res.data;
});

const deploymentsSlice = createSlice({
  name: "deployments",
  initialState: {
    items: [],
    total: 0,
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent: (state) => { state.current = null; },
    updateDeploymentInList: (state, action) => {
      const idx = state.items.findIndex((d) => d.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
      if (state.current?.id === action.payload.id) state.current = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeployments.pending, (state) => { state.loading = true; })
      .addCase(fetchDeployments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchDeployments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchDeployment.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(triggerPlan.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(triggerApply.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(triggerDestroy.fulfilled, (state, action) => { state.items.unshift(action.payload); });
  },
});

export const { clearCurrent, updateDeploymentInList } = deploymentsSlice.actions;
export default deploymentsSlice.reducer;
