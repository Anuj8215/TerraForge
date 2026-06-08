import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Typography, Button, Card, CardContent, Stepper, Step, StepLabel,
  TextField, Divider, Alert, CircularProgress, IconButton, Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PublicIcon from "@mui/icons-material/Public";
import Layout from "../components/Layout/Layout";
import ServiceSelector from "../components/aws/ServiceSelector";
import EC2Form from "../components/aws/EC2Form";
import S3Form from "../components/aws/S3Form";
import VPCForm from "../components/aws/VPCForm";
import AzureForm from "../components/aws/AzureForm";
import GCPForm from "../components/aws/GCPForm";
import { fetchProject } from "../store/slices/projectsSlice";
import { triggerPlan, triggerApply } from "../store/slices/deploymentsSlice";

const FORM_MAP = { ec2: EC2Form, s3: S3Form, vpc: VPCForm, azure: AzureForm, gcp: GCPForm };
const DEFAULT_MAP = {
  ec2: EC2Form.defaultConfig,
  s3: S3Form.defaultConfig,
  vpc: VPCForm.defaultConfig,
  azure: AzureForm.defaultConfig,
  gcp: GCPForm.defaultConfig,
};
const STEPS = ["Select Services", "Configure Resources", "Review & Deploy"];

export default function NewDeployment() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: project } = useSelector((s) => s.projects);

  const [step, setStep] = useState(0);
  const [resources, setResources] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { dispatch(fetchProject(id)); }, [id, dispatch]);

  const addResource = (type) => {
    setResources((prev) => [
      ...prev,
      { type, name: `${type}_${prev.filter((r) => r.type === type).length + 1}`, config: { ...DEFAULT_MAP[type] }, region: "" },
    ]);
    setStep(1);
  };

  const updateResource = (index, key, value) => {
    setResources((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  };

  const removeResource = (index) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const uniqueRegions = [...new Set(resources.map((r) => r.region).filter(Boolean))];
  const isMultiRegion = uniqueRegions.length > 0;

  const buildPayload = () => ({
    project_id: id,
    resources: resources.map((r) => ({
      type: r.type,
      name: r.name,
      config: r.config,
      region: r.region || undefined,
    })),
  });

  const handleDeploy = async (action) => {
    setDeploying(true);
    setError(null);
    try {
      const thunk = action === "plan" ? triggerPlan : triggerApply;
      const result = await dispatch(thunk(buildPayload())).unwrap();
      navigate(`/deployments/${result.id}`);
    } catch (e) {
      setError(e.message || "Deployment failed");
    } finally {
      setDeploying(false);
    }
  };

  const awsProvider = project?.provider === "aws";

  return (
    <Layout title="New Deployment">
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/projects/${id}`)}>
          {project?.name || "Project"}
        </Button>
      </Box>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {step === 0 && (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Choose Services</Typography>
          <ServiceSelector onSelect={addResource} projectProvider={project?.provider} />
          {resources.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Selected:</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {resources.map((r, i) => (
                  <Chip key={i} label={`${r.type}: ${r.name}`} onDelete={() => removeResource(i)} />
                ))}
              </Box>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => setStep(1)}>
                Configure Resources →
              </Button>
            </Box>
          )}
        </Box>
      )}

      {step === 1 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {resources.map((resource, index) => {
            const FormComponent = FORM_MAP[resource.type];
            const isAws = ["ec2", "s3", "vpc"].includes(resource.type);
            return (
              <Card key={index}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Chip label={resource.type.toUpperCase()} size="small" color="primary" />
                      <TextField
                        size="small" label="Resource Name" value={resource.name}
                        onChange={(e) => updateResource(index, "name", e.target.value)}
                        sx={{ width: 200 }}
                      />
                    </Box>
                    <IconButton color="error" onClick={() => removeResource(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {FormComponent && (
                    <FormComponent
                      config={resource.config}
                      region={resource.region}
                      onRegionChange={isAws ? (val) => updateResource(index, "region", val) : undefined}
                      onChange={(config) => updateResource(index, "config", config)}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={() => setStep(0)}>← Add More Services</Button>
            <Button variant="contained" onClick={() => setStep(2)} disabled={resources.length === 0}>
              Review →
            </Button>
          </Box>
        </Box>
      )}

      {step === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Deployment Summary</Typography>
              <Typography variant="body2" color="text.secondary">
                Project: <strong>{project?.name}</strong> · Provider: <strong>{project?.provider?.toUpperCase()}</strong> · Default Region: <strong>{project?.region}</strong>
              </Typography>

              {isMultiRegion && (
                <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <PublicIcon fontSize="small" color="primary" />
                  <Typography variant="body2" color="primary.light">
                    Multi-region deployment — provider aliases will be generated for: {uniqueRegions.join(", ")}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Resources ({resources.length})</Typography>
              {resources.map((r, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
                  <Chip label={r.type} size="small" color="primary" variant="outlined" />
                  <Typography variant="body2">{r.name}</Typography>
                  {r.region && (
                    <Chip label={r.region} size="small" variant="outlined" color="secondary" icon={<PublicIcon />} />
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={() => setStep(1)}>← Back</Button>
            <Button
              variant="outlined" onClick={() => handleDeploy("plan")} disabled={deploying}
              startIcon={deploying && <CircularProgress size={14} />}
            >
              Run Plan
            </Button>
            <Button
              variant="contained" color="success" onClick={() => handleDeploy("apply")} disabled={deploying}
              startIcon={deploying && <CircularProgress size={14} />}
            >
              Apply Infrastructure
            </Button>
          </Box>
        </Box>
      )}
    </Layout>
  );
}
