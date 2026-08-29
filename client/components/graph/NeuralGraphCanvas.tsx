"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

export interface GraphNodePayload {
  id: string;
  type: "PROJECT" | "FILE" | "FUNCTION" | "TECHNOLOGY" | "EXPERIENCE";
  name: string;
  repo_id: string;
  path?: string;
  signature?: string;
  docstring?: string;
  code_snippet?: string;
  properties?: Record<string, any>;
}

export interface GraphEdgePayload {
  source: string;
  target: string;
  relation: string;
}

export interface SimNode extends GraphNodePayload {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
  isDragging?: boolean;
}

export interface SimLink {
  source: SimNode;
  target: SimNode;
  relation: string;
  pulsePhase: number;
}

interface NeuralGraphCanvasProps {
  nodes: GraphNodePayload[];
  edges: GraphEdgePayload[];
  selectedNode: GraphNodePayload | null;
  onSelectNode: (node: GraphNodePayload | null) => void;
  filterType: string;
}

const TYPE_COLORS: Record<string, { color: string; glow: string; radius: number }> = {
  PROJECT: { color: "#ef4444", glow: "rgba(239, 68, 68, 0.4)", radius: 24 },
  FILE: { color: "#38bdf8", glow: "rgba(56, 189, 248, 0.35)", radius: 16 },
  FUNCTION: { color: "#10b981", glow: "rgba(16, 185, 129, 0.35)", radius: 14 },
  TECHNOLOGY: { color: "#a855f7", glow: "rgba(168, 85, 247, 0.35)", radius: 15 },
  EXPERIENCE: { color: "#f59e0b", glow: "rgba(245, 158, 11, 0.35)", radius: 18 }
};

export default function NeuralGraphCanvas({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  filterType
}: NeuralGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport transformation (Pan & Zoom)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const [scale, setScale] = useState(1);

  // Simulation references
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const hoveredNodeRef = useRef<SimNode | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);

  // Initialize Simulation Entities
  useEffect(() => {
    const nodeMap = new Map<string, SimNode>();
    const angleStep = (2 * Math.PI) / (nodes.length || 1);

    const filteredNodes = filterType === "ALL" 
      ? nodes 
      : nodes.filter(n => n.type === filterType || n.type === "PROJECT");

    const simNodes: SimNode[] = filteredNodes.map((n, i) => {
      const typeConfig = TYPE_COLORS[n.type] || { color: "#94a3b8", glow: "rgba(148, 163, 184, 0.3)", radius: 14 };
      const radiusDist = n.type === "PROJECT" ? 120 : n.type === "FILE" ? 260 : 380;
      const angle = i * angleStep;

      const nodeObj: SimNode = {
        ...n,
        x: Math.cos(angle) * radiusDist + (Math.random() - 0.5) * 80,
        y: Math.sin(angle) * radiusDist + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
        radius: typeConfig.radius,
        color: typeConfig.color,
        glowColor: typeConfig.glow
      };
      nodeMap.set(n.id, nodeObj);
      return nodeObj;
    });

    const simLinks: SimLink[] = [];
    edges.forEach((e) => {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (src && tgt) {
        simLinks.push({
          source: src,
          target: tgt,
          relation: e.relation || "CONNECTED_TO",
          pulsePhase: 0
        });
      }
    });

    // Pre-Warm 2D Simulation (120 iterations) so nodes load into a perfectly relaxed state
    for (let step = 0; step < 120; step++) {
      const alpha = Math.max(0.08, 1 - step / 120);

      // Repulsion
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const n1 = simNodes[i];
          const n2 = simNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 400) {
            const force = (2500 / distSq) * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            n1.x -= fx; n1.y -= fy;
            n2.x += fx; n2.y += fy;
          }
        }
      }

      // Spring Attraction
      simLinks.forEach((link) => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = link.relation === "CONTAINS_FILE" ? 180 : 130;
        const force = (dist - targetDist) * 0.015 * alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        link.source.x += fx; link.source.y += fy;
        link.target.x -= fx; link.target.y -= fy;
      });
    }

    simNodes.forEach((n) => { n.vx = 0; n.vy = 0; });

    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;
  }, [nodes, edges, filterType]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Apply Pan & Zoom Transform
      const { x: panX, y: panY, scale: zoom } = transformRef.current;
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoom, zoom);

      // 1. Physics Step
      const simNodes = simNodesRef.current;
      const simLinks = simLinksRef.current;

      // Coulomb Repulsion
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const n1 = simNodes[i];
          const n2 = simNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 400) {
            const force = 3500 / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (!n1.isDragging) { n1.vx -= fx; n1.vy -= fy; }
            if (!n2.isDragging) { n2.vx += fx; n2.vy += fy; }
          }
        }
      }

      // Spring Attraction along Edges
      for (let i = 0; i < simLinks.length; i++) {
        const link = simLinks[i];
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = link.relation === "CONTAINS_FILE" ? 180 : 130;
        const force = (dist - targetDist) * 0.015;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!link.source.isDragging) { link.source.vx += fx; link.source.vy += fy; }
        if (!link.target.isDragging) { link.target.vx -= fx; link.target.vy -= fy; }

        link.pulsePhase = (link.pulsePhase + 0.007) % 1;
      }

      // Central Gravity & Position Update
      simNodes.forEach((n) => {
        if (!n.isDragging) {
          n.vx -= n.x * 0.0001;
          n.vy -= n.y * 0.0001;

          n.vx *= 0.94; // Smooth Damping friction
          n.vy *= 0.94;

          n.x += n.vx;
          n.y += n.vy;
        }
      });

      // 2. Render Edges & Energy Pulses
      const hovered = hoveredNodeRef.current;
      const selected = selectedNode;

      simLinks.forEach((link) => {
        const isConnected = 
          (hovered && (link.source.id === hovered.id || link.target.id === hovered.id)) ||
          (selected && (link.source.id === selected.id || link.target.id === selected.id));

        const isDimmed = (hovered || selected) && !isConnected;

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.strokeStyle = isConnected 
          ? "rgba(239, 68, 68, 0.85)" 
          : isDimmed 
          ? "rgba(255, 255, 255, 0.03)" 
          : "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = isConnected ? 1.8 : 0.8;
        ctx.stroke();

      });

      // 3. Render Nodes
      simNodes.forEach((node) => {
        const isHovered = hovered && hovered.id === node.id;
        const isSelected = selected && selected.id === node.id;
        const isNeighbor = (hovered || selected) && simLinks.some(
          l => (l.source.id === node.id && (l.target.id === (hovered?.id || selected?.id))) ||
               (l.target.id === node.id && (l.source.id === (hovered?.id || selected?.id)))
        );

        const isDimmed = (hovered || selected) && !isHovered && !isSelected && !isNeighbor;

        // Concentric Target Ring for Projects
        if (node.type === "PROJECT" && (!isDimmed || isHovered || isSelected)) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 1.5, 0, 2 * Math.PI);
          ctx.strokeStyle = isHovered || isSelected ? "rgba(239, 68, 68, 0.6)" : "rgba(239, 68, 68, 0.25)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Outer Glow Halo
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 10, 0, 2 * Math.PI);
          ctx.fillStyle = node.glowColor;
          ctx.fill();
        }

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = isDimmed ? "rgba(20, 20, 20, 0.4)" : "#070709";
        ctx.fill();

        ctx.strokeStyle = isDimmed 
          ? "rgba(255, 255, 255, 0.05)" 
          : isHovered || isSelected 
          ? "#ffffff" 
          : node.color;
        ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Entity Glyph / Type Initial
        ctx.font = `bold ${Math.max(9, node.radius * 0.65)}px monospace`;
        ctx.fillStyle = isDimmed ? "rgba(255, 255, 255, 0.1)" : node.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const glyph = node.type === "PROJECT" ? "P" : node.type === "FILE" ? "F" : node.type === "FUNCTION" ? "λ" : "T";
        ctx.fillText(glyph, node.x, node.y);

        // Node Monospace Label
        if (!isDimmed || isHovered || isSelected) {
          ctx.font = `${node.type === "PROJECT" ? "bold 11px" : "10px"} monospace`;
          ctx.fillStyle = isHovered || isSelected ? "#ffffff" : isDimmed ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.85)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(node.name, node.x, node.y + node.radius + 6);
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedNode, filterType]);

  // Coordinate Conversion (Screen to World Space)
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const { x: panX, y: panY, scale: zoom } = transformRef.current;

    const cx = screenX - rect.left - rect.width / 2 - panX;
    const cy = screenY - rect.top - rect.height / 2 - panY;

    return { x: cx / zoom, y: cy / zoom };
  }, []);

  // Find Node Under Screen Coordinates
  const getNodeAtPos = useCallback((screenX: number, screenY: number): SimNode | null => {
    const { x, y } = screenToWorld(screenX, screenY);
    const simNodes = simNodesRef.current;

    for (let i = simNodes.length - 1; i >= 0; i--) {
      const n = simNodes[i];
      const dx = n.x - x;
      const dy = n.y - y;
      if (dx * dx + dy * dy <= n.radius * n.radius * 1.5) {
        return n;
      }
    }
    return null;
  }, [screenToWorld]);

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const node = getNodeAtPos(e.clientX, e.clientY);
    if (node) {
      draggedNodeRef.current = node;
      node.isDragging = true;
    } else {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isPanningRef.current) {
      transformRef.current.x = e.clientX - panStartRef.current.x;
      transformRef.current.y = e.clientY - panStartRef.current.y;
    } else {
      const node = getNodeAtPos(e.clientX, e.clientY);
      hoveredNodeRef.current = node;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = node ? "pointer" : "crosshair";
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current.isDragging = false;
      draggedNodeRef.current = null;
    }
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const node = getNodeAtPos(e.clientX, e.clientY);
    onSelectNode(node);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newScale = Math.min(Math.max(0.3, transformRef.current.scale * zoomFactor), 3.0);
    transformRef.current.scale = newScale;
    setScale(newScale);
  };

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden select-none">
      {/* Background Cybernetic Grid Lines */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full block"
      />
    </div>
  );
}
