import { createFileRoute, ClientOnly, Navigate } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";

const CanvasFlowBoard = lazy(
  () => import("@/components/whiteboard/CanvasFlowBoard"),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CanvasFlow — Infinite Whiteboard for Visual Thinking" },
      {
        name: "description",
        content:
          "CanvasFlow is a fast, infinite whiteboard with sticky notes, shapes, drawing tools, and local autosave. Sketch, plan and map ideas in your browser.",
      },
      { property: "og:title", content: "CanvasFlow — Infinite Whiteboard" },
      {
        property: "og:description",
        content:
          "A smooth infinite canvas with sticky notes, shapes, pen tools and local autosave.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    board: typeof search.board === "string" ? search.board : undefined,
  }),
  component: Index,
});

function BoardFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading your canvas…</p>
    </div>
  );
}

function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <BoardFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <h1 className="sr-only">CanvasFlow infinite whiteboard</h1>
      <ClientOnly fallback={<BoardFallback />}>
        <Suspense fallback={<BoardFallback />}>
          <CanvasFlowBoard />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
