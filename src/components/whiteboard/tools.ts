import { GeoShapeGeoStyle, type Editor } from "tldraw";

export type ToolId =
  | "select"
  | "hand"
  | "note"
  | "text"
  | "draw"
  | "highlight"
  | "eraser"
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "triangle"
  | "image"
  | "comment"
  | "frame";

const GEO: Partial<Record<ToolId, string>> = {
  rectangle: "rectangle",
  ellipse: "ellipse",
  diamond: "diamond",
  triangle: "triangle",
};

/** Activate a tool, mapping our tool ids onto tldraw's tool + style model. */
export function activateTool(editor: Editor, id: ToolId) {
  const geo = GEO[id];
  if (geo) {
    editor.run(() => {
      editor.setStyleForNextShapes(GeoShapeGeoStyle, geo as never);
      editor.setCurrentTool("geo");
    });
    return;
  }
  if (id === "comment") {
    editor.setCurrentTool("note");
    return;
  }
  editor.setCurrentTool(id);
}

/** Which of our tool ids is currently active. */
export function currentToolId(editor: Editor): ToolId {
  const tool = editor.getCurrentToolId();
  if (tool === "geo") {
    const geo = editor.getStyleForNextShape(GeoShapeGeoStyle) as string;
    if (geo === "ellipse") return "ellipse";
    if (geo === "diamond") return "diamond";
    if (geo === "triangle") return "triangle";
    return "rectangle";
  }
  return tool as ToolId;
}
