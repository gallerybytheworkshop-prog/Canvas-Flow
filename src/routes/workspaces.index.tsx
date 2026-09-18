import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/workspaces/")({
  head: () => ({
    meta: [
      { title: "Your Workspaces — CanvasFlow" },
      {
        name: "description",
        content: "Create and open your CanvasFlow workspaces.",
      },
      { property: "og:title", content: "Your Workspaces — CanvasFlow" },
      {
        property: "og:description",
        content: "Create and open your CanvasFlow workspaces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkspacesPage,
});

type Workspace = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "workspace"}-${Math.random().toString(36).slice(2, 8)}`;
}

function WorkspacesPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    const { data, error: err } = await supabase
      .from("workspaces")
      .select("id, name, slug, created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setWorkspaces(data ?? []);
    }
    setFetching(false);
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Give your workspace a name (at least 2 characters).");
      return;
    }
    setError(null);
    setCreating(true);

    const { data: ws, error: insertErr } = await supabase
      .from("workspaces")
      .insert({ name: trimmed, slug: slugify(trimmed), created_by: user.id })
      .select("id, name, slug, created_at")
      .single();

    if (insertErr || !ws) {
      setCreating(false);
      setError(insertErr?.message ?? "Couldn't create the workspace.");
      return;
    }

    // Make the creator an owner member so workspace RLS grants access.
    const { error: memberErr } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: ws.id, user_id: user.id, role: "owner" });

    setCreating(false);
    if (memberErr) {
      toast("Workspace created, but membership could not be added.");
    } else {
      toast(`Workspace "${ws.name}" created.`);
    }
    setName("");
    setWorkspaces((prev) => [ws, ...prev]);
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
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
            C
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Your Workspaces
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a workspace or open one to start whiteboarding.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Label htmlFor="ws-name" className="mb-1.5 block text-sm">
              New workspace name
            </Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Team"
              disabled={creating}
            />
          </div>
          <Button type="submit" disabled={creating} className="gap-1.5">
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create workspace
          </Button>
        </form>

        {error && (
          <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {fetching ? (
          <p className="text-sm text-muted-foreground">Loading workspaces…</p>
        ) : workspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <LayoutGrid className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No workspaces yet — create your first one above.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <Link
                  to="/workspaces/$workspaceId"
                  params={{ workspaceId: ws.id }}
                  className="block w-full cursor-pointer rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent hover:shadow-md"
                >
                  <span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {ws.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="block font-medium text-foreground">
                    {ws.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {ws.slug}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
