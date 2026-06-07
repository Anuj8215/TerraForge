import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Box, Button, CircularProgress } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import Layout from "../components/Layout/Layout";
import { fetchProjects } from "../store/slices/projectsSlice";
import { fetchDeployments } from "../store/slices/deploymentsSlice";

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

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: projects, loading: pLoading } = useSelector((s) => s.projects);
  const { items: deployments, loading: dLoading } = useSelector((s) => s.deployments);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchDeployments());
  }, [dispatch]);

  const successCount = deployments.filter((d) => d.status === "success").length;
  const failedCount = deployments.filter((d) => d.status === "failed").length;

  const recentDeployments = deployments.slice(0, 5);

  return (
    <Layout title="Dashboard">
      {pLoading || dLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<FolderIcon />} label="Total Projects" value={projects.length} color="primary.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<RocketLaunchIcon />} label="Total Deployments" value={deployments.length} color="secondary.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<CheckCircleIcon />} label="Successful" value={successCount} color="success.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<ErrorIcon />} label="Failed" value={failedCount} color="error.main" />
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
                {recentDeployments.map((d) => (
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
                      color={d.status === "success" ? "success.main" : d.status === "failed" ? "error.main" : "text.secondary"}
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
