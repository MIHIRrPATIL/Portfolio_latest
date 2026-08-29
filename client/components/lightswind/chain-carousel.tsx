"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LucideIcon,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Code2,
} from "lucide-react";

// --- Core Data Interface ---
export interface ChainItem {
  id: string | number;
  name: string;
  icon?: LucideIcon;
  details?: string;
  category?: string;
  description?: string;
  tags?: string[];
  liveUrl?: string;
  repoUrl?: string;
  isTeamProject?: boolean;
  owner?: string;
  year?: string;
  logo?: string;
}

// --- Internal Animated Type ---
type AnimatedChainItem = ChainItem & {
  distanceFromCenter: number;
  originalIndex: number;
};

// --- Component Props Interfaces ---
interface CarouselItemProps {
  chain: AnimatedChainItem;
  side: "left" | "right";
  onItemClick?: (id: ChainItem["id"], name: string) => void;
}

export interface ChainCarouselProps {
  items: ChainItem[];
  scrollSpeedMs?: number;
  visibleItemCount?: number;
  className?: string;
  onChainSelect?: (chainId: ChainItem["id"], chainName: string) => void;
}

/** 
 * Flanking Arc Item - Minimal, sleek, and unobtrusive.
 */
const CarouselItemCard: React.FC<CarouselItemProps> = ({ chain, side, onItemClick }) => {
  const { distanceFromCenter, id, name, details, category, icon: FallbackIcon } = chain;
  const distance = Math.abs(distanceFromCenter);

  // Smooth mathematical curve geometry
  const opacity = Math.max(0.12, 1 - distance * 0.25);
  const scale = Math.max(0.75, 1 - distance * 0.08);
  const yOffset = distanceFromCenter * 80;
  const xOffset = side === "left" ? -Math.pow(distance, 1.2) * 45 : Math.pow(distance, 1.2) * 45;

  const IconComponent = FallbackIcon || Code2;

  return (
    <motion.div
      key={id}
      onClick={() => onItemClick && onItemClick(id, name)}
      className={`absolute flex items-center gap-3 cursor-pointer select-none transition-colors duration-300 group
        ${side === "left" ? "flex-row-reverse text-right" : "flex-row text-left"}`}
      animate={{
        opacity,
        scale,
        y: yOffset,
        x: xOffset,
      }}
      transition={{
        duration: 0.45,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <div className="w-8 h-8 rounded-full bg-neutral-900/90 border border-neutral-800 group-hover:border-neutral-600 flex items-center justify-center shrink-0 transition-colors">
        <IconComponent className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-xs sm:text-sm font-mono font-medium text-neutral-300 group-hover:text-white transition-colors truncate max-w-[200px] sm:max-w-[240px]">
          {name}
        </span>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider truncate max-w-[200px] sm:max-w-[240px]">
          {category || details || "Project"}
        </span>
      </div>
    </motion.div>
  );
};

// --- Main Component ---

export const ChainCarousel: React.FC<ChainCarouselProps> = ({
  items = [],
  scrollSpeedMs = 3200,
  visibleItemCount = 9,
  className = "",
  onChainSelect,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const totalItems = items?.length || 0;

  // 1. Auto-scroll interval
  useEffect(() => {
    if (isPaused || totalItems === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, scrollSpeedMs);

    return () => clearInterval(interval);
  }, [isPaused, totalItems, scrollSpeedMs]);

  // 2. Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === " ") {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalItems]);

  // Memoized visible items
  const getVisibleItems = useCallback((): AnimatedChainItem[] => {
    const visibleItems: AnimatedChainItem[] = [];
    if (totalItems === 0) return [];

    const itemsToShow = visibleItemCount % 2 === 0 ? visibleItemCount + 1 : visibleItemCount;
    const half = Math.floor(itemsToShow / 2);

    for (let i = -half; i <= half; i++) {
      let index = currentIndex + i;
      if (index < 0) index += totalItems;
      if (index >= totalItems) index -= totalItems;

      visibleItems.push({
        ...items[index],
        originalIndex: index,
        distanceFromCenter: i,
      });
    }
    return visibleItems;
  }, [currentIndex, items, totalItems, visibleItemCount]);

  // Filtered list for search dropdown
  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.details && item.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [items, searchTerm]);

  const handleSelectChain = (id: ChainItem["id"], name: string) => {
    const index = items.findIndex((c) => c.id === id);
    if (index !== -1) {
      setCurrentIndex(index);
      setIsPaused(true);
      if (onChainSelect) {
        onChainSelect(id, name);
      }
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handlePrev = () => {
    if (totalItems === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setIsPaused(true);
  };

  const handleNext = () => {
    if (totalItems === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalItems);
    setIsPaused(true);
  };

  if (totalItems === 0) {
    return (
      <div className="w-full py-20 flex items-center justify-center font-mono text-xs text-neutral-500 uppercase tracking-widest">
        Loading directory...
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div
      id="chain-carousel-stage"
      className={`relative w-full max-w-6xl mx-auto py-6 select-none ${className}`}
    >
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 min-h-[480px]">
        
        {/* Left Arc */}
        <div
          className="relative w-full max-w-[300px] h-[440px] hidden lg:flex items-center justify-center"
          onMouseEnter={() => !searchTerm && setIsPaused(true)}
          onMouseLeave={() => !searchTerm && setIsPaused(false)}
        >
          {/* Top/Bottom Fade */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-0 h-20 w-full bg-gradient-to-b from-black to-transparent" />
            <div className="absolute bottom-0 h-20 w-full bg-gradient-to-t from-black to-transparent" />
          </div>

          {getVisibleItems()
            .filter((chain) => chain.distanceFromCenter < 0)
            .map((chain) => (
              <CarouselItemCard
                key={`left-${chain.id}-${chain.originalIndex}`}
                chain={chain}
                side="left"
                onItemClick={(id, name) => handleSelectChain(id, name)}
              />
            ))}
        </div>

        {/* Center Active Spotlight - Simple, Minimalist & Focused */}
        <div className="relative z-20 w-full max-w-lg px-4 flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`spotlight-${currentItem.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col items-center text-center w-full"
            >
              {/* Category & Index */}
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">
                <span className="text-red-300 font-semibold">{currentItem.category || "Case Study"}</span>
                <span>/</span>
                <span>{String(currentIndex + 1).padStart(2, "0")} of {String(totalItems).padStart(2, "0")}</span>
              </div>

              {/* Project Title */}
              <h2 className="text-2xl sm:text-4xl font-bold font-mono text-white tracking-tight mb-3">
                {currentItem.name}
              </h2>

              {/* Clean Concise Description */}
              {currentItem.description && (
                <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed line-clamp-2 max-w-md mb-4">
                  {currentItem.description}
                </p>
              )}

              {/* Tech Stack Pills - Subtle and Clean */}
              {currentItem.tags && currentItem.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                  {currentItem.tags.slice(0, 4).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono text-neutral-400 px-2.5 py-0.5 rounded-md border border-neutral-800/80 bg-neutral-900/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Minimal Action Buttons */}
              <div className="flex items-center gap-3 mb-6">
                <Link
                  href={`/projects/${currentItem.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-mono text-xs font-semibold tracking-wider hover:bg-neutral-200 transition-colors"
                >
                  <span>EXPLORE CASE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {currentItem.liveUrl && (
                  <a
                    href={currentItem.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
                  >
                    <span>LIVE DEMO</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Stepper Bar + Search */}
          <div className="w-full max-w-sm flex flex-col items-center gap-3">
            
            {/* Stepper Buttons & Status */}
            <div className="flex items-center justify-between w-full px-4 py-1.5 rounded-full border border-neutral-800/80 bg-neutral-950/60 font-mono text-xs">
              <button
                onClick={handlePrev}
                className="p-1 text-neutral-400 hover:text-white transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPaused((p) => !p)}
                className="text-[10px] tracking-widest text-neutral-500 hover:text-neutral-300 uppercase transition-colors"
              >
                {isPaused ? "PAUSED (CLICK TO PLAY)" : "AUTO ROTATING"}
              </button>

              <button
                onClick={handleNext}
                className="p-1 text-neutral-400 hover:text-white transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clean Minimal Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                placeholder="Search projects..."
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  setShowDropdown(val.length > 0);
                  if (val === "") setIsPaused(false);
                }}
                onFocus={() => {
                  if (searchTerm.length > 0) setShowDropdown(true);
                  setIsPaused(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowDropdown(false), 200);
                }}
                className="w-full bg-neutral-950/80 text-white text-xs font-mono rounded-full border border-neutral-800/80 focus:border-neutral-600 pl-8 pr-7 py-2 outline-none transition-colors placeholder:text-neutral-600"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setShowDropdown(false);
                    setIsPaused(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dropdown */}
              {showDropdown && filteredItems.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-neutral-950 rounded-xl border border-neutral-800 z-40 max-h-48 overflow-y-auto p-1 font-mono text-xs shadow-2xl">
                  {filteredItems.slice(0, 6).map((chain) => (
                    <div
                      key={chain.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectChain(chain.id, chain.name);
                      }}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-neutral-900 rounded-lg text-white"
                    >
                      <span className="font-medium truncate">{chain.name}</span>
                      <span className="text-[10px] text-neutral-500 uppercase ml-2 shrink-0">{chain.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Arc */}
        <div
          className="relative w-full max-w-[300px] h-[440px] hidden lg:flex items-center justify-center"
          onMouseEnter={() => !searchTerm && setIsPaused(true)}
          onMouseLeave={() => !searchTerm && setIsPaused(false)}
        >
          {/* Top/Bottom Fade */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-0 h-20 w-full bg-gradient-to-b from-black to-transparent" />
            <div className="absolute bottom-0 h-20 w-full bg-gradient-to-t from-black to-transparent" />
          </div>

          {getVisibleItems()
            .filter((chain) => chain.distanceFromCenter > 0)
            .map((chain) => (
              <CarouselItemCard
                key={`right-${chain.id}-${chain.originalIndex}`}
                chain={chain}
                side="right"
                onItemClick={(id, name) => handleSelectChain(id, name)}
              />
            ))}
        </div>

      </div>
    </div>
  );
};

export default ChainCarousel;