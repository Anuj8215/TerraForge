import apiClient from "./client";

export const variablesApi = {
  list: (projectId, params = {}) => apiClient.get(`/variables/${projectId}`, { params }),
  create: (projectId, data) => apiClient.post(`/variables/${projectId}`, data),
  update: (projectId, variableId, data) => apiClient.put(`/variables/${projectId}/${variableId}`, data),
  remove: (projectId, variableId) => apiClient.delete(`/variables/${projectId}/${variableId}`),
};
