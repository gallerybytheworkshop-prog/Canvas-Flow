import { useValue, type Editor } from "tldraw";
import { Maximize, Maximize2, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ZoomControls({
  editor,
  onFullscreen,
  presenting,
  onExitPresent,
}: {
  editor: Editor;
  onFullscreen: () => void;
  presenting: boolean;
  onExitPresent: () => void;
}) {
  const zoom = useValue("zoom", () => editor.getZoomLevel(), [editor]);

  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-[300] flex items-center gap-2">
      {presenting && (
        <button
          type="button"
          onClick={onExitPresent}
          className="cf-panel pointer-events-auto inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium"
        >
          <X className="h-4 w-4" /> Exit present
        </button>
      )}
      <div className="cf-panel pointer-events-auto flex items-center gap-0.5 rounded-xl p-1">
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          className={btn}
          onClick={() => editor.zoomOut(undefined, { animation: { duration: 160 } })}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Reset zoom to 100%"
          onClick={() => editor.resetZoom(undefined, { animation: { duration: 160 } })}
          className={cn(
            "min-w-[56px] rounded-lg px-2 py-1.5 text-xs font-medium tabular-nums transition-colors hover:bg-accent",
          )}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          className={btn}
          onClick={() => editor.zoomIn(undefined, { animation: { duration: 160 } })}
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        <button
          type="button"
          aria-label="Fit to screen"
          title="Fit to screen"
          className={btn}
          onClick={() => editor.zoomToFit({ animation: { duration: 200 } })}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Fullscreen"
          title="Fullscreen"
          className={btn}
          onClick={onFullscreen}
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
