import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Typography, Card, CardContent, CircularProgress,
  Button, Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WifiIcon from "@mui/icons-material/Wifi";
import Layout from "../components/Layout/Layout";
import StatusChip from "../components/common/StatusChip";
import { fetchDeployment, updateDeploymentInList } from "../store/slices/deploymentsSlice";

const TERMINAL = new Set(["success", "failed"]);

export default function DeploymentDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: deployment } = useSelector((s) => s.deployments);
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);
  const [streamedLogs, setStreamedLogs] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    dispatch(fetchDeployment(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (!deployment) return;
    if (TERMINAL.has(deployment.status)) {
      setStreamedLogs(deployment.logs || "");
      return;
    }

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${window.location.host}/api/v1/ws/deployments/${id}/logs`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);

    ws.onmessage = (e) => {
      setStreamedLogs((prev) => prev + e.data);
    };

    ws.onclose = () => {
      setWsConnected(false);
      dispatch(fetchDeployment(id));
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [deployment?.id, deployment?.status, id, dispatch]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedLogs]);

  if (!deployment) return (
    <Layout title="Deployment Detail">
      <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>
    </Layout>
  );

  const isLive = !TERMINAL.has(deployment.status);
  const displayLogs = streamedLogs || deployment.logs || "";

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
            {wsConnected && (
              <Chip
                icon={<WifiIcon />}
                label="Live"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {new Date(deployment.created_at).toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {displayLogs && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Execution Logs</Typography>
              {isLive && wsConnected && (
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main", animation: "pulse 1.5s infinite" }} />
              )}
            </Box>
            <Box
              sx={{
                bgcolor: "#0d1117", borderRadius: 1, p: 2,
                maxHeight: 540, overflow: "auto",
                fontFamily: "monospace", fontSize: 12,
                color: "#c9d1d9", whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}
            >
              {displayLogs}
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
