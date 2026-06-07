import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { projectsApi } from "../../api/projects";

export const fetchProjects = createAsyncThunk("projects/fetchAll", async (params) => {
  const res = await projectsApi.list(params);
  return res.data;
});

export const fetchProject = createAsyncThunk("projects/fetchOne", async (id) => {
  const res = await projectsApi.get(id);
  return res.data;
});

export const createProject = createAsyncThunk("projects/create", async (data) => {
  const res = await projectsApi.create(data);
  return res.data;
});

export const deleteProject = createAsyncThunk("projects/delete", async (id) => {
  await projectsApi.remove(id);
  return id;
});

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    items: [],
    total: 0,
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent: (state) => { state.current = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProject.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearCurrent, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;
