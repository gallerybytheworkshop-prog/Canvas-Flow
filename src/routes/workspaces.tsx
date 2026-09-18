import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/workspaces")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return <Outlet />;
}
