"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Users, User, ExternalLink, Code2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

interface DossierCardProps {
  project: Project;
  index: number;
  className?: string;
}

export const DossierCard: React.FC<DossierCardProps> = ({ project, index, className }) => {
  const serial = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: "easeOut" } }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.04 }}
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl bg-[#0a0a0f] hover:bg-[#111118] border border-white/[0.08] hover:border-red-300/40 p-8 sm:p-10 transition-colors duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.9)]",
        className
      )}
    >
      {/* Corner CAD Crosshairs */}
      <div className="absolute top-3 left-3 text-white/20 font-mono text-[10px] select-none pointer-events-none group-hover:text-red-300/60 transition-colors">+</div>
      <div className="absolute top-3 right-3 text-white/20 font-mono text-[10px] select-none pointer-events-none group-hover:text-red-300/60 transition-colors">+</div>
      <div className="absolute bottom-3 left-3 text-white/20 font-mono text-[10px] select-none pointer-events-none group-hover:text-red-300/60 transition-colors">+</div>
      <div className="absolute bottom-3 right-3 text-white/20 font-mono text-[10px] select-none pointer-events-none group-hover:text-red-300/60 transition-colors">+</div>

      {/* Main Card Content */}
      <div>
        {/* Top Header: Index & Classification Pill */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-red-300">
              //{serial}
            </span>
            <span className="text-white/20 font-mono text-xs">/</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 truncate max-w-[200px]">
              {project.category || "Engineering"}
            </span>
          </div>

          {project.isTeamProject ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/[0.04] border border-white/10 text-neutral-300 group-hover:text-red-300/90 transition-colors">
              <Users className="w-3 h-3 text-red-300" />
              <span>{project.owner && project.owner.toLowerCase() !== "mihirrpatil" ? `@${project.owner}` : "Team"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/[0.02] border border-white/[0.06] text-neutral-500">
              <User className="w-3 h-3 text-neutral-500" />
              <span>Solo</span>
            </span>
          )}
        </div>

        {/* Project Title with Arrow Indicator */}
        <Link href={`/projects/${project.id}`} className="block group/title mb-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-white group-hover/title:text-red-200 transition-colors">
              {project.title}
            </h3>
            <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 group-hover/title:bg-red-300 group-hover/title:text-black text-neutral-400 flex items-center justify-center shrink-0 transition-all">
              <ArrowUpRight className="w-4 h-4 group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Technical Synopsis */}
        <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed line-clamp-3 mb-6">
          {project.description || "Comprehensive software engineering dossier detailing system architecture and core capabilities."}
        </p>

        {/* Tech Stack Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {project.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono text-neutral-300 group-hover:text-white px-3 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] group-hover:border-white/15 transition-colors"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="text-[10px] font-mono text-neutral-500 px-2 py-1">
                +{project.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Action Links & Year */}
      <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-mono text-xs font-bold tracking-wider hover:bg-red-300 transition-colors shadow-sm cursor-pointer"
          >
            <span>EXPLORE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white font-mono text-xs transition-colors cursor-pointer"
              title="Live Production Deployment"
            >
              <span>LIVE</span>
              <ExternalLink className="w-3 h-3 text-red-300" />
            </a>
          )}

          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="GitHub Source Repository"
            >
              <Code2 className="w-4 h-4" />
            </a>
          )}
        </div>

        <span className="font-mono text-xs uppercase tracking-wider text-neutral-500 font-semibold">
          {project.year || "2026"}
        </span>
      </div>
    </motion.div>
  );
};
