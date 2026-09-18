import type { Editor, TLShape, TLShapeId } from "tldraw";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/**
 * Per-board persistence against the existing `canvas_objects` table.
 * The whole tldraw shape record is stored in `data` (JSONB) so every object
 * type round-trips exactly; position/size/z-index are mirrored into columns.
 */

type ObjectRow = {
  id: string;
  data: unknown;
  z_index: number | null;
};

/** shape id -> canvas_objects row id */
export type RowIdMap = Map<string, string>;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function isShapeRecord(value: unknown): value is TLShape {
  const v = value as TLShape | null;
  return (
    !!v &&
    typeof v === "object" &&
    v.typeName === "shape" &&
    typeof v.id === "string" &&
    typeof v.type === "string"
  );
}

/** Load every saved shape for a board into the editor. */
export async function loadBoardShapes(
  editor: Editor,
  boardId: string,
): Promise<RowIdMap> {
  const rowIds: RowIdMap = new Map();

  const { data, error } = await supabase
    .from("canvas_objects")
    .select("id, data, z_index")
    .eq("board_id", boardId);

  if (error) throw error;

  const rows = (data as ObjectRow[] | null) ?? [];
  const shapes: TLShape[] = [];

  for (const row of rows) {
    if (!isShapeRecord(row.data)) continue;
    rowIds.set(row.data.id, row.id);
    shapes.push(row.data);
  }

  if (shapes.length) {
    // mergeRemoteChanges keeps the load out of the undo stack and out of sync.
    editor.store.mergeRemoteChanges(() => {
      editor.store.put(shapes);
    });
  }

  return rowIds;
}

type SyncOptions = {
  editor: Editor;
  boardId: string;
  userId: string;
  rowIds: RowIdMap;
  onStatus?: (status: "saving" | "saved" | "error") => void;
};

/**
 * Mirrors local shape changes to Supabase. The local store stays the source of
 * truth while typing/drawing — writes are debounced and batched, so the canvas
 * never waits on the network.
 */
export function startBoardSync({
  editor,
  boardId,
  userId,
  rowIds,
  onStatus,
}: SyncOptions): () => void {
  const dirty = new Set<TLShapeId>();
  const removed = new Set<TLShapeId>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flushing = false;
  let disposed = false;

  const flush = async () => {
    if (flushing) return schedule(400);
    if (!dirty.size && !removed.size) return;

    const upsertIds = [...dirty];
    const deleteShapeIds = [...removed];
    dirty.clear();
    removed.clear();
    flushing = true;
    onStatus?.("saving");

    try {
      const rows = upsertIds.flatMap((shapeId) => {
        const shape = editor.getShape(shapeId);
        if (!shape) return [];
        const bounds = editor.getShapePageBounds(shape);
        let rowId = rowIds.get(shape.id);
        if (!rowId) {
          rowId = newId();
          rowIds.set(shape.id, rowId);
        }
        return [
          {
            id: rowId,
            board_id: boardId,
            created_by: userId,
            object_type: shape.type,
            data: shape as unknown as Json,
            position_x: shape.x,
            position_y: shape.y,
            width: bounds?.width ?? null,
            height: bounds?.height ?? null,
            z_index: 0,
          },
        ];
      });

      if (rows.length) {
        const { error } = await supabase.from("canvas_objects").upsert(rows);
        if (error) throw error;
      }

      const deleteRowIds = deleteShapeIds
        .map((id) => {
          const rowId = rowIds.get(id);
          rowIds.delete(id);
          return rowId;
        })
        .filter((v): v is string => !!v);

      if (deleteRowIds.length) {
        const { error } = await supabase
          .from("canvas_objects")
          .delete()
          .in("id", deleteRowIds);
        if (error) throw error;
      }

      onStatus?.("saved");
    } catch (err) {
      console.error("[CanvasFlow] board save failed", err);
      // Retry these on the next flush.
      upsertIds.forEach((id) => dirty.add(id));
      deleteShapeIds.forEach((id) => removed.add(id));
      onStatus?.("error");
    } finally {
      flushing = false;
      if (!disposed && (dirty.size || removed.size)) schedule(800);
    }
  };

  function schedule(delay = 600) {
    if (disposed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), delay);
  }

  const unlisten = editor.store.listen(
    ({ changes }) => {
      for (const record of Object.values(changes.added)) {
        if (record.typeName === "shape") dirty.add(record.id);
      }
      for (const [, next] of Object.values(changes.updated)) {
        if (next.typeName === "shape") dirty.add(next.id);
      }
      for (const record of Object.values(changes.removed)) {
        if (record.typeName === "shape") {
          dirty.delete(record.id);
          removed.add(record.id);
        }
      }
      if (dirty.size || removed.size) schedule();
    },
    { source: "user", scope: "document" },
  );

  const onBeforeUnload = () => {
    if (dirty.size || removed.size) void flush();
  };
  window.addEventListener("beforeunload", onBeforeUnload);

  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    window.removeEventListener("beforeunload", onBeforeUnload);
    unlisten();
    void flush();
  };
}
