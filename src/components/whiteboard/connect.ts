import { createShapeId, type Editor, type TLShapeId } from "tldraw";

/**
 * Draw a bound arrow between two shapes. The arrow stays attached, so moving
 * either shape keeps the link.
 */
function linkPair(editor: Editor, fromId: TLShapeId, toId: TLShapeId) {
  const arrowId = createShapeId();
  editor.createShape({ id: arrowId, type: "arrow", x: 0, y: 0 });
  editor.createBindings([
    {
      fromId: arrowId,
      toId: fromId,
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
      toId,
      type: "arrow",
      props: {
        terminal: "end",
        normalizedAnchor: { x: 0.5, y: 0.5 },
        isExact: false,
        isPrecise: false,
      },
    },
  ]);
  return arrowId;
}

/**
 * Connect the currently selected shapes with bound arrows, chained in the
 * order they appear on the canvas (left to right, then top to bottom).
 * Returns the number of links created.
 */
export function linkSelectedShapes(editor: Editor): number {
  const shapes = editor
    .getSelectedShapes()
    .filter((s) => s.type !== "arrow" && s.type !== "draw" && s.type !== "highlight");
  if (shapes.length < 2) return 0;

  const ordered = [...shapes].sort((a, b) => {
    const pa = editor.getShapePageBounds(a);
    const pb = editor.getShapePageBounds(b);
    if (!pa || !pb) return 0;
    return pa.x - pb.x || pa.y - pb.y;
  });

  const created: TLShapeId[] = [];
  editor.run(() => {
    for (let i = 0; i < ordered.length - 1; i++) {
      created.push(linkPair(editor, ordered[i].id, ordered[i + 1].id));
    }
  });
  editor.setSelectedShapes(created);
  return created.length;
}
