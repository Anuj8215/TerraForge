import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Typography, Card, CardContent, CircularProgress,
  Button, Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Layout from "../components/Layout/Layout";
import StatusChip from "../components/common/StatusChip";
import { fetchDeployment, updateDeploymentInList } from "../store/slices/deploymentsSlice";
import { deploymentsApi } from "../api/deployments";

export default function DeploymentDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: deployment } = useSelector((s) => s.deployments);
  const logsEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    dispatch(fetchDeployment(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (!deployment) return;
    if (deployment.status === "running" || deployment.status === "pending") {
      pollRef.current = setInterval(async () => {
        const res = await deploymentsApi.get(id);
        dispatch(updateDeploymentInList(res.data));
        if (res.data.status !== "running" && res.data.status !== "pending") {
          clearInterval(pollRef.current);
        }
      }, 2000);
    }
    return () => clearInterval(pollRef.current);
  }, [deployment?.status, id, dispatch]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [deployment?.logs]);

  if (!deployment) return (
    <Layout title="Deployment Detail">
      <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>
    </Layout>
  );

  const isLive = deployment.status === "running" || deployment.status === "pending";

  return (
    <Layout title="Deployment Detail">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <Chip label={deployment.action} variant="outlined" />
            <StatusChip status={deployment.status} size="medium" />
            {isLive && <CircularProgress size={18} />}
            <Typography variant="caption" color="text.secondary">
              {new Date(deployment.created_at).toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {deployment.logs && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Execution Logs</Typography>
            <Box
              sx={{
                bgcolor: "#0d1117", borderRadius: 1, p: 2,
                maxHeight: 500, overflow: "auto",
                fontFamily: "monospace", fontSize: 12,
                color: "#c9d1d9", whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}
            >
              {deployment.logs}
              <div ref={logsEndRef} />
            </Box>
          </CardContent>
        </Card>
      )}

      {deployment.error_message && (
        <Card sx={{ mt: 2, border: "1px solid", borderColor: "error.main" }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} color="error" sx={{ mb: 1 }}>Error</Typography>
            <Box
              sx={{
                bgcolor: "#1a0000", borderRadius: 1, p: 2,
                fontFamily: "monospace", fontSize: 12,
                color: "#ff6b6b", whiteSpace: "pre-wrap",
              }}
            >
              {deployment.error_message}
            </Box>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
