import { useRef } from "react";
import { useValue, type Editor } from "tldraw";
import {
  ArrowUpRight,
  Circle,
  Diamond,
  Eraser,
  Frame,
  Hand,
  Highlighter,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Pen,
  Square,
  StickyNote,
  Type,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { activateTool, currentToolId, type ToolId } from "./tools";
import { cn } from "@/lib/utils";

type Item = {
  id: ToolId;
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
};

const ITEMS: Item[] = [
  { id: "select", label: "Select", shortcut: "V", icon: MousePointer2, compact: true },
  { id: "hand", label: "Hand", shortcut: "H", icon: Hand, compact: true },
  { id: "note", label: "Sticky note", shortcut: "N", icon: StickyNote, compact: true },
  { id: "text", label: "Text", shortcut: "T", icon: Type, compact: true },
  { id: "draw", label: "Pen", shortcut: "P", icon: Pen, compact: true },
  { id: "highlight", label: "Highlighter", shortcut: "Shift+D", icon: Highlighter },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser, compact: true },
  { id: "line", label: "Line", shortcut: "L", icon: Minus },
  { id: "arrow", label: "Arrow", shortcut: "A", icon: ArrowUpRight, compact: true },
  { id: "rectangle", label: "Rectangle", shortcut: "R", icon: Square, compact: true },
  { id: "ellipse", label: "Circle", shortcut: "O", icon: Circle, compact: true },
  { id: "diamond", label: "Diamond", icon: Diamond },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "comment", label: "Comment", icon: MessageSquare },
  { id: "frame", label: "Frame", shortcut: "F", icon: Frame },
];

export function LeftToolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const active = useValue("tool", () => currentToolId(editor), [editor]);

  const onPick = (id: ToolId) => {
    if (id === "image") {
      fileRef.current?.click();
      return;
    }
    if (id === "comment") {
      toast("Comments are coming in a later version — added a note instead.");
    }
    activateTool(editor, id);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) {
            await editor.putExternalContent({
              type: "files",
              files,
              point: editor.getViewportPageBounds().center,
              ignoreParent: false,
            });
          }
          e.target.value = "";
        }}
      />
      <nav
        aria-label="Tools"
        className="pointer-events-none absolute left-3 top-1/2 z-[300] -translate-y-1/2"
      >
        <div className="cf-panel pointer-events-auto flex max-h-[80vh] flex-col gap-0.5 overflow-y-auto rounded-2xl p-1.5">
          {ITEMS.map(({ id, label, shortcut, icon: Icon, compact }) => (
            <button
              key={id}
              type="button"
              title={shortcut ? `${label} (${shortcut})` : label}
              aria-label={label}
              aria-pressed={active === id}
              onClick={() => onPick(id)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                active === id &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                !compact && "hidden sm:inline-flex",
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
