"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Eye, Sparkles, Share2, Check, ExternalLink } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { API_V1 } from "@/lib/api-config";

interface BlogDetail {
  id: string;
  title: string;
  summary: string;
  content?: string;
  cover_image?: string;
  external_url?: string;
  tags: string[];
  read_time?: string;
  views?: number;
  published_at?: string;
}

export default function SingleBlogPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_V1}/public/blogs/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setBlog(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center font-mono text-xs text-white/40">
        // LOADING ARTICLE...
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Article Not Found</h1>
        <p className="text-xs text-white/50 mb-6 font-mono">The requested writeup could not be located.</p>
        <Link
          href="/blogs"
          className="px-6 py-2.5 rounded-xl bg-red-300 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
        >
          ← Return to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-red-300 selection:text-black pt-28 pb-24 px-6 md:px-12">
      <article className="max-w-4xl mx-auto">
        {/* Back Link & Share */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/blogs"
            className="flex items-center gap-2 text-xs font-mono text-white/50 hover:text-red-300 uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to all articles</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Post</span>
              </>
            )}
          </button>
        </div>

        {/* Article Metadata Header */}
        <header className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-[11px] font-mono text-white/50">
            <span className="text-red-300 font-bold uppercase tracking-widest">// ENGINEERING WRITEUP</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-300" />
              <span>{blog.read_time || "3 min read"}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{blog.views || 0} views</span>
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight">
            {blog.title}
          </h1>

          <p className="text-base md:text-lg text-white/70 font-sans leading-relaxed border-l-2 border-red-300 pl-4 py-1 italic bg-white/[0.02]">
            {blog.summary}
          </p>

          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {blog.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white/5 text-red-300/90 text-xs font-mono border border-white/5"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Cover Image */}
        {blog.cover_image && (
          <div className="w-full h-72 md:h-96 rounded-3xl overflow-hidden mb-10 border border-white/10 bg-black/60 shadow-2xl">
            <img
              src={blog.cover_image}
              alt={blog.title}
              className="w-full h-full object-cover brightness-95"
            />
          </div>
        )}

        {/* Markdown Content Body */}
        <div className="bg-[#09090e] p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
          <MarkdownRenderer content={blog.content || "No extended writeup content provided."} />
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
          <Link
            href="/blogs"
            className="text-xs font-mono text-red-300 hover:underline uppercase tracking-wider flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Explore More Thoughts</span>
          </Link>
          <Link
            href="/#connect"
            className="px-4 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-red-300 transition-colors"
          >
            Discuss & Collaborate →
          </Link>
        </div>
      </article>
    </div>
  );
}
