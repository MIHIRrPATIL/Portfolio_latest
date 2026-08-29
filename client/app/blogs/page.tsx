"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, Eye, ExternalLink, ArrowRight, Sparkles, Search } from "lucide-react";
import { API_V1 } from "@/lib/api-config";

interface Blog {
  id: string;
  title: string;
  summary: string;
  cover_image?: string;
  external_url?: string;
  tags: string[];
  read_time?: string;
  views?: number;
  published_at?: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  useEffect(() => {
    fetch(`${API_V1}/public/blogs`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBlogs(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const allTags = Array.from(new Set(blogs.flatMap((b) => b.tags || [])));

  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag =
      selectedTag === "all" || (b.tags && b.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-red-300 selection:text-black pt-28 pb-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header Hero */}
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-2 text-xs font-mono text-red-300 uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>// ARCHITECTURE & ENGINEERING INSIGHTS</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
            Engineering Thoughts & Writeups
          </h1>
          <p className="text-sm md:text-base text-white/50 max-w-2xl leading-relaxed">
            Deep dives into GraphRAG pipelines, speech AI acoustic models, distributed federated systems, and full-stack software architecture.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search engineering articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e0e13] border border-white/10 text-white placeholder:text-white/30 text-xs font-mono focus:border-red-300 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setSelectedTag("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                selectedTag === "all"
                  ? "bg-red-300 text-black font-bold"
                  : "bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  selectedTag === tag
                    ? "bg-red-300 text-black font-bold"
                    : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="p-20 text-center text-xs font-mono text-white/40 animate-pulse">
            // LOADING ENGINEERING ARTICLES...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-16 rounded-2xl bg-[#09090d] border border-white/10 text-center text-xs font-mono text-white/40">
            No articles found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-3xl bg-[#0c0c11] border border-white/10 hover:border-red-300/40 transition-all overflow-hidden flex flex-col justify-between"
              >
                {blog.cover_image && (
                  <div className="h-48 w-full overflow-hidden relative bg-black/60">
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                    />
                  </div>
                )}

                <div className="p-6 space-y-3 flex-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-300" />
                      <span>{blog.read_time || "3 min read"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{blog.views || 0} reads</span>
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white group-hover:text-red-300 transition-colors leading-snug line-clamp-2">
                    {blog.title}
                  </h2>

                  <p className="text-xs text-white/60 leading-relaxed line-clamp-3">
                    {blog.summary}
                  </p>

                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {blog.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[10px] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0 border-t border-white/5 mt-4 pt-4">
                  {blog.external_url ? (
                    <a
                      href={blog.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-red-300 hover:text-black text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Read External Post</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link
                      href={`/blogs/${blog.id}`}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-red-300 hover:text-black text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Read Full Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
