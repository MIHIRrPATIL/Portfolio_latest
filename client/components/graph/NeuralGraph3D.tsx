"use client";

import React, { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { GraphNodePayload, GraphEdgePayload } from "./NeuralGraphCanvas";

interface NeuralGraph3DProps {
  nodes: GraphNodePayload[];
  edges: GraphEdgePayload[];
  selectedNode: GraphNodePayload | null;
  onSelectNode: (node: GraphNodePayload | null) => void;
  filterType: string;
}

interface Node3D extends GraphNodePayload {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mesh?: THREE.Group;
  haloMesh?: THREE.Mesh;
  radius: number;
  color: string;
  glowColor: string;
}

interface Edge3D {
  source: Node3D;
  target: Node3D;
  relation: string;
  line?: THREE.Line;
}

const TYPE_CONFIG: Record<string, { color: number; glow: number; radius: number }> = {
  PROJECT: { color: 0xef4444, glow: 0xf87171, radius: 20 },
  FILE: { color: 0x38bdf8, glow: 0x7dd3fc, radius: 12 },
  FUNCTION: { color: 0x10b981, glow: 0x6ee7b7, radius: 9 },
  TECHNOLOGY: { color: 0xa855f7, glow: 0xc084fc, radius: 11 },
  EXPERIENCE: { color: 0xf59e0b, glow: 0xfcd34d, radius: 12 }
};

const disposeObject3D = (obj: THREE.Object3D) => {
  obj.traverse((child) => {
    if ((child as any).geometry) {
      (child as any).geometry.dispose();
    }
    if ((child as any).material) {
      if (Array.isArray((child as any).material)) {
        (child as any).material.forEach((m: any) => m.dispose());
      } else {
        (child as any).material.dispose();
      }
    }
  });
};

export default function NeuralGraph3D({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  filterType
}: NeuralGraph3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Simulation collections
  const nodes3DRef = useRef<Node3D[]>([]);
  const edges3DRef = useRef<Edge3D[]>([]);
  const hoveredNodeRef = useRef<Node3D | null>(null);

  // Camera Orbit State
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ theta: 0.9, phi: 0.4, radius: 1100 });
  const cameraTarget = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Initialize Scene, Camera & WebGL Renderer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#040406");
    scene.fog = new THREE.FogExp2("#040406", 0.0003);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 6000);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(500, 600, 500);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight2.position.set(-500, -400, -500);
    scene.add(dirLight2);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      nodes3DRef.current.forEach((n) => {
        if (n.mesh) disposeObject3D(n.mesh);
      });
      edges3DRef.current.forEach((e) => {
        if (e.line) disposeObject3D(e.line);
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Construct 3D High-Tech Nodes & Visuals with Spatial Clustering
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean previous meshes and free WebGL resources
    nodes3DRef.current.forEach((n) => {
      if (n.mesh) {
        scene.remove(n.mesh);
        disposeObject3D(n.mesh);
      }
    });
    edges3DRef.current.forEach((e) => {
      if (e.line) {
        scene.remove(e.line);
        disposeObject3D(e.line);
      }
    });

    const filteredNodes = filterType === "ALL" 
      ? nodes 
      : nodes.filter(n => n.type === filterType || n.type === "PROJECT");

    const nodeMap = new Map<string, Node3D>();
    const nodeCount = filteredNodes.length || 1;

    // Wide spatial distribution in 3D
    const nodes3D: Node3D[] = filteredNodes.map((n, i) => {
      const config = TYPE_CONFIG[n.type] || { color: 0xffffff, glow: 0xffffff, radius: 8 };
      
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const dist = n.type === "PROJECT" ? 380 : n.type === "FILE" ? 560 : 750;

      const x = dist * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * 100;
      const y = dist * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * 100;
      const z = dist * Math.cos(phi) + (Math.random() - 0.5) * 100;

      // Group Container
      const group = new THREE.Group();
      group.position.set(x, y, z);

      // Core Solid Geometry based on Type
      let coreGeo: THREE.BufferGeometry;
      if (n.type === "PROJECT") {
        coreGeo = new THREE.SphereGeometry(config.radius, 32, 32);
      } else if (n.type === "FILE") {
        coreGeo = new THREE.IcosahedronGeometry(config.radius, 1);
      } else if (n.type === "FUNCTION") {
        coreGeo = new THREE.SphereGeometry(config.radius, 24, 24);
      } else if (n.type === "TECHNOLOGY") {
        coreGeo = new THREE.OctahedronGeometry(config.radius, 0);
      } else {
        coreGeo = new THREE.SphereGeometry(config.radius, 24, 24);
      }

      const coreMat = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.85,
        roughness: 0.15,
        metalness: 0.85
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(coreMesh);

      // Futuristic Orbital Halo Ring for Projects
      let haloMesh: THREE.Mesh | undefined;
      if (n.type === "PROJECT") {
        const ringGeo = new THREE.TorusGeometry(config.radius * 1.7, 0.8, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.5
        });
        haloMesh = new THREE.Mesh(ringGeo, ringMat);
        haloMesh.rotation.x = Math.PI / 3;
        group.add(haloMesh);
      }

      // Crisp 4K Text Sprite Billboard
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 96;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = "bold 26px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 8;
        
        const labelText = n.name.length > 20 ? n.name.slice(0, 18) + "..." : n.name;
        ctx.fillText(labelText, 256, 48);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.85 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, config.radius + 16, 0);
      sprite.scale.set(52, 10, 1);
      group.add(sprite);

      scene.add(group);

      const nodeObj: Node3D = {
        ...n,
        x, y, z,
        vx: 0, vy: 0, vz: 0,
        radius: config.radius,
        color: `#${config.color.toString(16).padStart(6, "0")}`,
        glowColor: `#${config.glow.toString(16).padStart(6, "0")}`,
        mesh: group,
        haloMesh
      };
      nodeMap.set(n.id, nodeObj);
      return nodeObj;
    });

    // Create Clean 3D Connection Lines
    const edges3D: Edge3D[] = [];
    edges.forEach((e) => {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (src && tgt) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(src.x, src.y, src.z),
          new THREE.Vector3(tgt.x, tgt.y, tgt.z)
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.12
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);

        edges3D.push({
          source: src,
          target: tgt,
          relation: e.relation,
          line
        });
      }
    });

    // Pre-Warm Simulation (120 iterations) so nodes start in a spacious relaxed state
    for (let step = 0; step < 120; step++) {
      const alpha = Math.max(0.08, 1 - step / 120);

      // Repulsion
      for (let i = 0; i < nodes3D.length; i++) {
        for (let j = i + 1; j < nodes3D.length; j++) {
          const n1 = nodes3D[i];
          const n2 = nodes3D[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dz = n2.z - n1.z;
          const distSq = dx * dx + dy * dy + dz * dz || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 600) {
            const force = (1600 / distSq) * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            const fz = (dz / dist) * force;

            n1.x -= fx; n1.y -= fy; n1.z -= fz;
            n2.x += fx; n2.y += fy; n2.z += fz;
          }
        }
      }

      // Spring Attraction
      edges3D.forEach((edge) => {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dz = edge.target.z - edge.source.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        const targetDist = edge.relation === "DEFINES" ? 140 : 200;
        const force = (dist - targetDist) * 0.012 * alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        edge.source.x += fx; edge.source.y += fy; edge.source.z += fz;
        edge.target.x -= fx; edge.target.y -= fy; edge.target.z -= fz;
      });
    }

    // Apply pre-warmed positions directly to initial meshes
    nodes3D.forEach((n) => {
      n.vx = 0; n.vy = 0; n.vz = 0;
      if (n.mesh) {
        n.mesh.position.set(n.x, n.y, n.z);
      }
    });

    edges3D.forEach((edge) => {
      if (edge.line) {
        const positions = edge.line.geometry.attributes.position;
        positions.setXYZ(0, edge.source.x, edge.source.y, edge.source.z);
        positions.setXYZ(1, edge.target.x, edge.target.y, edge.target.z);
        positions.needsUpdate = true;
      }
    });

    nodes3DRef.current = nodes3D;
    edges3DRef.current = edges3D;
  }, [nodes, edges, filterType]);

  // Main 3D Physics Simulation & Animation Loop
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    let animId: number;

    const animate = () => {
      const nodes3D = nodes3DRef.current;
      const edges3D = edges3DRef.current;

      // 1. Continuous Spatial Repulsion (Prevents Nodes from Collapsing into Center)
      for (let i = 0; i < nodes3D.length; i++) {
        for (let j = i + 1; j < nodes3D.length; j++) {
          const n1 = nodes3D[i];
          const n2 = nodes3D[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dz = n2.z - n1.z;
          const distSq = dx * dx + dy * dy + dz * dz || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 420) {
            const force = 1200 / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            const fz = (dz / dist) * force;

            n1.vx -= fx; n1.vy -= fy; n1.vz -= fz;
            n2.vx += fx; n2.vy += fy; n2.vz += fz;
          }
        }
      }

      // 2. Spring Attraction along Edges
      edges3D.forEach((edge) => {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dz = edge.target.z - edge.source.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        const targetDist = edge.relation === "DEFINES" ? 140 : 200;
        const force = (dist - targetDist) * 0.008;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        edge.source.vx += fx; edge.source.vy += fy; edge.source.vz += fz;
        edge.target.vx -= fx; edge.target.vy -= fy; edge.target.vz -= fz;
      });

      // 3. Update Node Positions with Balanced High Damping (0.92) and Zero Inward Shrink
      nodes3D.forEach((n) => {
        n.vx *= 0.92;
        n.vy *= 0.92;
        n.vz *= 0.92;

        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;

        if (n.mesh) {
          n.mesh.position.set(n.x, n.y, n.z);
        }

        // Slowly spin orbital halos
        if (n.haloMesh) {
          n.haloMesh.rotation.z += 0.008;
        }
      });

      // Update 3D Edge Line Positions
      const hovered = hoveredNodeRef.current;
      const selected = selectedNode;

      edges3D.forEach((edge) => {
        if (edge.line) {
          const positions = edge.line.geometry.attributes.position;
          positions.setXYZ(0, edge.source.x, edge.source.y, edge.source.z);
          positions.setXYZ(1, edge.target.x, edge.target.y, edge.target.z);
          positions.needsUpdate = true;

          const isConnected = 
            (hovered && (edge.source.id === hovered.id || edge.target.id === hovered.id)) ||
            (selected && (edge.source.id === selected.id || edge.target.id === selected.id));

          const isDimmed = (hovered || selected) && !isConnected;
          const mat = edge.line.material as THREE.LineBasicMaterial;
          mat.color.set(isConnected ? 0xef4444 : 0xffffff);
          mat.opacity = isConnected ? 0.85 : isDimmed ? 0.02 : 0.12;
        }
      });

      // Camera Orbit
      const rot = cameraRotation.current;
      const r = rot.radius;
      camera.position.x = cameraTarget.current.x + r * Math.sin(rot.theta) * Math.cos(rot.phi);
      camera.position.y = cameraTarget.current.y + r * Math.sin(rot.phi);
      camera.position.z = cameraTarget.current.z + r * Math.cos(rot.theta) * Math.cos(rot.phi);

      cameraTarget.current.lerp(targetLookAt.current, 0.06);
      camera.lookAt(cameraTarget.current);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [selectedNode, filterType]);

  // Raycasting for 3D Node Selection
  const getIntersectedNode = useCallback((clientX: number, clientY: number): Node3D | null => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return null;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const meshList: THREE.Object3D[] = [];
    nodes3DRef.current.forEach((n) => {
      if (n.mesh) meshList.push(n.mesh);
    });

    const intersects = raycaster.intersectObjects(meshList, true);
    if (intersects.length > 0) {
      let topObj: THREE.Object3D | null = intersects[0].object;
      while (topObj && topObj.parent && topObj.parent !== scene) {
        topObj = topObj.parent;
      }
      return nodes3DRef.current.find((n) => n.mesh === topObj) || null;
    }
    return null;
  }, []);

  // 3D Orbital Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2) {
      isPanningRef.current = true;
    }
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    if (isDraggingRef.current) {
      cameraRotation.current.theta -= deltaX * 0.005;
      cameraRotation.current.phi = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cameraRotation.current.phi + deltaY * 0.005));
    } else if (isPanningRef.current) {
      const panSpeed = 0.9;
      targetLookAt.current.x -= deltaX * panSpeed;
      targetLookAt.current.y += deltaY * panSpeed;
    } else {
      const hit = getIntersectedNode(e.clientX, e.clientY);
      hoveredNodeRef.current = hit;
      if (mountRef.current) {
        mountRef.current.style.cursor = hit ? "pointer" : "grab";
      }
    }

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const hit = getIntersectedNode(e.clientX, e.clientY);
    onSelectNode(hit);
    if (hit) {
      targetLookAt.current.set(hit.x, hit.y, hit.z);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.7;
    cameraRotation.current.radius = Math.max(300, Math.min(2500, cameraRotation.current.radius + zoomDelta));
  };

  // Touch Handlers for Mobile & Touchscreens
  const touchPinchDistRef = useRef<number | null>(null);
  const touchHasMovedRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchHasMovedRef.current = false;
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchHasMovedRef.current = true;
    if (e.touches.length === 1 && isDraggingRef.current) {
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;

      cameraRotation.current.theta -= deltaX * 0.007;
      cameraRotation.current.phi = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, cameraRotation.current.phi + deltaY * 0.007)
      );

      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const diff = touchPinchDistRef.current - currentDist;

      cameraRotation.current.radius = Math.max(
        300,
        Math.min(2500, cameraRotation.current.radius + diff * 3)
      );
      touchPinchDistRef.current = currentDist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    touchPinchDistRef.current = null;

    // Handle Tap to Select if user didn't drag
    if (!touchHasMovedRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const hit = getIntersectedNode(touch.clientX, touch.clientY);
      onSelectNode(hit);
      if (hit) {
        targetLookAt.current.set(hit.x, hit.y, hit.z);
      }
    }
  };

  return (
    <div
      ref={mountRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
      data-cursor="no-target"
      className="relative w-full h-full bg-[#040406] overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
    />
  );
}
