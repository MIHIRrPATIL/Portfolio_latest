"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import { WorksWheel, type WorksWheelItem } from "@/components/ui/works-wheel";
import { API_V1 } from "@/lib/api-config";

// High-fidelity fallback engineering thoughts ensuring the ring stays fully populated
const DEFAULT_THOUGHTS: WorksWheelItem[] = [
  {
    title: "VESPER: Autonomous Ambient Desk Companion & Cognitive Swarm",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
    href: "/blogs/vesper-ambient-desk-companion-architecture",
    summary: "Deep architectural retrospective on building a distributed 10-specialist agentic swarm on Orange Pi 5 with WebRTC VAD and sub-30ms barge-in.",
  },
  {
    title: "Architecting Real-Time GraphRAG Copilots with AST Code Maps",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
    href: "/blogs/building-realtime-graphrag-ai-copilots",
    summary: "Replacing naive vector embeddings with deterministic Python and Tree-Sitter AST code graphs for zero-hallucination multi-repo navigation.",
  },
  {
    title: "Deterministic Barge-In: Sub-30ms Out-of-Band Audio Cancellation",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
    href: "/blogs/vesper-ambient-desk-companion-architecture",
    summary: "Engineering low-latency multiplexed WebSockets and async task interruption loops for true conversational interruption.",
  },
  {
    title: "4-Tier Shodh Cognitive Memory: Long-Term Context Retention",
    image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1200&auto=format&fit=crop",
    href: "/blogs/vesper-ambient-desk-companion-architecture",
    summary: "Hierarchical episodic, semantic, working, and sensory memory architectures for stateful edge companions.",
  },
  {
    title: "Physical Perception Engines: V4L2 Device Sharing & WebRTC VAD",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
    href: "/blogs/vesper-ambient-desk-companion-architecture",
    summary: "Zero-copy shared memory camera buffers with BlazeFace tracking and Whisper acoustic pipelines.",
  },
  {
    title: "3-Tier Semantic Routing on Groq LPUs & FastEmbed",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop",
    href: "/blogs/vesper-ambient-desk-companion-architecture",
    summary: "Sub-millisecond keyword lookup, CPU embeddings, and structured DAG planners for multi-domain routing.",
  },
];

export default function ThoughtsSection() {
  const [items, setItems] = useState<WorksWheelItem[]>(DEFAULT_THOUGHTS);

  useEffect(() => {
    fetch(`${API_V1}/public/blogs`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load blogs");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const dynamicItems: WorksWheelItem[] = data.map((b: any) => ({
            title: b.title,
            image:
              b.cover_image ||
              "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
            href: `/blogs/${encodeURIComponent(b.id)}`,
            summary: b.summary,
          }));

          // Merge dynamic database blogs with defaults to keep wheel full
          const seenSlugs = new Set(data.map((b: any) => b.id));
          const complementary = DEFAULT_THOUGHTS.filter(
            (item) => !seenSlugs.has(item.href?.replace("/blogs/", "")),
          );
          setItems([...dynamicItems, ...complementary].slice(0, 9));
        }
      })
      .catch((e) => {
        // Silently use defaults if offline or API unreachable
      });
  }, []);

  return (
    <section
      id="thoughts"
      className="relative w-full bg-black text-white pt-24 pb-16 flex flex-col justify-between overflow-hidden border-t border-white/5"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full mb-6 z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-red-300 uppercase tracking-widest mb-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span>// 05. ENGINEERING DOSSIERS & WRITINGS</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            Thoughts & System Architecture
          </h2>
          <p className="text-xs md:text-sm text-white/50 mt-1 font-mono">
            Scroll or drag wheel to rotate 3D drum. Click any card to read full breakdown.
          </p>
        </div>

        <Link
          href="/blogs"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-300/40 text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all w-fit"
        >
          <BookOpen className="w-3.5 h-3.5 text-red-300" />
          <span>Browse All Articles</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-white/50 group-hover:text-red-300 transition-colors" />
        </Link>
      </div>

      {/* 3D Wheel Stage */}
      <div className="relative w-full h-[70vh] md:h-[82vh] min-h-[480px]">
        <WorksWheel
          items={items}
          label="Thoughts '26"
          action="Read Article"
          className="h-full w-full"
        />
      </div>
    </section>
  );
}
