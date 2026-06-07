import { configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./slices/projectsSlice";
import deploymentsReducer from "./slices/deploymentsSlice";

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    deployments: deploymentsReducer,
  },
});
