import { useEffect, useState } from "react";
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  stopEventPropagation,
  type RecordProps,
  type TLBaseShape,
} from "tldraw";
import {
  Box,
  Download,
  FileArchive,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileVideo,
  File as FileIcon,
  Image as ImageIcon,
  LayoutPanelTop,
  Camera,
} from "lucide-react";
import { getFile, formatBytes } from "@/lib/file-store";
import { StlViewer } from "./StlViewer";
import { cn } from "@/lib/utils";

export type CFFileView = "card" | "image" | "3d";

export interface CFFileProps {
  w: number;
  h: number;
  fileKey: string;
  name: string;
  size: number;
  mime: string;
  kind: string;
  view: CFFileView;
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    "cf-file": CFFileProps;
  }
}

export type CFFileShape = TLBaseShape<"cf-file", CFFileProps>;

export const FILE_SHAPE_DEFAULT_SIZE = { w: 320, h: 260 };

/** Coarse category used to pick the preview. */
export function fileKind(name: string, mime: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "stl" || ext === "obj" || ext === "3mf" || ext === "gltf" || ext === "glb")
    return ext === "stl" ? "stl" : "model";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["csv", "xlsx", "xls", "numbers"].includes(ext)) return "sheet";
  if (["json", "ts", "tsx", "js", "py", "md", "txt", "html", "css", "yml", "yaml"].includes(ext))
    return "code";
  if (["doc", "docx", "ppt", "pptx", "pages", "key"].includes(ext)) return "doc";
  return "file";
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  stl: Box,
  model: Box,
  image: ImageIcon,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  archive: FileArchive,
  sheet: FileSpreadsheet,
  code: FileCode,
  doc: FileText,
  file: FileIcon,
};

function useBlobUrl(fileKey: string) {
  const [state, setState] = useState<{ blob: Blob | null; url: string | null }>({
    blob: null,
    url: null,
  });

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    getFile(fileKey).then((blob) => {
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setState({ blob, url });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileKey]);

  return state;
}

function FileShapeBody({
  shape,
  isEditing,
  onSetView,
}: {
  shape: CFFileShape;
  isEditing: boolean;
  onSetView: (view: CFFileView) => void;
}) {
  const { name, size, mime, kind, view } = shape.props;
  const { blob, url } = useBlobUrl(shape.props.fileKey);
  const Icon = ICONS[kind] ?? FileIcon;
  const is3dCapable = kind === "stl";

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  const viewButtons: { id: CFFileView; label: string; icon: typeof Camera }[] = [
    ...(is3dCapable
      ? ([
          { id: "3d", label: "Interactive 3D", icon: Box },
          { id: "image", label: "Picture of model", icon: Camera },
        ] as const)
      : []),
    ...(!is3dCapable && kind !== "file" && kind !== "archive"
      ? ([{ id: "image", label: "Preview", icon: Camera }] as const)
      : []),
    { id: "card", label: "File details", icon: LayoutPanelTop },
  ];

  const preview = () => {
    if (!url) {
      return (
        <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
          Loading file…
        </div>
      );
    }
    if (kind === "stl") {
      return <StlViewer blob={blob} interactive={view === "3d" && isEditing} spin={view === "3d"} />;
    }
    if (kind === "image") {
      return <img src={url} alt={name} className="h-full w-full object-contain" />;
    }
    if (kind === "video") {
      return <video src={url} controls className="h-full w-full bg-black object-contain" />;
    }
    if (kind === "audio") {
      return (
        <div className="grid h-full w-full place-items-center p-3">
          <audio src={url} controls className="w-full" />
        </div>
      );
    }
    if (kind === "pdf") {
      return <iframe src={url} title={name} className="h-full w-full border-0 bg-white" />;
    }
    if (kind === "code") {
      return <iframe src={url} title={name} className="h-full w-full border-0 bg-white" />;
    }
    return card();
  };

  const card = () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <p className="line-clamp-2 break-all text-sm font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">
        {formatBytes(size)} · {mime || kind.toUpperCase()}
      </p>
      <button
        type="button"
        onPointerDown={stopEventPropagation}
        onClick={download}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
      >
        <Download className="h-3.5 w-3.5" /> Download
      </button>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1"
        onPointerDown={stopEventPropagation}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{name}</span>
        {viewButtons.map(({ id, label, icon: B }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => onSetView(id)}
            className={cn(
              "grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
              view === id && "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            <B className="h-3 w-3" />
          </button>
        ))}
        <button
          type="button"
          title="Download"
          aria-label="Download"
          onClick={download}
          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Download className="h-3 w-3" />
        </button>
      </div>
      <div
        className="min-h-0 flex-1"
        style={{ pointerEvents: isEditing ? "all" : "none" }}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
      >
        {view === "card" ? card() : preview()}
      </div>
      {!isEditing && view !== "card" && (
        <div className="shrink-0 border-t border-border px-2 py-0.5 text-center text-[10px] text-muted-foreground">
          Double-click to interact
        </div>
      )}
    </div>
  );
}

export class FileShapeUtil extends BaseBoxShapeUtil<CFFileShape> {
  static override type = "cf-file" as const;

  static override props: RecordProps<CFFileShape> = {
    w: T.nonZeroNumber,
    h: T.nonZeroNumber,
    fileKey: T.string,
    name: T.string,
    size: T.number,
    mime: T.string,
    kind: T.string,
    view: T.literalEnum("card", "image", "3d"),
  };

  override getDefaultProps(): CFFileShape["props"] {
    return {
      ...FILE_SHAPE_DEFAULT_SIZE,
      fileKey: "",
      name: "File",
      size: 0,
      mime: "",
      kind: "file",
      view: "card",
    };
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return true;
  }

  override component(shape: CFFileShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    return (
      <HTMLContainer style={{ width: shape.props.w, height: shape.props.h }}>
        <FileShapeBody
          shape={shape}
          isEditing={isEditing}
          onSetView={(view) =>
            this.editor.updateShape<CFFileShape>({
              id: shape.id,
              type: "cf-file",
              props: { view },
            })
          }
        />
      </HTMLContainer>
    );
  }

  override getIndicatorPath(shape: CFFileShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12);
    return path;
  }
}
