import apiClient from "./client";

export const templatesApi = {
  list: (params = {}) => apiClient.get("/templates", { params }),
  get: (id) => apiClient.get(`/templates/${id}`),
  create: (data) => apiClient.post("/templates", data),
  remove: (id) => apiClient.delete(`/templates/${id}`),
};
