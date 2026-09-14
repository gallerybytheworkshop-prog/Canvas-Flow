import "tldraw/tldraw.css";
import "./whiteboard.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, type Editor, type TLComponents } from "tldraw";
import { Toaster } from "@/components/ui/sonner";
import { TopBar } from "./TopBar";
import { LeftToolbar } from "./LeftToolbar";
import { ZoomControls } from "./ZoomControls";
import { activateTool } from "./tools";
import { FileShapeUtil } from "./shapes/FileShapeUtil";
import { insertFiles } from "./insert-files";
import { ConnectorOverlay } from "./ConnectorOverlay";

const shapeUtils = [FileShapeUtil];

const components: TLComponents = {
  InFrontOfTheCanvas: ConnectorOverlay,
  Toolbar: null,
  MenuPanel: null,
  NavigationPanel: null,
  PageMenu: null,
  MainMenu: null,
  HelpMenu: null,
  DebugMenu: null,
  SharePanel: null,
  TopPanel: null,
};

export default function CanvasFlowBoard() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [presenting, setPresenting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMount = useCallback((e: Editor) => {
    setEditor(e);
    e.user.updateUserPreferences({ colorScheme: "light" });
    e.updateInstanceState({ isGridMode: true });
    // Accept every file type dropped or pasted onto the canvas.
    e.registerExternalContentHandler("files", async (content) => {
      await insertFiles(e, content.files as File[], content.point);
    });
  }, []);

  // Extra shortcuts on top of tldraw defaults: P = pen, O = circle.
  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const t = ev.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
      )
        return;
      if (editor.getEditingShapeId()) return;
      const key = ev.key.toLowerCase();
      if (key === "p") activateTool(editor, "draw");
      else if (key === "o") activateTool(editor, "ellipse");
      else if (key === "escape" && presenting) setPresenting(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, presenting]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current ?? document.documentElement;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* ignored */
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-background"
    >
      <Tldraw
        persistenceKey="canvasflow-board-v1"
        shapeUtils={shapeUtils}
        components={components}
        cameraOptions={{ zoomSteps: [0.1, 0.25, 0.5, 1, 2, 3, 4] }}
        onMount={handleMount}
      />

      {editor && !presenting && (
        <>
          <TopBar editor={editor} onPresent={() => setPresenting(true)} />
          <LeftToolbar editor={editor} />
        </>
      )}
      {editor && (
        <ZoomControls
          editor={editor}
          onFullscreen={toggleFullscreen}
          presenting={presenting}
          onExitPresent={() => setPresenting(false)}
        />
      )}
      <Toaster />
    </div>
  );
}
