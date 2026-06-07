import { Chip } from "@mui/material";

const STATUS_MAP = {
  active: { color: "success", label: "Active" },
  inactive: { color: "default", label: "Inactive" },
  archived: { color: "warning", label: "Archived" },
  pending: { color: "default", label: "Pending" },
  running: { color: "info", label: "Running" },
  success: { color: "success", label: "Success" },
  failed: { color: "error", label: "Failed" },
  creating: { color: "info", label: "Creating" },
  destroying: { color: "warning", label: "Destroying" },
  destroyed: { color: "default", label: "Destroyed" },
};

export default function StatusChip({ status, size = "small" }) {
  const { color, label } = STATUS_MAP[status] || { color: "default", label: status };
  return <Chip label={label} color={color} size={size} />;
}
