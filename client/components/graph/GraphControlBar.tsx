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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4 font-mono w-full">
      {/* Left: Search & Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Search Input */}
        <div className="relative w-full sm:w-56 md:w-64 shrink-0">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="FILTER SYMBOL / PATH..."
            className="w-full pl-8 sm:pl-9 pr-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/10 text-[10px] sm:text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-500/40 focus:bg-white/[0.05] transition-all tracking-wider uppercase"
          />
        </div>

        {/* Node Type Pills */}
        <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/10 overflow-x-auto no-scrollbar">
          {FILTER_OPTIONS.map((f) => {
            const isActive = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] uppercase font-mono font-medium tracking-wider whitespace-nowrap shrink-0 transition-all duration-200 ${
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
      <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 shrink-0">
        {/* Project Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 shrink-0" />
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            aria-label="Filter by project"
            className="bg-black/90 border border-white/10 text-white/80 text-[10px] sm:text-xs rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 focus:outline-none focus:border-red-500/40 uppercase tracking-wider font-mono cursor-pointer hover:border-white/20 transition-colors max-w-[160px] sm:max-w-none truncate"
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
        <div className="flex items-center gap-2 sm:gap-3 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/10 text-[9px] sm:text-[11px] text-white/50">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Network className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
            <span className="text-white font-medium">{nodesCount}</span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider">NODES</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
            <span className="text-white font-medium">{edgesCount}</span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider">EDGES</span>
          </div>
        </div>
      </div>
    </div>
  );
}
