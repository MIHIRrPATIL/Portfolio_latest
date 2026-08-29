"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Box, Layers } from "lucide-react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import NeuralGraph3D from "@/components/graph/NeuralGraph3D";
import NeuralGraphCanvas, { GraphNodePayload, GraphEdgePayload } from "@/components/graph/NeuralGraphCanvas";
import GraphInspectorDrawer from "@/components/graph/GraphInspectorDrawer";
import GraphControlBar from "@/components/graph/GraphControlBar";

export default function NeuralGraphPage() {
  const [nodes, setNodes] = useState<GraphNodePayload[]>([]);
  const [edges, setEdges] = useState<GraphEdgePayload[]>([]);
  const [projectsList, setProjectsList] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNodePayload | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch Graph Data from Backend
  const loadGraphData = async (projectFilter?: string) => {
    setIsLoading(true);
    try {
      const url = projectFilter
        ? `http://localhost:8000/api/v1/graph/all?project=${encodeURIComponent(projectFilter)}`
        : "http://localhost:8000/api/v1/graph/all";

      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        if (data.projects && data.projects.length > 0) {
          setProjectsList(data.projects);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch graph data from backend:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData(selectedProject);
  }, [selectedProject]);

  // Filter nodes based on search query
  const filteredNodes = nodes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.name.toLowerCase().includes(q) ||
      (n.path && n.path.toLowerCase().includes(q)) ||
      (n.signature && n.signature.toLowerCase().includes(q)) ||
      n.repo_id.toLowerCase().includes(q)
    );
  });

  return (
    <main className="relative w-screen h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-mono selection:bg-red-300 selection:text-black">
      {/* Top Cybernetic HUD Header */}
      <header className="relative z-20 px-6 py-4 border-b border-white/10 bg-black/70 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Navigation & Titles */}
        <div className="flex items-center gap-6">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-white/40 hover:text-red-300 transition-colors uppercase font-mono tracking-widest text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Archive
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <h1 className="text-sm md:text-base font-black uppercase tracking-wider text-white">
                <EncryptedText
                  text="NEURAL KNOWLEDGE GRAPH"
                  revealDelayMs={60}
                  flipDelayMs={30}
                  className="inline-block text-white"
                  encryptedClassName="opacity-40"
                />
              </h1>
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-widest block">
              Autonomous Code AST & Relationship Mesh
            </span>
          </div>
        </div>

        {/* HUD Controls & 3D/2D Mode Toggle */}
        <div className="w-full md:w-auto flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-white/[0.02] border border-white/10">
            <button
              onClick={() => setViewMode("3D")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-medium tracking-wider transition-all ${
                viewMode === "3D"
                  ? "bg-white/10 text-red-300 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D SPATIAL</span>
            </button>
            <button
              onClick={() => setViewMode("2D")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-medium tracking-wider transition-all ${
                viewMode === "2D"
                  ? "bg-white/10 text-red-300 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>2D FLAT</span>
            </button>
          </div>

          <GraphControlBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            projects={projectsList}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            nodesCount={filteredNodes.length}
            edgesCount={edges.length}
          />
        </div>
      </header>

      {/* Main Graph Viewport */}
      <section data-cursor="no-target" className="relative flex-1 w-full h-full overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 space-y-4">
            <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
            <span className="text-xs uppercase tracking-widest text-white/60 font-mono">
              Reconstructing Neural Graph Mesh...
            </span>
          </div>
        ) : viewMode === "3D" ? (
          <NeuralGraph3D
            nodes={filteredNodes}
            edges={edges}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            filterType={selectedFilter}
          />
        ) : (
          <NeuralGraphCanvas
            nodes={filteredNodes}
            edges={edges}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            filterType={selectedFilter}
          />
        )}

        {/* Legend Overlay at Bottom-Left */}
        <div className="absolute bottom-6 left-6 z-10 p-3.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 flex flex-wrap items-center gap-4 text-[10px] text-white/60 font-mono">
          <span className="text-white/40 uppercase tracking-widest font-bold">LEGEND:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span>PROJECT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            <span>MODULE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span>FUNCTION</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            <span>TECH STACK</span>
          </div>
        </div>

        {/* Telemetry Instruction Pill at Bottom-Right */}
        <div className="hidden md:block absolute bottom-6 right-6 z-10 px-3.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white/40 font-mono uppercase tracking-wider">
          {viewMode === "3D"
            ? "Left Click Drag: Orbit | Right Click Drag: Pan | Scroll: Zoom | Click: Inspect"
            : "Drag: Pan | Scroll: Zoom | Click: Inspect"}
        </div>
      </section>

      {/* Side Inspector Drawer */}
      <GraphInspectorDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </main>
  );
}
