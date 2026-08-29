"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitBranch,
  ArrowRight,
  Users,
  User,
  Sparkles,
  Pause,
  Play,
  Layers,
  Terminal
} from "lucide-react";
import { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

interface ChainProjectCarouselProps {
  projects: Project[];
  scrollSpeedMs?: number;
  visibleItemCount?: number;
  className?: string;
  onProjectSelect?: (projectId: string, projectTitle: string) => void;
}

export default function ChainProjectCarousel({
  projects,
  scrollSpeedMs = 2600,
  visibleItemCount = 5,
  className,
  onProjectSelect
}: ChainProjectCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = projects.length;

  // Next and Previous navigation
  const handleNext = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleSelect = (index: number) => {
    setCurrentIndex(index);
    setIsSearchOpen(false);
    setSearchQuery("");
    if (onProjectSelect && projects[index]) {
      onProjectSelect(projects[index].id, projects[index].title);
    }
  };

  // Infinite Automated Auto-Scroll
  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, scrollSpeedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, scrollSpeedMs, handleNext]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (total === 0) return null;

  // Search Filter
  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Compute visible items window centered on currentIndex
  const half = Math.floor(visibleItemCount / 2);
  const visibleIndices: { index: number; offset: number }[] = [];

  for (let offset = -half; offset <= half; offset++) {
    const index = (currentIndex + offset + total * 10) % total;
    visibleIndices.push({ index, offset });
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "relative w-full py-8 md:py-16 flex flex-col items-center select-none overflow-hidden",
        className
      )}
    >
      {/* 1. Lightswind Search Bar & Interactive Focus Selector */}
      <div ref={searchContainerRef} className="relative z-50 mb-10 w-full max-w-md px-4">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-white/40 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search projects by title, stack, category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-11 pr-24 py-3 rounded-2xl bg-white/[0.04] border border-white/15 focus:border-red-500/50 focus:bg-black/90 text-white placeholder-white/40 text-xs md:text-sm font-mono outline-none shadow-2xl transition-all backdrop-blur-xl"
          />
          <div className="absolute right-3 flex items-center gap-1.5 font-mono text-[10px] text-white/40 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
            <span>{String(currentIndex + 1).padStart(2, "0")}</span>
            <span>/</span>
            <span>{String(total).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Dropdown Results */}
        <AnimatePresence>
          {isSearchOpen && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute left-4 right-4 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-[#09090c]/98 border border-white/20 backdrop-blur-2xl p-2 shadow-2xl z-50 font-mono text-xs"
            >
              {filteredProjects.length > 0 ? (
                filteredProjects.map((p) => {
                  const idx = projects.findIndex((orig) => orig.id === p.id);
                  const isCurr = idx === currentIndex;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(idx)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between",
                        isCurr ? "bg-red-500/20 text-red-300 border border-red-500/30" : "hover:bg-white/10 text-white/80 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <span className="truncate font-semibold text-white">{p.title}</span>
                      </div>
                      <span className="text-[10px] text-white/40 uppercase shrink-0 pl-2">{p.category}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-white/40 text-center font-mono">No matching project found.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Lightswind Connecting Horizontal Laser Beam / Rail */}
      <div className="relative w-full max-w-7xl flex items-center justify-center my-4">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
        <div className="absolute w-3/5 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none blur-[1px]" />
      </div>

      {/* 3. Horizontal Chain Cards Layout */}
      <div className="relative w-full max-w-7xl h-[520px] md:h-[560px] flex items-center justify-center overflow-visible">
        {/* Left & Right Edge Vignette Gradient Masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 md:w-36 bg-gradient-to-r from-black via-black/80 to-transparent z-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 md:w-36 bg-gradient-to-l from-black via-black/80 to-transparent z-40" />

        {/* Render Chain Items */}
        <div className="relative w-full h-full flex items-center justify-center">
          {visibleIndices.map(({ index, offset }) => {
            const project = projects[index];
            const isCenter = offset === 0;
            const absOffset = Math.abs(offset);
            const serial = String(index + 1).padStart(2, "0");

            // Horizontal position offset
            const xOffset = offset * 330;
            const scale = isCenter ? 1.05 : Math.max(0.72, 1 - absOffset * 0.14);
            const opacity = isCenter ? 1 : Math.max(0.2, 0.8 - absOffset * 0.3);
            const zIndex = isCenter ? 30 : 20 - absOffset * 5;

            return (
              <motion.div
                key={`${project.id}-${index}-${offset}`}
                animate={{
                  x: xOffset,
                  scale: scale,
                  opacity: opacity
                }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 26,
                  mass: 0.85
                }}
                onClick={() => {
                  if (!isCenter) handleSelect(index);
                }}
                style={{ zIndex }}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-[290px] sm:w-[350px] md:w-[390px] h-[480px] md:h-[510px] rounded-[32px] p-7 md:p-8 flex flex-col justify-between cursor-pointer transition-colors duration-300",
                  "bg-[#09090c]/90 backdrop-blur-2xl border",
                  isCenter
                    ? "border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.22)] ring-1 ring-red-500/30"
                    : "border-white/10 hover:border-white/25 shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
                )}
              >
                {/* Liquid Glass Highlight Overlay */}
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />

                {/* Top Header: Serial & Category */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                    <span className="font-mono text-xs uppercase tracking-[0.25em] text-red-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-red-400" />
                      {serial} // {project.category}
                    </span>

                    {project.isTeamProject ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-red-500/10 border border-red-400/30 text-red-300">
                        <Users className="w-3 h-3" /> TEAM
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-white/5 border border-white/10 text-white/50">
                        <User className="w-3 h-3" /> SOLO
                      </span>
                    )}
                  </div>

                  {/* Project Title */}
                  <Link
                    href={`/projects/${project.id}`}
                    onClick={(e) => {
                      if (!isCenter) e.preventDefault();
                    }}
                    className="block group/link mb-3"
                  >
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover/link:text-red-300 transition-colors flex items-center justify-between gap-3">
                      <span className="truncate">{project.title}</span>
                      <ExternalLink className="w-5 h-5 text-white/30 group-hover/link:text-red-300 shrink-0 transition-colors" />
                    </h3>
                  </Link>

                  {/* Description */}
                  <p className="text-white/60 text-xs md:text-sm font-sans leading-relaxed line-clamp-4 mb-6 font-normal">
                    {project.description}
                  </p>
                </div>

                {/* Bottom Footer: Tech Stack & Actions */}
                <div className="relative z-10 pt-4 border-t border-white/10 space-y-4">
                  {/* Tech Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[10px] uppercase tracking-wider text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/projects/${project.id}`}
                      onClick={(e) => {
                        if (!isCenter) e.preventDefault();
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold transition-all",
                        isCenter
                          ? "bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                          : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                      )}
                    >
                      <span>Inspect Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-colors"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      </a>
                    )}

                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-colors"
                        title="GitHub Repository"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Controls: Chevrons, Pagination Dots & Auto-Scroll Controller */}
      <div className="flex items-center gap-6 mt-8 z-30 font-mono">
        <button
          onClick={handlePrev}
          aria-label="Previous Project"
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0d0d10] border border-white/10 hover:border-red-500/40 text-white/60 hover:text-white hover:bg-red-500/10 transition-all shadow-lg active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dynamic Pagination Pill */}
        <div className="flex items-center gap-2">
          {projects.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              aria-label={`Jump to project ${idx + 1}`}
              className={cn(
                "transition-all duration-300 rounded-full",
                idx === currentIndex
                  ? "w-8 h-2 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                  : "w-2 h-2 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          aria-label="Next Project"
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0d0d10] border border-white/10 hover:border-red-500/40 text-white/60 hover:text-white hover:bg-red-500/10 transition-all shadow-lg active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Auto Scroll Pause/Resume Toggle */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="ml-2 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all text-xs uppercase tracking-wider"
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 text-red-400 fill-red-400" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Auto-Scroll
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
