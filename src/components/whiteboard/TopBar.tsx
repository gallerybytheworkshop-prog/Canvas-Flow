import { useEffect, useState } from "react";
import { useValue, type Editor } from "tldraw";
import {
  Redo2,
  Settings,
  Share2,
  Play,
  Star,
  Undo2,
  Grid2x2,
  Magnet,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAME_KEY = "canvasflow:board-name";
const STAR_KEY = "canvasflow:board-starred";

function IconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function TopBar({
  editor,
  onPresent,
}: {
  editor: Editor;
  onPresent: () => void;
}) {
  const [name, setName] = useState("Untitled Board");
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY);
    if (stored) setName(stored);
    setStarred(localStorage.getItem(STAR_KEY) === "true");
  }, []);

  const canUndo = useValue("canUndo", () => editor.getCanUndo(), [editor]);
  const canRedo = useValue("canRedo", () => editor.getCanRedo(), [editor]);
  const isGrid = useValue(
    "grid",
    () => editor.getInstanceState().isGridMode,
    [editor],
  );
  const snap = useValue(
    "snap",
    () => editor.user.getIsSnapMode(),
    [editor],
  );

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[300] flex justify-center p-3">
      <div className="cf-panel pointer-events-auto flex w-full max-w-[1200px] items-center gap-2 rounded-2xl px-3 py-2">
        <div className="flex items-center gap-2 pr-1">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            C
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            CanvasFlow
          </span>
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            localStorage.setItem(NAME_KEY, e.target.value);
          }}
          aria-label="Board name"
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-sm font-medium outline-none hover:bg-accent focus:bg-accent"
        />

        <IconButton
          label={starred ? "Unstar board" : "Star board"}
          active={starred}
          onClick={() => {
            const next = !starred;
            setStarred(next);
            localStorage.setItem(STAR_KEY, String(next));
          }}
        >
          <Star
            className={cn("h-4 w-4", starred && "fill-current text-amber-500")}
          />
        </IconButton>

        <div className="mx-1 h-6 w-px bg-border" />

        <IconButton
          label="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={() => editor.undo()}
        >
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={() => editor.redo()}
        >
          <Redo2 className="h-4 w-4" />
        </IconButton>

        <span className="ml-1 hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Saved locally
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => toast("Sharing arrives in a future version.")}
            className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            type="button"
            onClick={onPresent}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Play className="h-3.5 w-3.5" />
            Present
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Settings"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Canvas settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={isGrid}
                onCheckedChange={(v) =>
                  editor.updateInstanceState({ isGridMode: !!v })
                }
              >
                <Grid2x2 className="mr-2 h-4 w-4" /> Dot grid
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={snap}
                onCheckedChange={(v) =>
                  editor.user.updateUserPreferences({ isSnapMode: !!v })
                }
              >
                <Magnet className="mr-2 h-4 w-4" /> Snap to objects
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
