import { configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./slices/projectsSlice";
import deploymentsReducer from "./slices/deploymentsSlice";
import vaultReducer from "./slices/vaultSlice";
import templatesReducer from "./slices/templatesSlice";
import variablesReducer from "./slices/variablesSlice";
import metricsReducer from "./slices/metricsSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    deployments: deploymentsReducer,
    vault: vaultReducer,
    templates: templatesReducer,
    variables: variablesReducer,
    metrics: metricsReducer,
  },
});
