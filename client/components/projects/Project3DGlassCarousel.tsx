"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  GitBranch, 
  Play, 
  Pause, 
  Search, 
  Users, 
  User, 
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

interface Project3DGlassCarouselProps {
  projects: Project[];
  scrollSpeedMs?: number;
  className?: string;
}

export default function Project3DGlassCarousel({
  projects,
  scrollSpeedMs = 2800,
  className
}: Project3DGlassCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = projects.length;

  // Next / Previous Navigation
  const handleNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleJumpTo = (index: number) => {
    setActiveIndex(index);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Automated Infinite Auto-Scroll
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  if (total === 0) return null;

  // Filter projects for search dropdown
  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Compute 3D Transform parameters based on offset from activeIndex
  const getCardTransform = (index: number) => {
    let offset = (index - activeIndex) % total;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);
    const isCenter = offset === 0;

    // Only render cards within a visible range of +/- 2
    if (absOffset > 2) {
      return {
        x: offset > 0 ? 800 : -800,
        z: -300,
        rotateY: offset > 0 ? -60 : 60,
        scale: 0.6,
        opacity: 0,
        zIndex: 0,
        pointerEvents: "none" as const
      };
    }

    // 3D Arc positions
    const xStep = 340;
    const x = offset * xStep;
    const z = isCenter ? 140 : -Math.pow(absOffset, 1.3) * 90;
    const rotateY = -offset * 28;
    const scale = isCenter ? 1.06 : 1 - absOffset * 0.12;
    const opacity = isCenter ? 1 : Math.max(0.25, 0.85 - absOffset * 0.35);
    const zIndex = 20 - absOffset * 5;

    return {
      x,
      z,
      rotateY,
      scale,
      opacity,
      zIndex,
      pointerEvents: isCenter ? ("auto" as const) : ("auto" as const)
    };
  };

  const activeProject = projects[activeIndex];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "relative w-full py-8 md:py-16 flex flex-col items-center select-none overflow-hidden",
        className
      )}
    >
      {/* Top HUD: Search Dropdown & Carousel Status Controls */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-4 mb-10 px-4 z-40">
        {/* Search & Jump Selector */}
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all text-xs font-mono">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search or jump to project..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="bg-transparent border-none outline-none text-white placeholder-white/30 text-xs w-48 sm:w-64"
            />
          </div>

          {/* Search Dropdown Results */}
          <AnimatePresence>
            {isSearchOpen && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute left-0 mt-2 w-72 sm:w-80 max-h-64 overflow-y-auto rounded-2xl bg-[#0a0a0c]/95 border border-white/15 backdrop-blur-2xl p-2 shadow-2xl z-50 font-mono text-xs"
              >
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => {
                    const idx = projects.findIndex((orig) => orig.id === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleJumpTo(idx)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-white/80 hover:text-white"
                      >
                        <span className="truncate font-semibold">{p.title}</span>
                        <span className="text-[10px] text-red-300/60 uppercase">{p.category}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-white/40 text-center">No projects found.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Carousel Telemetry & Auto-Scroll Controller */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/50">
            <span className="text-white font-bold">{String(activeIndex + 1).padStart(2, "0")}</span>
            <span>/</span>
            <span>{String(total).padStart(2, "0")}</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all uppercase tracking-wider text-[11px]"
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                <span>RESUME</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-red-400 fill-red-400" />
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  AUTO
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D Curved Perspective Stage */}
      <div 
        className="relative w-full max-w-6xl h-[540px] md:h-[580px] flex items-center justify-center"
        style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
      >
        {projects.map((project, index) => {
          const style = getCardTransform(index);
          const isCenter = index === activeIndex;
          const serial = String(index + 1).padStart(2, "0");

          return (
            <motion.div
              key={`${project.id}-${index}`}
              animate={{
                x: style.x,
                z: style.z,
                rotateY: style.rotateY,
                scale: style.scale,
                opacity: style.opacity
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 24,
                mass: 0.9
              }}
              onClick={() => {
                if (!isCenter) handleJumpTo(index);
              }}
              style={{
                zIndex: style.zIndex,
                pointerEvents: style.pointerEvents
              }}
              className={cn(
                "absolute top-0 w-[310px] sm:w-[380px] md:w-[420px] h-[520px] rounded-[32px] p-7 md:p-8 flex flex-col justify-between cursor-pointer transition-colors duration-500",
                "bg-[#08080a]/90 backdrop-blur-2xl border",
                isCenter 
                  ? "border-red-500/40 shadow-[0_15px_60px_rgba(239,68,68,0.18)] ring-1 ring-red-500/20" 
                  : "border-white/10 hover:border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
              )}
            >
              {/* Inner Liquid Glass Shimmer Highlight */}
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/[0.06] via-transparent to-transparent pointer-events-none" />

              {/* Card Header: Serial & Category Pill */}
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

                {/* Description Snippet */}
                <p className="text-white/60 text-xs md:text-sm font-sans leading-relaxed line-clamp-4 mb-6">
                  {project.description}
                </p>
              </div>

              {/* Card Footer: Tech Stack Chips & Action Links */}
              <div className="relative z-10 pt-4 border-t border-white/10 space-y-4">
                {/* Tech Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-[10px] uppercase tracking-wider text-white/60"
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
                    <span>Dossier</span>
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

      {/* Bottom Floating Navigation Controls */}
      <div className="flex items-center gap-6 mt-8 z-30">
        <button
          onClick={handlePrev}
          aria-label="Previous Project"
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0d0d10] border border-white/10 hover:border-red-500/40 text-white/60 hover:text-white hover:bg-red-500/10 transition-all shadow-lg active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dynamic Dot Pagination */}
        <div className="flex items-center gap-2">
          {projects.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleJumpTo(idx)}
              aria-label={`Jump to project ${idx + 1}`}
              className={cn(
                "transition-all duration-300 rounded-full",
                idx === activeIndex
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
      </div>
    </div>
  );
}
