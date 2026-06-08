import { configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./slices/projectsSlice";
import deploymentsReducer from "./slices/deploymentsSlice";
import vaultReducer from "./slices/vaultSlice";
import templatesReducer from "./slices/templatesSlice";
import variablesReducer from "./slices/variablesSlice";

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    deployments: deploymentsReducer,
    vault: vaultReducer,
    templates: templatesReducer,
    variables: variablesReducer,
  },
});
