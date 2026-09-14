import type { Editor, TLShape } from "tldraw";
import { getFile } from "@/lib/file-store";

function triggerDownload(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, name);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function safeName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120) || "file";
}

/** Source url + filename for a shape that carries an actual file, if any. */
async function shapeFile(
  editor: Editor,
  shape: TLShape,
): Promise<{ blob: Blob; name: string } | null> {
  const props = shape.props as Record<string, unknown>;

  if (shape.type === "cf-file") {
    const blob = await getFile(String(props["fileKey"] ?? ""));
    if (!blob) return null;
    return { blob, name: safeName(String(props["name"] ?? "file")) };
  }

  if (shape.type === "image" || shape.type === "video") {
    const assetId = props["assetId"] as string | undefined;
    if (!assetId) return null;
    const asset = editor.getAsset(assetId as never);
    const src = (asset?.props as { src?: string } | undefined)?.src;
    if (!src) return null;
    const res = await fetch(src);
    const blob = await res.blob();
    const name =
      (asset?.props as { name?: string } | undefined)?.name ??
      `${shape.type}.${(blob.type.split("/")[1] ?? "png").replace("jpeg", "jpg")}`;
    return { blob, name: safeName(name) };
  }

  return null;
}

/**
 * Download every file in the current selection (images, STL models, PDFs,
 * video…). Shapes without a file fall back to a PNG picture of themselves.
 * Returns how many downloads started.
 */
export async function downloadSelection(editor: Editor): Promise<number> {
  const shapes = editor.getSelectedShapes();
  if (!shapes.length) return 0;

  let count = 0;
  const drawnOnly: TLShape[] = [];

  for (const shape of shapes) {
    const file = await shapeFile(editor, shape);
    if (file) {
      downloadBlob(file.blob, file.name);
      count++;
    } else {
      drawnOnly.push(shape);
    }
  }

  if (drawnOnly.length) {
    const result = await editor.toImage(drawnOnly, {
      format: "png",
      background: true,
      scale: 2,
    });
    downloadBlob(result.blob, "canvasflow-selection.png");
    count++;
  }

  return count;
}

/** Export the whole board (or just the selection) as a PNG or SVG file. */
export async function exportBoard(
  editor: Editor,
  format: "png" | "svg",
  selectionOnly = false,
): Promise<boolean> {
  const ids = selectionOnly
    ? editor.getSelectedShapeIds()
    : editor.getCurrentPageShapeIds();
  const shapes = [...ids];
  if (!shapes.length) return false;
  const result = await editor.toImage(shapes, {
    format,
    background: true,
    scale: format === "png" ? 2 : 1,
    padding: 32,
  });
  downloadBlob(result.blob, `canvasflow-board.${format}`);
  return true;
}

/** Share the board: native share sheet where available, clipboard otherwise. */
export async function shareBoardLink(
  boardName: string,
): Promise<"shared" | "copied" | "failed"> {
  const url = window.location.href;
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
  };
  if (nav.share) {
    try {
      await nav.share({ title: boardName, text: `${boardName} · CanvasFlow`, url });
      return "shared";
    } catch {
      /* user dismissed – fall through to copy */
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Share a picture of the board through the native share sheet. */
export async function shareBoardImage(
  editor: Editor,
  boardName: string,
): Promise<"shared" | "downloaded" | "empty"> {
  const shapes = [...editor.getCurrentPageShapeIds()];
  if (!shapes.length) return "empty";
  const { blob } = await editor.toImage(shapes, {
    format: "png",
    background: true,
    scale: 2,
    padding: 32,
  });
  const file = new File([blob], `${safeName(boardName)}.png`, { type: "image/png" });
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: boardName });
      return "shared";
    } catch {
      /* fall through */
    }
  }
  downloadBlob(blob, file.name);
  return "downloaded";
}
