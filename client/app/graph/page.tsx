"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Box, Layers } from "lucide-react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import NeuralGraph3D from "@/components/graph/NeuralGraph3D";
import NeuralGraphCanvas, { GraphNodePayload, GraphEdgePayload } from "@/components/graph/NeuralGraphCanvas";
import GraphInspectorDrawer from "@/components/graph/GraphInspectorDrawer";
import GraphControlBar from "@/components/graph/GraphControlBar";

import { API_V1 } from "@/lib/api-config";

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
        ? `${API_V1}/graph/all?project=${encodeURIComponent(projectFilter)}`
        : `${API_V1}/graph/all`;

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
      <header className="relative z-20 px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-white/10 bg-black/80 backdrop-blur-xl flex flex-col gap-2.5 sm:gap-4">
        {/* Row 1: Navigation, Title & 3D/2D Mode Toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/projects"
              className="flex items-center gap-1.5 sm:gap-2 text-white/40 hover:text-red-300 transition-colors uppercase font-mono tracking-wider sm:tracking-widest text-[10px] sm:text-xs"
            >
              <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
              <span className="hidden sm:inline">Back to Archive</span>
              <span className="sm:hidden">Archive</span>
            </Link>

            <div className="h-3.5 w-px bg-white/10 hidden sm:block" />

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <h1 className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-white">
                  <EncryptedText
                    text="NEURAL GRAPH"
                    revealDelayMs={60}
                    flipDelayMs={30}
                    className="inline-block text-white sm:hidden"
                    encryptedClassName="opacity-40"
                  />
                  <EncryptedText
                    text="NEURAL KNOWLEDGE GRAPH"
                    revealDelayMs={60}
                    flipDelayMs={30}
                    className="hidden sm:inline-block text-white"
                    encryptedClassName="opacity-40"
                  />
                </h1>
              </div>
              <span className="text-[8px] sm:text-[10px] text-white/40 uppercase tracking-widest block hidden sm:block">
                Autonomous Code AST & Relationship Mesh
              </span>
            </div>
          </div>

          {/* 3D/2D Mode Toggle */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/10">
            <button
              onClick={() => setViewMode("3D")}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] uppercase font-mono font-medium tracking-wider transition-all ${
                viewMode === "3D"
                  ? "bg-white/10 text-red-300 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <Box className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>3D</span>
            </button>
            <button
              onClick={() => setViewMode("2D")}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] uppercase font-mono font-medium tracking-wider transition-all ${
                viewMode === "2D"
                  ? "bg-white/10 text-red-300 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>2D</span>
            </button>
          </div>
        </div>

        {/* Row 2: Graph Controls (Search, Filters, Project Selector) */}
        <div className="w-full">
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
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 flex items-center gap-2.5 sm:gap-4 text-[9px] sm:text-[10px] text-white/60 font-mono max-w-[calc(100vw-32px)] overflow-x-auto no-scrollbar">
          <span className="text-white/40 uppercase tracking-widest font-bold hidden sm:inline">LEGEND:</span>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span>PROJECT</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            <span>MODULE</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span>FUNCTION</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            <span>TECH</span>
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
