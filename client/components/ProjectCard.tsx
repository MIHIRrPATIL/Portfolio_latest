"use client";
import React, { useState } from "react";
import { easeOut, motion } from "motion/react";
import { ArrowRight, FileText, ExternalLink, Users, User } from "lucide-react";
import Link from "next/link";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  image?: string;
  isTeamProject?: boolean;
  owner?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ id, title, description, category, tags, image, isTeamProject, owner }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const isTouchDevice =
    typeof window !== "undefined" && "ontouchstart" in window;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTouchDevice) setIsFlipped(!isFlipped);
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsFlipped(true);
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice) setIsFlipped(false);
  };

  const cardVariants = {
    front: { rotateY: 0, transition: { duration: 0.5, ease: easeOut } },
    back: { rotateY: 180, transition: { duration: 0.5, ease: easeOut } },
  };

  return (
    <div
      className="relative w-full h-full perspective-1000 cursor-pointer select-none"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ══════ FRONT SIDE ══════ */}
      <motion.div
        className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden bg-[#161618] border border-white/10 flex flex-col p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        animate={isFlipped ? "back" : "front"}
        variants={cardVariants}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Header Block */}
        <div className="flex flex-col gap-0.5 mb-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 block leading-normal">
              Dossier
            </span>
            {isTeamProject ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-[0.1em] bg-red-500/15 border border-red-300/30 text-red-300">
                <Users className="w-2.5 h-2.5" /> Team
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-[0.1em] bg-white/5 border border-white/10 text-white/50">
                <User className="w-2.5 h-2.5" /> Solo
              </span>
            )}
          </div>
          <h3 className="text-white font-black text-xs md:text-sm uppercase tracking-wide leading-snug mt-0.5">
            {title}
          </h3>
          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-red-300 block mt-0.5 leading-normal">
            {category} {owner && owner.toLowerCase() !== 'mihirrpatil' ? `• @${owner}` : ''}
          </span>
        </div>

        {/* Icon / Image Container Area */}
        <div className="relative w-full flex-1 min-h-0 rounded-xl bg-[#0e0e10] border border-red-300/15 flex items-center justify-center overflow-hidden my-2.5">
          <div className="absolute inset-0 bg-gradient-to-t from-red-300/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-red-300/10 blur-xl rounded-full pointer-events-none" />
          <div className="relative z-10 w-10 h-10 rounded-xl border border-red-300/25 bg-red-300/10 flex items-center justify-center shadow-[0_0_15px_rgba(252,165,165,0.1)]">
            <span className="text-red-300 text-base font-black uppercase">{id.charAt(0)}</span>
          </div>
        </div>

        {/* Bottom CTA Button */}
        <Link
          href={`/projects/${id}`}
          onClick={(e) => e.stopPropagation()}
          className="group flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-red-950/40 border border-red-300/20 text-white font-mono text-[8px] uppercase tracking-[0.15em] hover:bg-red-300/20 hover:border-red-300/40 hover:text-red-300 transition-all duration-300 mt-auto"
        >
          <span>View Details</span> <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>

      {/* ══════ BACK SIDE ══════ */}
      <motion.div
        className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden bg-[#161618] border border-white/10 flex flex-col p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        initial={{ rotateY: 180 }}
        animate={isFlipped ? "front" : "back"}
        variants={cardVariants}
        style={{ transformStyle: "preserve-3d", rotateY: 180 }}
      >
        {/* Header Block */}
        <div className="flex flex-col gap-0.5 mb-2 flex-shrink-0">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/40 block leading-normal">
            Project Dossier:
          </span>
          <h3 className="text-white font-black text-xs uppercase tracking-wide leading-snug mt-0.5 truncate">
            {title}
          </h3>
        </div>

        {/* Middle Content Container */}
        <div className="flex-1 min-h-0 flex flex-col justify-start gap-2 overflow-hidden my-1">
          <div>
            <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-white/40 block mb-0.5 leading-normal">
              Overview
            </span>
            <p className="text-white/75 text-[9.5px] font-sans leading-relaxed line-clamp-4">
              {description}
            </p>
          </div>

          {/* Tags as bullet points */}
          {tags && tags.length > 0 && (
            <ul className="space-y-1 mt-1">
              {tags.slice(0, 3).map((tag) => (
                <li key={tag} className="flex items-center gap-1.5 text-white/65 text-[8.5px] font-sans truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-300/80 flex-shrink-0" />
                  <span className="truncate">{tag}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom Pinned Action Buttons */}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-white/10 flex-shrink-0">
          <Link
            href={`/projects/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="group flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-red-950/40 border border-red-300/20 text-white font-mono text-[7.5px] uppercase tracking-[0.05em] hover:bg-red-300/20 hover:border-red-300/40 hover:text-red-300 transition-all duration-300 text-center leading-normal cursor-pointer"
          >
            <span>Project Page</span> <FileText className="w-2.5 h-2.5 opacity-70 flex-shrink-0" />
          </Link>
          <Link
            href={`/projects/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="group flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-red-950/40 border border-red-300/20 text-white font-mono text-[7.5px] uppercase tracking-[0.05em] hover:bg-red-300/20 hover:border-red-300/40 hover:text-red-300 transition-all duration-300 text-center leading-normal cursor-pointer"
          >
            <span>Live Link</span> <ExternalLink className="w-2.5 h-2.5 opacity-70 flex-shrink-0" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
