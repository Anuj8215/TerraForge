import apiClient from "./client";

export const deploymentsApi = {
  list: (params = {}) => apiClient.get("/deployments", { params }),
  get: (id) => apiClient.get(`/deployments/${id}`),
  remove: (id) => apiClient.delete(`/deployments/${id}`),
};
