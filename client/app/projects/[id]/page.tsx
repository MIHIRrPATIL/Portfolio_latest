"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft, 
  ExternalLink, 
  Zap, 
  Shield, 
  Globe, 
  Cpu, 
  Layers, 
  Terminal,
  ArrowRight,
  Sparkles,
  Activity,
  Code2,
  CheckCircle2
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { projects } from "@/data/projects";

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'zap': return <Zap className="w-6 h-6 text-red-300" />;
    case 'shield': return <Shield className="w-6 h-6 text-red-300" />;
    case 'globe': return <Globe className="w-6 h-6 text-red-300" />;
    case 'cpu': return <Cpu className="w-6 h-6 text-red-300" />;
    case 'layers': return <Layers className="w-6 h-6 text-red-300" />;
    case 'terminal': return <Terminal className="w-6 h-6 text-red-300" />;
    default: return <Sparkles className="w-6 h-6 text-red-300" />;
  }
};

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'metrics'>('overview');

  const currentIndex = projects.findIndex((p) => p.id === id);
  const project = projects[currentIndex >= 0 ? currentIndex : 0];

  const prevProject = projects[(currentIndex - 1 + projects.length) % projects.length];
  const nextProject = projects[(currentIndex + 1) % projects.length];

  return (
    <main className="min-h-screen bg-black text-white px-6 md:px-16 lg:px-24 py-12 md:py-20 overflow-x-hidden selection:bg-red-300 selection:text-black">
      {/* ─── Top Navigation Bar ─── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between border-b border-white/10 pb-6 mb-12"
      >
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/3 border border-white/10 hover:border-red-300/40 hover:bg-red-300/10 text-white/80 hover:text-white transition-all duration-300 font-mono text-xs uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Archive</span>
        </Link>

        <div className="hidden sm:flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-white/50">
          <span>ID::{project.id}</span>
          <span className="w-3 h-px bg-white/20" />
          <span className="text-red-300 flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse" />
            Active Deployment
          </span>
        </div>
      </motion.div>

      {/* ─── Hero Section ─── */}
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-16">
        
        {/* Left 7 Columns: Title & Tag Badges */}
        <motion.div 
          className="lg:col-span-7 flex flex-col justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-red-300 mb-6">
            <span>Artifact // {project.year}</span>
            <span className="w-4 h-px bg-red-300/40" />
            <span className="text-white/60">{project.category}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] text-white mb-6 text-balance">
            {project.title}
          </h1>

          {/* Generous Spacing for Tags */}
          <div className="flex flex-wrap gap-2.5 my-6">
            {project.tags.map((tag) => (
              <span 
                key={tag}
                className="px-4 py-2 rounded-full bg-white/4 border border-white/15 text-white/80 font-mono text-xs uppercase tracking-widest shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-white/80 text-lg md:text-xl font-medium leading-relaxed mb-8 max-w-2xl">
            {project.description}
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-red-300 text-black font-mono text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:shadow-[0_0_30px_rgba(252,165,165,0.3)] transition-all duration-300"
            >
              <span>Live Deployment</span>
              <ExternalLink className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/4 border border-white/15 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:border-red-300/40 transition-all duration-300"
            >
              <FaGithub className="w-4 h-4 text-white/80 group-hover:text-red-300 transition-colors" />
              <span>Source Repository</span>
            </a>
          </div>
        </motion.div>

        {/* Right 5 Columns: Hero Graphic Frame */}
        <motion.div 
          className="lg:col-span-5 relative group"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-[#121214] border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent opacity-60 pointer-events-none" />
            
            {/* Inner Badge Overlay */}
            <div className="absolute bottom-5 left-5 z-10">
              <span className="font-mono text-xs uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white/80">
                System Render // v2.6
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Interactive Deep-Dive Tabs ─── */}
      <div className="w-full border-t border-white/10 pt-12">
        {/* Tab Selection Navigation */}
        <div className="flex flex-wrap items-center gap-3 mb-10 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`cursor-pointer font-mono text-xs uppercase tracking-[0.2em] px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-red-300 text-black font-bold shadow-[0_0_25px_rgba(252,165,165,0.25)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Architecture & Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`cursor-pointer font-mono text-xs uppercase tracking-[0.2em] px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'features'
                ? 'bg-red-300 text-black font-bold shadow-[0_0_25px_rgba(252,165,165,0.25)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Core Capabilities ({project.features.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`cursor-pointer font-mono text-xs uppercase tracking-[0.2em] px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'metrics'
                ? 'bg-red-300 text-black font-bold shadow-[0_0_25px_rgba(252,165,165,0.25)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Performance Metrics</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-7 p-8 md:p-10 rounded-3xl bg-[#121214] border border-white/10 space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-red-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> System Narrative & Executive Overview
                </h3>
                <p className="text-white/85 text-base md:text-lg leading-relaxed font-sans">
                  {project.longDescription}
                </p>
              </div>

              <div className="lg:col-span-5 p-8 md:p-10 rounded-3xl bg-[#121214] border border-white/10 space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-red-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Topology & Implementation Stack
                </h3>
                <div className="font-mono text-xs text-white/80 leading-relaxed space-y-3">
                  <p>{project.architecture}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              key="features-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {project.features.map((feature, i) => (
                <div 
                  key={i} 
                  className="p-8 rounded-3xl bg-[#121214] border border-white/10 flex flex-col justify-between hover:border-red-300/40 transition-colors duration-300 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-300/10 border border-red-300/25 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {renderIcon(feature.icon)}
                  </div>
                  <div>
                    <h4 className="font-black text-white uppercase tracking-wider text-base mb-3">
                      {feature.title}
                    </h4>
                    {/* High Contrast Description Text */}
                    <p className="text-white/80 text-sm leading-relaxed font-sans">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {project.metrics.map((metric, i) => (
                <div 
                  key={i} 
                  className="p-10 rounded-3xl bg-[#121214] border border-white/10 flex flex-col justify-center items-center text-center hover:border-red-300/40 transition-colors duration-300"
                >
                  <span className="text-5xl md:text-6xl font-black text-white tracking-tight mb-3">
                    {metric.value}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-red-300 font-bold">
                    {metric.label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Artifact Quick Switcher ─── */}
      <div className="w-full border-t border-white/10 mt-24 pt-12">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <Link
            href={`/projects/${prevProject.id}`}
            className="group flex items-center gap-4 p-5 rounded-2xl bg-[#121214] border border-white/10 hover:border-red-300/40 transition-all duration-300 w-full sm:w-auto min-w-65"
          >
            <ArrowLeft className="w-5 h-5 text-red-300 group-hover:-translate-x-1 transition-transform" />
            <div className="text-left">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 block">Previous Artifact</span>
              <span className="font-black uppercase tracking-wide text-xs text-white group-hover:text-red-300 transition-colors">{prevProject.title}</span>
            </div>
          </Link>

          <span className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">
            Artifact Navigation
          </span>

          <Link
            href={`/projects/${nextProject.id}`}
            className="group flex items-center justify-end gap-4 p-5 rounded-2xl bg-[#121214] border border-white/10 hover:border-red-300/40 transition-all duration-300 w-full sm:w-auto min-w-65 text-right"
          >
            <div className="text-right">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 block">Next Artifact</span>
              <span className="font-black uppercase tracking-wide text-xs text-white group-hover:text-red-300 transition-colors">{nextProject.title}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-red-300 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </main>
  );
}
