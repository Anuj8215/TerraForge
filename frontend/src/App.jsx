import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Deployments from "./pages/Deployments";
import DeploymentDetail from "./pages/DeploymentDetail";
import NewDeployment from "./pages/NewDeployment";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/projects/:id/deploy" element={<NewDeployment />} />
      <Route path="/deployments" element={<Deployments />} />
      <Route path="/deployments/:id" element={<DeploymentDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
