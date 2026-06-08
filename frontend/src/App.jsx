import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Deployments from "./pages/Deployments";
import DeploymentDetail from "./pages/DeploymentDetail";
import NewDeployment from "./pages/NewDeployment";
import Secrets from "./pages/Secrets";
import Templates from "./pages/Templates";
import VariableEditor from "./pages/VariableEditor";
import Resources from "./pages/Resources";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { fetchMe } from "./store/slices/authSlice";

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [token, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/projects" element={<Protected><Projects /></Protected>} />
      <Route path="/projects/:id" element={<Protected><ProjectDetail /></Protected>} />
      <Route path="/projects/:id/deploy" element={<Protected><NewDeployment /></Protected>} />
      <Route path="/projects/:id/secrets" element={<Protected><Secrets /></Protected>} />
      <Route path="/projects/:id/variables" element={<Protected><VariableEditor /></Protected>} />
      <Route path="/deployments" element={<Protected><Deployments /></Protected>} />
      <Route path="/deployments/:id" element={<Protected><DeploymentDetail /></Protected>} />
      <Route path="/templates" element={<Protected><Templates /></Protected>} />
      <Route path="/resources" element={<Protected><Resources /></Protected>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
