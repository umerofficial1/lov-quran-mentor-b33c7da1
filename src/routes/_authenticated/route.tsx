import { createFileRoute, Outlet } from "@tanstack/react-router";

// Auth requirement removed — this layout no longer gates its children.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});
