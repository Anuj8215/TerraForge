import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, CircularProgress, Button,
} from "@mui/material";
import Layout from "../components/Layout/Layout";
import StatusChip from "../components/common/StatusChip";
import EmptyState from "../components/common/EmptyState";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { fetchDeployments } from "../store/slices/deploymentsSlice";

export default function Deployments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((s) => s.deployments);

  useEffect(() => { dispatch(fetchDeployments()); }, [dispatch]);

  return (
    <Layout title="Deployments">
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<RocketLaunchIcon />}
          title="No deployments yet"
          description="Go to a project and trigger your first deployment"
          actionLabel="View Projects"
          onAction={() => navigate("/projects")}
        />
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Project ID</TableCell>
                <TableCell>Created</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/deployments/${d.id}`)}>
                  <TableCell><Chip label={d.action} size="small" variant="outlined" /></TableCell>
                  <TableCell><StatusChip status={d.status} /></TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                      {d.project_id.slice(0, 8)}…
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(d.created_at).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button size="small">View Logs</Button>
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
