"use client";

import React from "react";
import { Search, Layers, Network, Activity } from "lucide-react";

interface GraphControlBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedFilter: string;
  onFilterChange: (f: string) => void;
  projects: string[];
  selectedProject: string;
  onProjectChange: (p: string) => void;
  nodesCount: number;
  edgesCount: number;
}

const FILTER_OPTIONS = [
  { id: "ALL", label: "ALL" },
  { id: "PROJECT", label: "PROJECTS" },
  { id: "FILE", label: "MODULES" },
  { id: "FUNCTION", label: "FUNCTIONS" },
  { id: "TECHNOLOGY", label: "TECH STACK" }
];

export default function GraphControlBar({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  projects,
  selectedProject,
  onProjectChange,
  nodesCount,
  edgesCount
}: GraphControlBarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 font-mono">
      {/* Left: Search & Filter Pills */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="FILTER BY SYMBOL OR PATH..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-500/40 focus:bg-white/[0.05] transition-all tracking-wider uppercase text-[11px]"
          />
        </div>

        {/* Node Type Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/10">
          {FILTER_OPTIONS.map((f) => {
            const isActive = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-medium tracking-wider transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-red-300 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                    : "text-white/40 hover:text-white/80 border border-transparent"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Project Filter Dropdown & Telemetry Stats */}
      <div className="flex items-center gap-4">
        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-red-400" />
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            aria-label="Filter by project"
            className="bg-black/90 border border-white/10 text-white/80 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-red-500/40 uppercase tracking-wider font-mono cursor-pointer hover:border-white/20 transition-colors"
          >
            <option value="">ALL PROJECTS</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Telemetry Stats Counter */}
        <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-white/50">
          <div className="flex items-center gap-1.5">
            <Network className="w-3 h-3 text-red-400" />
            <span className="text-white font-medium">{nodesCount}</span>
            <span className="text-[9px] uppercase tracking-wider">NODES</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-red-400" />
            <span className="text-white font-medium">{edgesCount}</span>
            <span className="text-[9px] uppercase tracking-wider">EDGES</span>
          </div>
        </div>
      </div>
    </div>
  );
}
