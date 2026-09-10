import React from "react";
import { Badge } from "@chakra-ui/react";

const StatusBadge = ({ flag, ...props }) => {
  if (!flag) return null;

  const normalized = String(flag).trim().toLowerCase();

  let colorScheme = "gray";
  let displayLabel = flag;

  if (normalized === "critical" || normalized === "rejected") {
    colorScheme = "red";
    displayLabel = normalized === "critical" ? "Critical" : "Rejected";
  } else if (
    normalized === "needs update" ||
    normalized === "needs_update" ||
    normalized === "needs-update" ||
    normalized === "warning"
  ) {
    colorScheme = "orange";
    displayLabel = "Needs Update";
  } else if (normalized === "good" || normalized === "approved") {
    colorScheme = "green";
    displayLabel = normalized === "good" ? "Good" : "Approved";
  } else if (normalized === "pending") {
    colorScheme = "blue";
    displayLabel = "Pending";
  }

  return (
    <Badge
      colorScheme={colorScheme}
      variant="subtle"
      px={2.5}
      py={0.5}
      borderRadius="full"
      fontSize="xs"
      fontWeight="600"
      textTransform="capitalize"
      {...props}
    >
      {displayLabel}
    </Badge>
  );
};

export default StatusBadge;
