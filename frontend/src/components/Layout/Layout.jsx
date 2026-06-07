import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ title, children }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header title={title} />
        <Box sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
