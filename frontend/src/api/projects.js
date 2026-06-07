import apiClient from "./client";

export const projectsApi = {
  list: (params = {}) => apiClient.get("/projects", { params }),
  get: (id) => apiClient.get(`/projects/${id}`),
  create: (data) => apiClient.post("/projects", data),
  update: (id, data) => apiClient.put(`/projects/${id}`, data),
  remove: (id) => apiClient.delete(`/projects/${id}`),
};
