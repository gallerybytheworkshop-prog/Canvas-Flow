import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Renders an STL blob. `interactive` enables orbit/zoom; when false a single
 * still frame is drawn (used for the "picture" view of a model).
 */
export function StlViewer({
  blob,
  interactive,
  spin = false,
}: {
  blob: Blob | null;
  interactive: boolean;
  spin?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !blob) return;

    let disposed = false;
    let frame = 0;
    let controls: OrbitControls | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f1f5f9");
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1, 1.4, 1);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-1, -0.4, -1);
    scene.add(rim);

    let mesh: THREE.Mesh | null = null;

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    blob
      .arrayBuffer()
      .then((buf) => {
        if (disposed) return;
        const geometry = new STLLoader().parse(buf);
        geometry.computeVertexNormals();
        geometry.center();
        const material = new THREE.MeshStandardMaterial({
          color: 0x6b7cff,
          metalness: 0.15,
          roughness: 0.55,
          flatShading: false,
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

        geometry.computeBoundingSphere();
        const radius = geometry.boundingSphere?.radius ?? 1;
        camera.position.set(radius * 1.8, radius * 1.5, radius * 2.2);
        camera.lookAt(0, 0, 0);

        if (interactive) {
          controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.target.set(0, 0, 0);
          controls.update();
        }

        resize();

        if (interactive || spin) {
          const tick = () => {
            if (disposed) return;
            frame = requestAnimationFrame(tick);
            if (spin && mesh) mesh.rotation.z += 0.005;
            controls?.update();
            renderer.render(scene, camera);
          };
          tick();
        }
      })
      .catch(() => {
        /* unreadable model — the card view still shows the file */
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls?.dispose();
      mesh?.geometry.dispose();
      (mesh?.material as THREE.Material | undefined)?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [blob, interactive, spin]);

  return <div ref={hostRef} className="h-full w-full" />;
}
