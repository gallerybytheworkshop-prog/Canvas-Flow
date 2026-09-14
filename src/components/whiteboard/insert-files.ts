import type { Editor, TLShapePartial, VecLike } from "tldraw";
import { createShapeId } from "tldraw";
import { putFile } from "@/lib/file-store";
import {
  fileKind,
  FILE_SHAPE_DEFAULT_SIZE,
  type CFFileShape,
} from "./shapes/FileShapeUtil";

const NATIVE = /^(image\/(png|jpeg|jpg|gif|webp|svg\+xml))$/;

/**
 * Images go in as native canvas images; every other file type (STL models,
 * PDFs, video, audio, docs, archives…) becomes a CanvasFlow file shape.
 */
export async function insertFiles(editor: Editor, files: File[], at?: VecLike) {
  if (!files.length) return;

  const point = at ?? editor.getViewportPageBounds().center;
  const native = files.filter((f) => NATIVE.test(f.type));
  const others = files.filter((f) => !NATIVE.test(f.type));

  if (native.length) {
    await editor.putExternalContent({
      type: "files",
      files: native,
      point,
      ignoreParent: false,
    });
  }

  if (!others.length) return;

  const partials: TLShapePartial<CFFileShape>[] = [];
  let offset = 0;

  for (const file of others) {
    const fileKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await putFile(fileKey, file);
    const kind = fileKind(file.name, file.type);
    const is3d = kind === "stl";
    partials.push({
      id: createShapeId(),
      type: "cf-file",
      x: point.x - FILE_SHAPE_DEFAULT_SIZE.w / 2 + offset,
      y: point.y - FILE_SHAPE_DEFAULT_SIZE.h / 2 + offset,
      props: {
        ...FILE_SHAPE_DEFAULT_SIZE,
        fileKey,
        name: file.name,
        size: file.size,
        mime: file.type,
        kind,
        view: is3d || ["video", "pdf", "audio", "code"].includes(kind) ? (is3d ? "3d" : "image") : "card",
      },
    });
    offset += 24;
  }

  editor.createShapes(partials);
  editor.setSelectedShapes(partials.map((p) => p.id!));
}
