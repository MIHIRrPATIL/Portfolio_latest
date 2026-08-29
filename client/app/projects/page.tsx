"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Network, Sparkles, Terminal } from "lucide-react";
import ProjectGrid from "@/components/ProjectGrid";
import { EncryptedText } from "@/components/ui/encrypted-text";

export default function ProjectsArchivePage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 sm:px-10 md:px-14 lg:px-16 py-12 md:py-16 overflow-x-hidden selection:bg-red-300 selection:text-black">
      
      {/* Top Bar: Back link & Telemetry Tag */}
      <div className="max-w-[1600px] mx-auto mb-10 flex items-center justify-between gap-4">
        <Link 
          href="/" 
          className="group flex items-center gap-2.5 text-neutral-400 hover:text-white transition-colors uppercase font-mono tracking-widest text-xs"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Terminal</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] font-mono text-[11px] text-neutral-400">
          <span className="text-red-300 font-bold">//</span>
          <span>SYS_STATUS // ACTIVE INDEX (51 REPOSITORIES)</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="max-w-[1600px] mx-auto mb-12 border-b border-white/[0.08] pb-12">
        <span className="text-red-300 font-mono uppercase tracking-[0.4em] text-xs sm:text-sm mb-4 block font-bold">
          Archived Cases &amp; Engineering Dossiers
        </span>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-none mb-5">
              <EncryptedText
                text="PROJECTS"
                revealDelayMs={60}
                flipDelayMs={30}
                className="inline-block"
                encryptedClassName="opacity-30"
              />
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm md:text-base font-normal uppercase tracking-[0.2em] font-mono leading-relaxed">
              A comprehensive index of distributed systems, speech AI research, and full-stack creative engineering.
            </p>
          </div>

          {/* Premium High-Appeal Knowledge Graph Button (Styled like Let's Collaborate) */}
          <Link
            href="/graph"
            className="bg-white text-black hover:bg-red-300 hover:text-black border-none flex items-center gap-6 transition-all duration-500 ease-out px-8 py-5 md:px-10 md:py-6 rounded-2xl cursor-pointer font-black uppercase tracking-tighter text-base md:text-xl shadow-[0_20px_50px_rgba(255,255,255,0.12)] hover:shadow-[0_25px_60px_rgba(252,165,165,0.25)] group self-start lg:self-end shrink-0"
          >
            <div className="flex items-center gap-3">
              <Network className="w-6 h-6 md:w-7 md:h-7 text-black group-hover:rotate-45 transition-transform duration-500" />
              <span>VIEW KNOWLEDGE GRAPH</span>
            </div>
            <ArrowRight className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-3 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* Main Grid Matrix Showcase */}
      <div className="max-w-[1600px] mx-auto w-full">
        <ProjectGrid />
      </div>

      {/* Footer Meta */}
      <div className="max-w-[1600px] mx-auto mt-24 text-center border-t border-white/[0.06] pt-8">
        <span className="font-mono text-xs uppercase tracking-[0.6em] text-neutral-500">
          Archived Works &bull; MMXXIV
        </span>
      </div>
    </main>
  );
}
