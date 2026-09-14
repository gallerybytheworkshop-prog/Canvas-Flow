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
  Upload,
  Minus,
  MousePointer2,
  Pen,
  Square,
  StickyNote,
  Type,
  MessageSquare,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { activateTool, currentToolId, type ToolId } from "./tools";
import { linkSelectedShapes } from "./connect";
import { insertFiles } from "./insert-files";
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
  { id: "image", label: "Upload file (images, STL, PDF, video…)", icon: Upload, compact: true },
  { id: "link", label: "Link selected items", icon: Link2, compact: true },
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
    if (id === "link") {
      const n = linkSelectedShapes(editor);
      if (n === 0)
        toast("Select two or more items first — they'll be joined with arrows.");
      else toast(n === 1 ? "Linked 2 items." : `Created ${n} links.`);
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
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) await insertFiles(editor, files);
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
