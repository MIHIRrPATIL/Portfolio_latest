"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Folder from "./Folder";
import Link from "next/link";
import { ProjectCard } from "./ProjectCard";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";

const CARD_H = 130; // Shorter cards
const CARD_GAP = 24;

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  
  // State for activation
  const [isActivated, setIsActivated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Scroll logic
  const SCROLL_MULTIPLIER = 500;
  // If activated, section gets tall to allow scrolling. If not, it's 100vh.
  const sectionHeight = isActivated ? `${projects.length * SCROLL_MULTIPLIER + 1000}px` : '100vh';

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  // Track active index based on scroll when activated
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isActivated) return;
    const rawIndex = latest * (projects.length - 1);
    const newIndex = Math.max(0, Math.min(projects.length - 1, Math.round(rawIndex)));
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  });

  const stepSize = CARD_H + CARD_GAP;
  const maxTravel = (projects.length - 1) * stepSize;
  const carouselY = useTransform(scrollYProgress, [0, 1], [0, -maxTravel]);

  const activeProject = projects[activeIndex];

  return (
    <section
      id="works"
      ref={sectionRef}
      className="relative bg-black transition-[height] duration-500"
      style={{ height: sectionHeight }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center bg-black">
        
        {/* Background Textures */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            right: 0,
            transform: "translate(30%, -50%)",
            width: "800px",
            height: "800px",
            background: "radial-gradient(circle, rgba(252,165,165,0.08) 0%, transparent 60%)",
            borderRadius: "50%",
          }}
        />

        {/* Outer Layout Grid */}
        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-6 md:px-10 lg:px-12 h-full flex flex-col lg:flex-row items-center gap-12 lg:gap-0">
          
          {/* ─── LEFT COLUMN: Info Panel (45%) ─── */}
          <div className="w-full lg:w-[45%] flex flex-col justify-center z-20 pl-0 md:pl-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col mb-4"
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="text-red-300 animate-spin text-4xl md:text-5xl">✱</span>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-black font-sans text-white uppercase tracking-tight leading-none">
                  Selected<br />Works
                </h2>
              </div>
              <p className="text-white/50 text-sm md:text-base font-sans leading-relaxed max-w-md">
                A curated showcase of digital artifacts crafted with high precision, performant code, and unique user experiences.
              </p>
            </motion.div>

            {/* Content Switch via AnimatePresence with Glassy Dividers */}
            <div className="min-h-[280px] flex flex-col justify-center border-y border-white/[0.08] py-8 my-4">
              <AnimatePresence mode="wait">
                {isActivated && activeProject ? (
                  <motion.div
                    key="project-details"
                    className="flex flex-col gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-red-300">
                      <span>{activeProject.category}</span>
                      <span className="w-4 h-px bg-red-300/40" />
                      <span>{activeProject.year}</span>
                    </div>

                    <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
                      {activeProject.title}
                    </h3>

                    <p className="text-white/60 text-sm md:text-base font-sans leading-relaxed max-w-lg">
                      {activeProject.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {activeProject.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 text-[9px] font-mono uppercase tracking-[0.1em] text-white/70 rounded-full border border-white/10 bg-white/[0.02]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/projects/${activeProject.id}`}
                      className="group inline-flex items-center gap-2 mt-2 text-xs font-mono uppercase tracking-[0.2em] text-red-300/90 hover:text-red-300 transition-colors duration-300"
                    >
                      View Project Case Study <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="intro"
                    className="flex flex-col gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-6xl font-black text-white/20 select-none">
                        {String(projects.length).padStart(2, "0")}
                      </span>
                      <div className="flex flex-col font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                        <span>Curated</span>
                        <span className="text-red-300/80">Artifacts</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                       <p className="text-white/70 text-lg md:text-xl uppercase tracking-wide font-black">
                         Ready for Transmission
                       </p>
                       <p className="text-white/40 text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-3">
                         <span className="w-8 h-px bg-red-300/40 animate-pulse" />
                         Engage folder drawer to deploy deck
                       </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View All CTA */}
            <motion.div 
              className="pt-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link
                href="/projects"
                className="group relative inline-flex items-center gap-3 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 rounded-full border border-white/[0.08] transition-all duration-500 hover:text-white hover:border-red-300/40 hover:shadow-[0_0_40px_rgba(252,165,165,0.15)] bg-white/[0.02] backdrop-blur-sm"
              >
                <span>Browse Archives</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN: Spacer (55%) ─── */}
          <div className="w-full lg:w-[55%] h-full relative flex items-center justify-center pointer-events-none" />
        </div>

        {/* The folder - Positioned absolutely relative to the sticky h-screen viewbox container */}
        <motion.div 
          className={cn(
            "absolute z-30 cursor-pointer pointer-events-auto filter drop-shadow-2xl transition-all duration-500 top-1/2 -translate-y-1/2",
            isActivated
              ? "right-[15px] sm:right-[30px] md:right-[50px] lg:right-[80px]"
              : "-right-[80px] sm:-right-[100px] md:-right-[110px] lg:-right-[120px]"
          )}
          // Pop out and rotate into place immediately on render
          initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: -75, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
          onClick={() => {
            const nextState = !isActivated;
            setIsActivated(nextState);
            if (!nextState) {
              // Scroll smoothly back to top of the works section when closing to avoid snaps
              sectionRef.current?.scrollIntoView({ behavior: "smooth" });
              setActiveIndex(0);
            }
          }}
        >
          {/* Breathe animation isolated from spring transition */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Folder 
              color="#fca5a5" 
              size={1.55} 
              hidePapers={false} 
              open={isActivated}
              activeIndex={activeIndex}
              items={projects.map(project => (
                <ProjectCard 
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  description={project.description}
                  category={project.category}
                  tags={project.tags}
                  image={project.image}
                />
              ))} 
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
