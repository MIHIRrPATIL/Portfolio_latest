"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ProjectGrid from "@/components/ProjectGrid";
import { EncryptedText } from "@/components/ui/encrypted-text";

export default function ProjectsArchivePage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 overflow-x-hidden">
      {/* Back Navigation */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-12"
      >
        <Link 
          href="/" 
          className="flex items-center gap-2 text-white/40 hover:text-red-300 transition-colors uppercase font-mono tracking-widest text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Archive
        </Link>
      </motion.div>

      {/* Header */}
      <div className="mb-16">
        <span className="text-red-300 font-mono uppercase tracking-[0.5em] text-sm mb-4 block">
          Archived Cases
        </span>
        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-8">
          <EncryptedText
            text="PROJECTS"
            revealDelayMs={80}
            flipDelayMs={40}
            className="inline-block"
            encryptedClassName="opacity-40"
          />
        </h1>
        <p className="text-white/40 text-sm md:text-base font-medium uppercase tracking-[0.25em] max-w-xl mt-4">
          A comprehensive index of software development, creative engineering, and machine learning research.
        </p>
      </div>

      {/* Project Grid */}
      <ProjectGrid />

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        className="mt-48 text-center"
      >
        <span className="font-mono text-xs uppercase tracking-[1em]">
          Archived Works &copy; MMXXIV
        </span>
      </motion.div>
    </main>
  );
}
