import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, TextField, MenuItem, CircularProgress, Alert,
  IconButton, Tooltip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StorageIcon from "@mui/icons-material/Storage";
import Layout from "../components/Layout/Layout";
import StatusChip from "../components/common/StatusChip";
import EmptyState from "../components/common/EmptyState";
import { fetchProjects } from "../store/slices/projectsSlice";
import client from "../api/client";

export default function Resources() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: projects } = useSelector((s) => s.projects);

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    setLoading(true);
    const params = projectFilter ? `?project_id=${projectFilter}&limit=100` : "?limit=100";
    client.get(`/resources${params}`)
      .then((res) => setResources(res.data.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectFilter]);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || id?.slice(0, 8);

  return (
    <Layout title="Resources">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>Resource Inventory</Typography>
          <Typography variant="body2" color="text.secondary">
            All tracked infrastructure resources across projects
          </Typography>
        </Box>
        <TextField
          select label="Filter by Project" size="small" value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Projects</MenuItem>
          {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}><CircularProgress /></Box>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<StorageIcon />}
          title="No resources tracked"
          description="Resources appear here after a successful Terraform apply. Use 'Create Resource' from the API or after deployment."
        />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                      {r.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={r.type} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2" color="primary.light" sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/projects/${r.project_id}`)}
                    >
                      {projectName(r.project_id)}
                    </Typography>
                  </TableCell>
                  <TableCell><StatusChip status={r.status} /></TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(r.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {r.deployment_id && (
                      <Tooltip title="View deployment">
                        <IconButton size="small" onClick={() => navigate(`/deployments/${r.deployment_id}`)}>
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
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
