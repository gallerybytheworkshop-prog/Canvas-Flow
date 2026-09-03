import "tldraw/tldraw.css";
import "./whiteboard.css";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Tldraw,
  DefaultStylePanel,
  type Editor,
  type TLComponents,
} from "tldraw";
import { TopBar } from "./TopBar";
import { LeftToolbar } from "./LeftToolbar";
import { ZoomControls } from "./ZoomControls";

const components: TLComponents = {
  Toolbar: null,
  MenuPanel: null,
  NavigationPanel: null,
  PageMenu: null,
  MainMenu: null,
  HelpMenu: null,
  DebugMenu: null,
  SharePanel: null,
  TopPanel: null,
  StylePanel: DefaultStylePanel,
};

export default function CanvasFlowBoard() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [presenting, setPresenting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMount = useCallback((e: Editor) => {
    setEditor(e);
    e.user.updateUserPreferences({ colorScheme: "light" });
  }, []);

  // Extra shortcuts beyond tldraw defaults (P = pen, O = circle)
  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const target = ev.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      )
        return;
      const key = ev.key.toLowerCase();
      if (key === "p") {
        editor.setCurrentTool("draw");
      } else if (key === "o") {
        editor.run(() => {
          editor.setStyleForNextShapes(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (editor.styleProps as any) ? undefined! : undefined!,
          );
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current ?? document.documentElement;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen().catch(() => undefined);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-background"
    >
      <Tldraw
        persistenceKey="canvasflow-board-v1"
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
    </div>
  );
}
