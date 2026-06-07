import apiClient from "./client";

export const vaultApi = {
  listSecrets: (projectId) => apiClient.get(`/secrets/${projectId}`),
  writeSecret: (projectId, data) => apiClient.put(`/secrets/${projectId}`, data),
  deleteSecret: (projectId, key) => apiClient.delete(`/secrets/${projectId}/${key}`),
  deleteAllSecrets: (projectId) => apiClient.delete(`/secrets/${projectId}`),
};
