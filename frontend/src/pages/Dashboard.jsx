import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Grid, Card, CardContent, Typography, Box, Button, CircularProgress,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import FolderIcon from "@mui/icons-material/Folder";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import StorageIcon from "@mui/icons-material/Storage";
import Layout from "../components/Layout/Layout";
import { fetchProjects } from "../store/slices/projectsSlice";
import { fetchDeployments } from "../store/slices/deploymentsSlice";
import { fetchMetrics } from "../store/slices/metricsSlice";

const COLORS = { success: "#22c55e", failed: "#ef4444", running: "#f59e0b", pending: "#6366f1" };

function StatCard({ icon, label, value, color }) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ color, fontSize: 32 }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight={700}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function ActivityChart({ activity }) {
  if (!activity || activity.length === 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
        <Typography color="text.secondary" variant="body2">No deployment activity yet</Typography>
      </Box>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={activity} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#1A1A2E", border: "1px solid #333", borderRadius: 6 }}
          labelStyle={{ color: "#e2e8f0" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="success" fill={COLORS.success} radius={[3, 3, 0, 0]} />
        <Bar dataKey="failed" fill={COLORS.failed} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ProviderBar({ byProvider }) {
  if (!byProvider || Object.keys(byProvider).length === 0) return null;
  const PROVIDER_COLORS = { aws: "#FF9900", azure: "#0078D4", gcp: "#4285F4" };
  const data = Object.entries(byProvider).map(([k, v]) => ({ name: k.toUpperCase(), count: v, fill: PROVIDER_COLORS[k] || "#7C3AED" }));
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#e2e8f0" }} width={48} />
        <Tooltip contentStyle={{ background: "#1A1A2E", border: "1px solid #333", borderRadius: 6 }} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: projects } = useSelector((s) => s.projects);
  const { items: deployments } = useSelector((s) => s.deployments);
  const { data: metrics, loading: mLoading } = useSelector((s) => s.metrics);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchDeployments());
    dispatch(fetchMetrics());
  }, [dispatch]);

  const depStatus = metrics?.deployments?.by_status || {};
  const successCount = depStatus.success || 0;
  const failedCount = depStatus.failed || 0;
  const totalResources = metrics?.resources?.total || 0;

  return (
    <Layout title="Dashboard">
      {mLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<FolderIcon />} label="Total Projects" value={metrics?.projects?.total ?? projects.length} color="primary.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<RocketLaunchIcon />} label="Total Deployments" value={metrics?.deployments?.total ?? deployments.length} color="secondary.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<CheckCircleIcon />} label="Successful" value={successCount} color="success.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<ErrorIcon />} label="Failed" value={failedCount} color="error.main" />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Deployment Activity</Typography>
                  <ActivityChart activity={metrics?.activity} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Projects by Provider</Typography>
                  <ProviderBar byProvider={metrics?.projects?.by_provider} />
                  <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <StorageIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {totalResources} tracked resource{totalResources !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Card sx={{ flex: 1, minWidth: 280 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Recent Projects</Typography>
                  <Button size="small" onClick={() => navigate("/projects")}>View All</Button>
                </Box>
                {projects.slice(0, 5).map((p) => (
                  <Box
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    sx={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      py: 1, borderBottom: "1px solid", borderColor: "divider",
                      cursor: "pointer", "&:hover": { color: "primary.light" },
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.provider} / {p.region}</Typography>
                  </Box>
                ))}
                {projects.length === 0 && (
                  <Typography color="text.secondary" variant="body2">No projects yet.</Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, minWidth: 280 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Recent Deployments</Typography>
                  <Button size="small" onClick={() => navigate("/deployments")}>View All</Button>
                </Box>
                {deployments.slice(0, 5).map((d) => (
                  <Box
                    key={d.id}
                    onClick={() => navigate(`/deployments/${d.id}`)}
                    sx={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      py: 1, borderBottom: "1px solid", borderColor: "divider",
                      cursor: "pointer", "&:hover": { color: "primary.light" },
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>{d.action}</Typography>
                    <Typography
                      variant="caption"
                      color={COLORS[d.status] || "text.secondary"}
                    >
                      {d.status}
                    </Typography>
                  </Box>
                ))}
                {deployments.length === 0 && (
                  <Typography color="text.secondary" variant="body2">No deployments yet.</Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Layout>
  );
}
