"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award, Zap } from "lucide-react";

interface AchievementItem {
  id: number;
  title: string;
  category: string;
  location: string;
  description: string;
  imageUrl: string;
}

const achievementItems: AchievementItem[] = [
  {
    id: 1,
    title: "Global AI Hackathon",
    category: "1ST PLACE // WINNER",
    location: "International AI Challenge 2025",
    description: "Architected an autonomous multi-agent research orchestrator using CrewAI & FastMCP.",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "ETH Global Hackathon",
    category: "NATIONAL CHAMPION",
    location: "ETH Global 2025",
    description: "Built a zero-knowledge verifiable execution engine for decentralized edge AI nodes.",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "DeepTech Agent Buildathon",
    category: "GRAND PRIZE WINNER",
    location: "DeepTech Summit 2025",
    description: "Engineered a sub-50ms local LLM inference pipeline with real-time audio RAG.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Smart India Hackathon",
    category: "BEST INNOVATION",
    location: "SIH National Finals 2024",
    description: "Created an autonomous cyber threat anomaly detection system utilizing Isolation Forests.",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "OpenAI Agent Challenge",
    category: "RUNNER UP",
    location: "OpenAI DevDay 2024",
    description: "Pioneered a self-healing distributed edge swarm protocol for multi-robot routing.",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
  },
];

interface AccordionItemProps {
  item: AchievementItem;
  isActive: boolean;
  onMouseEnter: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ item, isActive, onMouseEnter }) => {
  return (
    <motion.div
      layout
      initial={false}
      animate={{
        width: isActive ? "380px" : "80px",
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 24,
      }}
      className={`
        relative h-120 md:h-135 rounded-3xl overflow-hidden cursor-pointer
        border shrink-0 select-none
        ${
          isActive
            ? "border-red-300/40 shadow-[0_0_60px_rgba(252,165,165,0.2)] bg-[#161618]"
            : "border-white/10 bg-[#0e0e10] hover:border-white/25"
        }
      `}
      onMouseEnter={onMouseEnter}
    >
      {/* Background Image with Zoom & Grayscale Animation */}
      <img
        src={item.imageUrl}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
          isActive ? "scale-105 brightness-95 contrast-105" : "scale-100 brightness-40 opacity-30 grayscale"
        }`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop";
        }}
      />

      {/* Cyber Overlay Gradient */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isActive 
          ? "bg-linear-to-t from-black via-black/40 to-transparent opacity-95" 
          : "bg-black/60"
      }`} />

      {/* Animated Red Laser Pulse Bar */}
      {isActive && (
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4 }}
          className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-red-300 to-transparent shadow-[0_0_20px_rgba(252,165,165,0.9)] origin-left z-20" 
        />
      )}

      {/* Expanded Active Card Content */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="expanded-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-10"
          >
            {/* Top Badge */}
            <motion.div 
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="flex justify-between items-center"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-red-300/35 text-red-300 flex items-center gap-1.5 shadow-md">
                <Trophy className="w-3.5 h-3.5 text-red-300" />
                {item.category}
              </span>
            </motion.div>

            {/* Bottom Narrative Block */}
            <div className="space-y-3">
              <motion.span 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 block"
              >
                {item.location}
              </motion.span>
              
              <motion.h3 
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide leading-tight"
              >
                {item.title}
              </motion.h3>

              <motion.p 
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.25 }}
                className="text-white/80 text-xs md:text-sm font-sans leading-relaxed"
              >
                {item.description}
              </motion.p>
            </div>
          </motion.div>
        ) : (
          /* Collapsed Vertical Title Bar */
          <motion.span
            key="collapsed-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute text-white/70 font-mono text-xs uppercase tracking-[0.25em] whitespace-nowrap transition-all duration-300 ease-in-out w-auto text-left bottom-28 left-1/2 -translate-x-1/2 rotate-90 pointer-events-none"
          >
            {item.title}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function AchievementsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="achievements" className="w-full bg-black text-white px-6 md:px-16 lg:px-24 py-20 md:py-32 border-t border-white/10 overflow-hidden">
      <div className="max-w-450 mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Side: Header & Context */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-red-300 animate-spin text-4xl md:text-5xl">✱</span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-red-300">
              Track Record // Hackathons
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black font-sans text-white uppercase tracking-tight leading-none mb-6">
            Victories & <br />
            <span className="text-red-300">Achievements.</span>
          </h2>

          <p className="text-white/70 text-base md:text-lg font-sans leading-relaxed max-w-xl mb-8">
            Competing in over two dozen hackathons has been my ultimate testing ground. From high-pressure 48-hour sprints to national AI competitions, here are key milestones built under pressure.
          </p>

          <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.2em] text-white/50 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-red-300" />
              <span>24+ Hackathons</span>
            </div>
            <div className="w-3 h-px bg-white/20" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-300" />
              <span>12 Podium Wins</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Image Accordion */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end">
          <div className="flex flex-row items-center justify-start md:justify-center gap-3 md:gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar w-full">
            {achievementItems.map((item, index) => (
              <AccordionItem
                key={item.id}
                item={item}
                isActive={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
