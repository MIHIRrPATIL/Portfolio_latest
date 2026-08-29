"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter, RotateCcw } from "lucide-react";
import { fetchAllProjects, Project } from "@/data/projects";
import { DossierCard } from "./DossierCard";

const CATEGORIES = [
  { id: "ALL", label: "ALL" },
  { id: "AI", label: "AI & SPEECH" },
  { id: "SYSTEMS", label: "SYSTEMS & OS" },
  { id: "FINTECH", label: "FINTECH & QUANT" },
  { id: "FRONTEND", label: "FRONTEND UI" },
  { id: "TEAM", label: "TEAM PROJECTS" },
  { id: "SOLO", label: "SOLO" },
];

export default function ProjectGrid() {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  useEffect(() => {
    fetchAllProjects()
      .then((data) => {
        if (data && data.length > 0) {
          // Strict deduplication by project ID
          const seen = new Set<string>();
          const deduped = data.filter((p) => {
            if (!p.id || seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
          setProjectList(deduped);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  // Filter projects based on search query and category pill
  const filteredProjects = useMemo(() => {
    const seen = new Set<string>();
    return projectList.filter((project) => {
      // Avoid duplicate IDs
      if (seen.has(project.id)) return false;

      // 1. Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        project.title.toLowerCase().includes(q) ||
        project.category.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.tags.some((t) => t.toLowerCase().includes(q)) ||
        (project.owner && project.owner.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // 2. Category filter
      let matchesCategory = true;
      if (activeCategory === "TEAM") matchesCategory = Boolean(project.isTeamProject);
      else if (activeCategory === "SOLO") matchesCategory = !project.isTeamProject;
      else if (activeCategory !== "ALL") {
        const catString = (project.category + " " + project.tags.join(" ")).toLowerCase();
        if (activeCategory === "AI") {
          matchesCategory = catString.includes("speech") || catString.includes("asr") || catString.includes("ai") || catString.includes("ml") || catString.includes("learning");
        } else if (activeCategory === "SYSTEMS") {
          matchesCategory = catString.includes("os") || catString.includes("system") || catString.includes("vault") || catString.includes("security") || catString.includes("cloud") || catString.includes("rust") || catString.includes("go");
        } else if (activeCategory === "FINTECH") {
          matchesCategory = catString.includes("trading") || catString.includes("options") || catString.includes("fintech") || catString.includes("quant") || catString.includes("wealth");
        } else if (activeCategory === "FRONTEND") {
          matchesCategory = catString.includes("ui") || catString.includes("frontend") || catString.includes("react") || catString.includes("next") || catString.includes("portfolio");
        }
      }

      if (matchesCategory) {
        seen.add(project.id);
        return true;
      }
      return false;
    });
  }, [projectList, searchQuery, activeCategory]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveCategory("ALL");
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-8 py-6">
        {/* Skeleton Filter Bar */}
        <div className="w-full h-12 rounded-2xl bg-neutral-900/50 border border-neutral-800 animate-pulse" />
        
        {/* Skeleton Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-[320px] rounded-3xl bg-neutral-950 border border-neutral-800/60 animate-pulse flex flex-col justify-between p-8"
            >
              <div className="space-y-4">
                <div className="w-1/3 h-3.5 bg-neutral-800 rounded-full" />
                <div className="w-2/3 h-7 bg-neutral-800 rounded-lg" />
                <div className="w-full h-14 bg-neutral-900 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-5 bg-neutral-800 rounded-md" />
                <div className="w-16 h-5 bg-neutral-800 rounded-md" />
                <div className="w-16 h-5 bg-neutral-800 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section id="projects-matrix" className="w-full space-y-10">
      
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 sm:p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 backdrop-blur-md">
        
        {/* Search Input Field */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, technology, or domain..."
            className="w-full bg-neutral-900/80 text-white text-xs font-mono rounded-xl border border-neutral-800 focus:border-red-300/50 pl-9 pr-8 py-2.5 outline-none transition-colors placeholder:text-neutral-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Telemetry Counter */}
        <div className="flex items-center justify-between md:justify-end gap-3 px-2 font-mono text-xs text-neutral-400">
          <span>
            SHOWING <span className="text-white font-semibold">{filteredProjects.length}</span> OF {projectList.length} DOSSIERS
          </span>

          {(searchQuery || activeCategory !== "ALL") && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-red-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Category Filter Pills with Smooth Shared Layout Pill */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative px-4 py-2 rounded-full font-mono text-xs transition-colors whitespace-nowrap cursor-pointer ${
                isActive ? "text-black font-bold" : "text-neutral-400 hover:text-white border border-neutral-800/80 bg-neutral-950/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategoryIndicator"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-white rounded-full z-0 shadow-md"
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Projects Grid Display with Smooth Entry Animations */}
      {filteredProjects.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <DossierCard
                key={`${project.id}-${project.owner || "repo"}-${index}`}
                project={project}
                index={index}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full py-24 rounded-3xl border border-neutral-900 bg-neutral-950/40 text-center flex flex-col items-center justify-center p-8 space-y-4"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            NO ARCHIVED DOSSIERS MATCHING "{searchQuery || activeCategory}"
          </span>
          <p className="text-neutral-500 text-xs font-mono max-w-sm">
            Try adjusting your search criteria or resetting filters to browse all engineering repositories.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-800 hover:border-red-300/50 text-neutral-200 hover:text-white font-mono text-xs transition-colors mt-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET ALL FILTERS</span>
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
