import type { ReactNode } from "react";
import { Box, Breadcrumbs } from "@mui/material";

export default function AppBreadcrumbRow({
  breadcrumbItems,
}: {
  breadcrumbItems: ReactNode;
}) {
  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumbs
        aria-label="breadcrumb"
        separator="›"
        sx={{ mb: 1 }}
      >
        {breadcrumbItems}
      </Breadcrumbs>
    </Box>
  );
}
