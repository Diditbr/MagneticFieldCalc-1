import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { MagnetType } from "@shared/schema";

interface Field3DVisualizationProps {
  magnetType: MagnetType;
  magnetization: number;
  dimensions: Record<string, number>;
  width?: number;
  height?: number;
}

export function Field3DVisualization({
  magnetType,
  magnetization,
  dimensions,
  width = 600,
  height = 500,
}: Field3DVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: { enabled: boolean; target: THREE.Vector3 };
    animationId: number | null;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0.3, 0.3, 0.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

   
    const gridHelper = new THREE.GridHelper(0.5, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(0.15);
    scene.add(axesHelper);

    let magnet: THREE.Mesh;
    const magnetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.7,
      roughness: 0.3,
    });

    switch (magnetType) {
      case "bar":
      case "rectangular": {
        const length = dimensions.length || 0.1;
        const width = dimensions.width || 0.05;
        const height = dimensions.height || 0.02;
        const geometry = new THREE.BoxGeometry(length, height, width);
        magnet = new THREE.Mesh(geometry, magnetMaterial);
        break;
      }
      case "cylindrical": {
        const diameter = dimensions.diameter || 0.05;
        const length = dimensions.length || 0.1;
        const geometry = new THREE.CylinderGeometry(
          diameter / 2,
          diameter / 2,
          length,
          32
        );
        magnet = new THREE.Mesh(geometry, magnetMaterial);
        magnet.rotation.z = Math.PI / 2;
        break;
      }
      case "ring": {
        const outerDiameter = dimensions.outerDiameter || 0.08;
        const innerDiameter = dimensions.innerDiameter || 0.04;
        const thickness = dimensions.thickness || 0.02;
        const geometry = new THREE.TorusGeometry(
          outerDiameter / 4,
          (outerDiameter - innerDiameter) / 4,
          16,
          32
        );
        magnet = new THREE.Mesh(geometry, magnetMaterial);
        magnet.rotation.x = Math.PI / 2;
        break;
      }
    }

    scene.add(magnet);

    const fieldLineMaterial = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.6,
    });

    const fieldLineCount = 16;
    const startRadius = 0.05;
    const maxDistance = 0.3;
    const steps = 40;

    for (let i = 0; i < fieldLineCount; i++) {
      const angle = (i / fieldLineCount) * Math.PI * 2;
      const startX = startRadius * Math.cos(angle);
      const startZ = startRadius * Math.sin(angle);

      const points: THREE.Vector3[] = [];
      let x = startX;
      let y = 0;
      let z = startZ;

      for (let step = 0; step < steps; step++) {
        const r = Math.sqrt(x * x + y * y + z * z);
        if (r < 0.01 || r > maxDistance) break;

        points.push(new THREE.Vector3(x, y, z));

        const r3 = r * r * r;
        const r5 = r3 * r * r;
        const m = magnetization * 0.00001;

        const mDotR = m * z;

        const Bx = (3 * mDotR * x) / r5;
        const By = (3 * mDotR * y) / r5;
        const Bz = (3 * mDotR * z) / r5 - m / r3;

        const magnitude = Math.sqrt(Bx * Bx + By * By + Bz * Bz);
        if (magnitude < 1e-10) break;

        const stepSize = 0.005;
        x += (Bx / magnitude) * stepSize;
        y += (By / magnitude) * stepSize;
        z += (Bz / magnitude) * stepSize;
      }

      if (points.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, fieldLineMaterial);
        scene.add(line);
      }
    }

    const isDragging = useRef(false);
    const previousMouse = useRef({ x: 0, y: 0 });
    const rotation = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;

      rotation.current.y += deltaX * 0.005;
      rotation.current.x += deltaY * 0.005;

      rotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.current.x));

      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      sceneRef.current = {
        scene,
        camera,
        renderer,
        controls: { enabled: true, target: new THREE.Vector3(0, 0, 0) },
        animationId,
      };

      const radius = 0.5;
      camera.position.x = radius * Math.sin(rotation.current.y) * Math.cos(rotation.current.x);
      camera.position.y = radius * Math.sin(rotation.current.x);
      camera.position.z = radius * Math.cos(rotation.current.y) * Math.cos(rotation.current.x);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [magnetType, magnetization, dimensions, width, height]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden border border-border"
      data-testid="visualization-3d"
    />
  );
}
