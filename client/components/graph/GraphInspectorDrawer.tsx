"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, GitBranch, Terminal, Code, Check, Copy } from "lucide-react";
import { GraphNodePayload } from "./NeuralGraphCanvas";

interface GraphInspectorDrawerProps {
  node: GraphNodePayload | null;
  onClose: () => void;
}

export default function GraphInspectorDrawer({ node, onClose }: GraphInspectorDrawerProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (node) {
      document.body.classList.add("modal-open");
      window.dispatchEvent(new CustomEvent("modal-visibility-change", { detail: { open: true } }));
    }
    return () => {
      document.body.classList.remove("modal-open");
      window.dispatchEvent(new CustomEvent("modal-visibility-change", { detail: { open: false } }));
    };
  }, [node]);

  if (!node) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
    PROJECT: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
    FILE: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
    FUNCTION: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    TECHNOLOGY: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    EXPERIENCE: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" }
  };

  const style = typeStyles[node.type] || { bg: "bg-white/10", text: "text-white", border: "border-white/20" };

  // Filter out internal and GitHub star statistics in favor of technical briefs
  const EXCLUDED_KEYS = new Set(["readme_snippet", "source_code", "stars", "forks", "open_issues", "homepage"]);

  const validProperties = Object.entries(node.properties || {}).filter(([key, val]) => {
    if (EXCLUDED_KEYS.has(key.toLowerCase())) return false;
    if (val === null || val === undefined || val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (typeof val === "object" && Object.keys(val).length === 0) return false;
    return true;
  });

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, x: 440 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 440 }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className="fixed top-0 right-0 w-full sm:w-[480px] h-full bg-[#080808]/95 backdrop-blur-2xl border-l border-white/10 p-4 sm:p-6 md:p-8 pt-5 sm:pt-8 z-50 flex flex-col justify-between shadow-2xl overflow-y-auto font-mono selection:bg-red-300 selection:text-black"
      >
        {/* Top Header - Offset from global floating menu */}
        <div>
          <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-white/10 pr-10 sm:pr-16 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] uppercase font-bold tracking-widest border shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                {node.type}
              </span>
              <span className="text-white/40 text-[10px] sm:text-[11px] uppercase tracking-wider truncate">
                {node.repo_id}
              </span>
            </div>

            {/* Prominent Dismiss Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-colors text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold shrink-0"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>CLOSE</span>
            </button>
          </div>

          {/* Entity Title */}
          <div className="my-4 sm:my-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white break-words leading-tight">
              {node.name}
            </h2>
            {node.path && (
              <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
                <Terminal className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{node.path}</span>
              </div>
            )}
          </div>

          {/* Signature / Type Info */}
          {node.signature && (
            <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1.5">
                Signature
              </span>
              <code className="text-xs text-emerald-300 break-all font-mono">
                {node.signature}
              </code>
            </div>
          )}

          {/* Docstring / Summary */}
          {node.docstring && (
            <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1.5">
                Documentation & Scope
              </span>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                {node.docstring}
              </p>
            </div>
          )}

          {/* Code Snippet */}
          {node.code_snippet && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-red-400" /> Source Snippet
                </span>
                <button
                  onClick={() => handleCopy(node.code_snippet || "")}
                  className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "COPIED" : "COPY"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-black border border-white/10 overflow-x-auto text-[11px] text-white/80 font-mono leading-normal max-h-56">
                <code>{node.code_snippet}</code>
              </pre>
            </div>
          )}

          {/* Dynamic Technical Briefs & Properties */}
          <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/10">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-3">
              Technical Brief & Metadata
            </span>
            <div className="space-y-2 text-xs">
              {validProperties.length > 0 ? (
                validProperties.map(([key, val]) => {
                  const formattedKey = key.replace(/_/g, " ").toUpperCase();
                  let displayVal = "";

                  if (Array.isArray(val)) {
                    displayVal = val.join(", ");
                  } else if (typeof val === "object" && val !== null) {
                    displayVal = Object.keys(val).join(", ");
                  } else if (typeof val === "boolean") {
                    displayVal = val ? "YES" : "NO";
                  } else {
                    displayVal = String(val);
                  }

                  return (
                    <div key={key} className="flex justify-between items-center py-1 border-b border-white/[0.04] last:border-0">
                      <span className="text-white/40 text-[11px] uppercase tracking-wider">{formattedKey}</span>
                      <span className="text-white font-medium text-right max-w-[240px] truncate">{displayVal}</span>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-1.5 text-white/50 text-[11px]">
                  <div className="flex justify-between">
                    <span>ENTITY TYPE</span>
                    <span className="text-white font-medium">{node.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ASSOCIATED REPO</span>
                    <span className="text-white font-medium">{node.repo_id.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GRAPH STATUS</span>
                    <span className="text-emerald-400 font-medium">INDEXED & ACTIVE</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          {node.repo_id && node.repo_id !== "global" && (
            <Link
              href={`/projects/${node.repo_id}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white border border-red-500/30 transition-all font-mono text-xs uppercase tracking-wider font-semibold"
            >
              <span>Inspect Project Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          {node.repo_id && (
            <a
              href={`https://github.com/MIHIRrPATIL/${node.repo_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all font-mono text-xs uppercase tracking-wider"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>View Repository on GitHub</span>
            </a>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
