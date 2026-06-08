import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { variablesApi } from "../../api/variables";

export const fetchVariables = createAsyncThunk("variables/fetchAll", async (projectId) => {
  const res = await variablesApi.list(projectId);
  return { projectId, ...res.data };
});

export const createVariable = createAsyncThunk("variables/create", async ({ projectId, data }) => {
  const res = await variablesApi.create(projectId, data);
  return { projectId, variable: res.data };
});

export const deleteVariable = createAsyncThunk("variables/delete", async ({ projectId, variableId }) => {
  await variablesApi.remove(projectId, variableId);
  return { projectId, variableId };
});

const variablesSlice = createSlice({
  name: "variables",
  initialState: { byProject: {}, loading: false, error: null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVariables.pending, (state) => { state.loading = true; })
      .addCase(fetchVariables.fulfilled, (state, action) => {
        state.loading = false;
        state.byProject[action.payload.projectId] = action.payload.items;
      })
      .addCase(fetchVariables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createVariable.fulfilled, (state, action) => {
        const { projectId, variable } = action.payload;
        const list = state.byProject[projectId] || [];
        state.byProject[projectId] = [...list, variable];
      })
      .addCase(deleteVariable.fulfilled, (state, action) => {
        const { projectId, variableId } = action.payload;
        const list = state.byProject[projectId] || [];
        state.byProject[projectId] = list.filter((v) => v.id !== variableId);
      });
  },
});

export const { clearError } = variablesSlice.actions;
export default variablesSlice.reducer;
