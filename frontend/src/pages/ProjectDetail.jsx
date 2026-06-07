import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Typography, Button, Card, CardContent, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
} from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Layout from "../components/Layout/Layout";
import StatusChip from "../components/common/StatusChip";
import EmptyState from "../components/common/EmptyState";
import { fetchProject } from "../store/slices/projectsSlice";
import { fetchDeployments } from "../store/slices/deploymentsSlice";

export default function ProjectDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: project } = useSelector((s) => s.projects);
  const { items: deployments, loading } = useSelector((s) => s.deployments);

  useEffect(() => {
    dispatch(fetchProject(id));
    dispatch(fetchDeployments({ project_id: id }));
  }, [id, dispatch]);

  if (!project) return (
    <Layout title="Project Detail">
      <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>
    </Layout>
  );

  return (
    <Layout title={project.name}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/projects")}>
          Projects
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>{project.name}</Typography>
              {project.description && (
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>{project.description}</Typography>
              )}
              <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                <Chip label={project.provider.toUpperCase()} size="small" variant="outlined" color="primary" />
                <Chip label={project.region} size="small" variant="outlined" />
                <StatusChip status={project.status} />
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<RocketLaunchIcon />}
              onClick={() => navigate(`/projects/${id}/deploy`)}
            >
              New Deployment
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Deployments</Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}><CircularProgress /></Box>
      ) : deployments.length === 0 ? (
        <EmptyState
          icon={<RocketLaunchIcon />}
          title="No deployments yet"
          description="Deploy your first AWS infrastructure"
          actionLabel="New Deployment"
          onAction={() => navigate(`/projects/${id}/deploy`)}
        />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {deployments.map((d) => (
                <TableRow
                  key={d.id} hover sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/deployments/${d.id}`)}
                >
                  <TableCell>
                    <Chip label={d.action} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell><StatusChip status={d.status} /></TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(d.created_at).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/deployments/${d.id}`); }}>
                      View Logs
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Layout>
  );
}
