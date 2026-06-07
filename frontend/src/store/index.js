import { configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./slices/projectsSlice";
import deploymentsReducer from "./slices/deploymentsSlice";
import vaultReducer from "./slices/vaultSlice";

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    deployments: deploymentsReducer,
    vault: vaultReducer,
  },
});
