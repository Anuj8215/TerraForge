import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { vaultApi } from "../../api/vault";

export const fetchSecrets = createAsyncThunk("vault/fetchSecrets", async (projectId) => {
  const res = await vaultApi.listSecrets(projectId);
  return { projectId, ...res.data };
});

export const writeSecret = createAsyncThunk("vault/writeSecret", async ({ projectId, key, value }) => {
  const res = await vaultApi.writeSecret(projectId, { key, value });
  return { projectId, ...res.data };
});

export const deleteSecret = createAsyncThunk("vault/deleteSecret", async ({ projectId, key }) => {
  await vaultApi.deleteSecret(projectId, key);
  return { projectId, key };
});

const vaultSlice = createSlice({
  name: "vault",
  initialState: {
    secretsByProject: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSecrets.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSecrets.fulfilled, (state, action) => {
        state.loading = false;
        state.secretsByProject[action.payload.projectId] = action.payload.secrets;
      })
      .addCase(fetchSecrets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(writeSecret.fulfilled, (state, action) => {
        state.secretsByProject[action.payload.projectId] = action.payload.secrets;
      })
      .addCase(deleteSecret.fulfilled, (state, action) => {
        const { projectId, key } = action.payload;
        const list = state.secretsByProject[projectId];
        if (list) {
          state.secretsByProject[projectId] = list.filter((s) => s.key !== key);
        }
      });
  },
});

export const { clearError } = vaultSlice.actions;
export default vaultSlice.reducer;
