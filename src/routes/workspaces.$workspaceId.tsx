import {
  createFileRoute,
  Link,
  Navigate,
  useNavigate,
} from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  LayoutGrid,
  Loader2,
  Plus,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/workspaces/$workspaceId")({
  head: () => ({
    meta: [
      { title: "Workspace Boards — CanvasFlow" },
      {
        name: "description",
        content: "Boards in this CanvasFlow workspace.",
      },
      { property: "og:title", content: "Workspace Boards — CanvasFlow" },
      {
        property: "og:description",
        content: "Boards in this CanvasFlow workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkspaceBoardsPage,
});

type Board = {
  id: string;
  title: string;
  created_at: string;
};

function WorkspaceBoardsPage() {
  const { workspaceId } = Route.useParams();
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const { data: ws } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();
    setWorkspaceName(ws?.name ?? null);

    const { data, error: err } = await supabase
      .from("boards")
      .select("id, title, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setBoards((data as Board[] | null) ?? []);
    }
    setFetching(false);
  }, [user, workspaceId]);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  const handleCreateBoard = async () => {
    if (!user) return;
    setError(null);
    setCreating(true);
    const { data: board, error: insertErr } = await supabase
      .from("boards")
      .insert({
        title: "Untitled Board",
        workspace_id: workspaceId,
        created_by: user.id,
      })
      .select("id, title, created_at")
      .single();
    setCreating(false);
    if (insertErr || !board) {
      setError(insertErr?.message ?? "Couldn't create the board.");
      return;
    }
    toast("Board created.");
    setBoards((prev) => [board as Board, ...prev]);
    navigate({ to: "/", search: { board: (board as Board).id } });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/workspaces"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspaces
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
            {(workspaceName ?? "W").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {workspaceName ?? "Workspace"} — Boards
            </h1>
            <p className="text-sm text-muted-foreground">
              Open a board or create a new one for this workspace.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <Button
            type="button"
            onClick={handleCreateBoard}
            disabled={creating}
            className="gap-1.5"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create New Board
          </Button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {fetching ? (
          <p className="text-sm text-muted-foreground">Loading boards…</p>
        ) : boards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Presentation className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No boards yet — create your first one above.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {boards.map((board) => (
              <li key={board.id}>
                <button
                  type="button"
                  onClick={() =>
                    navigate({ to: "/", search: { board: board.id } })
                  }
                  className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <LayoutGrid className="h-4 w-4" />
                  </span>
                  <span className="block font-medium text-foreground">
                    {board.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Created {new Date(board.created_at).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
