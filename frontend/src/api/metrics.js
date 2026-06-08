import client from "./client";

export const metricsApi = {
  get: () => client.get("/metrics"),
  estimate: (resources) => client.post("/metrics/estimate", { resources }),
};
