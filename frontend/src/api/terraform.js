import apiClient from "./client";

export const terraformApi = {
  plan: (data) => apiClient.post("/terraform/plan", data),
  apply: (data) => apiClient.post("/terraform/apply", data),
  destroy: (data) => apiClient.post("/terraform/destroy", data),
  workspace: (projectId) => apiClient.get(`/terraform/workspace/${projectId}`),
  previewHcl: (projectId, resourceTypes) =>
    apiClient.get(`/terraform/preview/${projectId}`, { params: { resource_types: resourceTypes } }),
};
