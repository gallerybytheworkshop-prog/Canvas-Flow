import { useEffect, useRef, useState } from "react";
import {
  createShapeId,
  useEditor,
  useValue,
  type TLShape,
  type TLShapeId,
} from "tldraw";

const SKIP = new Set(["arrow", "draw", "highlight", "line"]);

/**
 * Freeform-style connectors: hover (or select) an item and small round handles
 * appear on its four edges. Drag one onto another item to join them with an
 * arrow that stays attached when either item moves.
 */
export function ConnectorOverlay() {
  const editor = useEditor();
  const [drag, setDrag] = useState<{
    fromId: TLShapeId;
    from: { x: number; y: number };
    to: { x: number; y: number };
    overId: TLShapeId | null;
  } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const target = useValue<TLShape | null>(
    "connector-target",
    () => {
      if (editor.getCurrentToolId() !== "select") return null;
      if (editor.getEditingShapeId()) return null;
      const hovered = editor.getHoveredShape();
      const selected = editor.getSelectedShapes();
      const shape = hovered ?? (selected.length === 1 ? selected[0]! : null);
      if (!shape || SKIP.has(shape.type)) return null;
      return shape;
    },
    [editor],
  );

  const bounds = useValue(
    "connector-bounds",
    () => {
      const id = dragRef.current?.fromId ?? target?.id;
      if (!id) return null;
      const b = editor.getShapePageBounds(id);
      if (!b) return null;
      const tl = editor.pageToViewport({ x: b.minX, y: b.minY });
      const br = editor.pageToViewport({ x: b.maxX, y: b.maxY });
      return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
    },
    [editor, target, drag?.fromId],
  );

  useEffect(() => {
    if (!drag) return;

    const rect = () => editor.getContainer().getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
      const r = rect();
      const viewport = { x: ev.clientX - r.left, y: ev.clientY - r.top };
      const page = editor.screenToPage({ x: ev.clientX, y: ev.clientY });
      const hit = editor.getShapeAtPoint(page, {
        hitInside: true,
        filter: (s) => s.id !== drag.fromId && !SKIP.has(s.type),
      });
      setDrag((d) => (d ? { ...d, to: viewport, overId: hit?.id ?? null } : d));
    };

    const onUp = (ev: PointerEvent) => {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      const page = editor.screenToPage({ x: ev.clientX, y: ev.clientY });
      const hit = editor.getShapeAtPoint(page, {
        hitInside: true,
        filter: (s) => s.id !== d.fromId && !SKIP.has(s.type),
      });
      if (!hit) return;
      const arrowId = createShapeId();
      editor.run(() => {
        editor.createShape({ id: arrowId, type: "arrow", x: 0, y: 0 });
        editor.createBindings([
          {
            fromId: arrowId,
            toId: d.fromId,
            type: "arrow",
            props: {
              terminal: "start",
              normalizedAnchor: { x: 0.5, y: 0.5 },
              isExact: false,
              isPrecise: false,
            },
          },
          {
            fromId: arrowId,
            toId: hit.id,
            type: "arrow",
            props: {
              terminal: "end",
              normalizedAnchor: { x: 0.5, y: 0.5 },
              isExact: false,
              isPrecise: false,
            },
          },
        ]);
      });
      editor.setSelectedShapes([arrowId]);
    };

    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    return () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
    };
  }, [drag, editor]);

  if (!bounds) return null;

  const handles = [
    { key: "t", x: bounds.x + bounds.w / 2, y: bounds.y - 12 },
    { key: "b", x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h + 12 },
    { key: "l", x: bounds.x - 12, y: bounds.y + bounds.h / 2 },
    { key: "r", x: bounds.x + bounds.w + 12, y: bounds.y + bounds.h / 2 },
  ];

  const fromId = drag?.fromId ?? target?.id;
  if (!fromId) return null;

  return (
    <>
      {drag && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <line
            x1={drag.from.x}
            y1={drag.from.y}
            x2={drag.to.x}
            y2={drag.to.y}
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeDasharray="6 5"
          />
          <circle
            cx={drag.to.x}
            cy={drag.to.y}
            r={drag.overId ? 8 : 4}
            fill="var(--color-primary)"
            opacity={drag.overId ? 0.35 : 0.8}
          />
        </svg>
      )}
      {handles.map((h) => (
        <button
          key={h.key}
          type="button"
          aria-label="Drag to link to another item"
          title="Drag to link to another item"
          onPointerDown={(ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            setDrag({
              fromId,
              from: { x: h.x, y: h.y },
              to: { x: h.x, y: h.y },
              overId: null,
            });
          }}
          style={{ left: h.x, top: h.y }}
          className="pointer-events-auto absolute z-[400] h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card shadow-sm transition-transform hover:scale-125"
        />
      ))}
    </>
  );
}
