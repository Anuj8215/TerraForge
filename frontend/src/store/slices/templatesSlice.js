import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { templatesApi } from "../../api/templates";

export const fetchTemplates = createAsyncThunk("templates/fetchAll", async (params) => {
  const res = await templatesApi.list(params);
  return res.data;
});

export const createTemplate = createAsyncThunk("templates/create", async (data) => {
  const res = await templatesApi.create(data);
  return res.data;
});

export const deleteTemplate = createAsyncThunk("templates/delete", async (id) => {
  await templatesApi.remove(id);
  return id;
});

const templatesSlice = createSlice({
  name: "templates",
  initialState: { items: [], total: 0, loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearError } = templatesSlice.actions;
export default templatesSlice.reducer;
