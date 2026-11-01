"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Copy, Code2, ExternalLink, Info, AlertTriangle, AlertCircle, Lightbulb, ShieldAlert, GitCommit } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-5 font-sans text-white/80 leading-relaxed text-sm md:text-base">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "code":
            return <CodeBlock key={idx} language={block.language || "code"} code={block.content} />;

          case "mermaid":
            return <MermaidBlock key={idx} code={block.content} />;

          case "table":
            return (
              <div key={idx} className="my-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#08080c] shadow-xl">
                <table className="w-full text-left text-xs md:text-sm font-sans border-collapse">
                  {block.tableHeaders && block.tableHeaders.length > 0 && (
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.04]">
                        {block.tableHeaders.map((header, hIdx) => (
                          <th key={hIdx} className="px-4 py-3 font-mono font-bold text-red-300 uppercase tracking-wider text-[11px]">
                            {renderInlineMarkdown(header)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-white/5">
                    {block.tableRows?.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-4 py-3 text-white/80 align-top">
                            {renderInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "callout":
            return <CalloutBlock key={idx} calloutType={block.calloutType || "note"} content={block.content} />;

          case "hr":
            return <hr key={idx} className="my-8 border-t border-white/10" />;

          case "h1":
            return (
              <h1 key={idx} className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight mt-10 mb-4 pb-2 border-b border-white/10">
                {renderInlineMarkdown(block.content)}
              </h1>
            );

          case "h2":
            return (
              <h2 key={idx} className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-9 mb-3 pb-2 border-b border-white/10 flex items-center gap-2">
                <span className="text-red-300 font-mono text-sm">//</span>
                <span>{renderInlineMarkdown(block.content)}</span>
              </h2>
            );

          case "h3":
            return (
              <h3 key={idx} className="text-lg md:text-xl font-bold text-red-300 uppercase tracking-wide mt-7 mb-2">
                {renderInlineMarkdown(block.content)}
              </h3>
            );

          case "h4":
            return (
              <h4 key={idx} className="text-base font-bold text-white/90 uppercase tracking-wider mt-5 mb-2 font-mono">
                {renderInlineMarkdown(block.content)}
              </h4>
            );

          case "blockquote":
            return (
              <blockquote key={idx} className="border-l-2 border-red-300 bg-white/[0.03] pl-4 py-2.5 my-4 italic text-white/90 rounded-r-xl font-sans">
                {renderInlineMarkdown(block.content)}
              </blockquote>
            );

          case "list":
            return (
              <ul key={idx} className="space-y-2 my-4 pl-2">
                {block.items?.map((item, itemIdx) => {
                  const isTask = item.startsWith("[ ] ") || item.startsWith("[x] ") || item.startsWith("[X] ");
                  const isChecked = item.startsWith("[x] ") || item.startsWith("[X] ");
                  const cleanText = isTask ? item.substring(4) : item;

                  return (
                    <li key={itemIdx} className="flex items-start gap-3 text-white/80">
                      {isTask ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-1 rounded bg-black border-white/20 text-red-400 focus:ring-0 cursor-default"
                        />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 mt-2 flex-shrink-0" />
                      )}
                      <span>{renderInlineMarkdown(cleanText)}</span>
                    </li>
                  );
                })}
              </ul>
            );

          case "ordered-list":
            return (
              <ol key={idx} className="space-y-2 my-4 pl-2">
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-3 text-white/80">
                    <span className="font-mono text-xs text-red-300 font-bold mt-0.5 flex-shrink-0">
                      {itemIdx + 1}.
                    </span>
                    <span>{renderInlineMarkdown(item)}</span>
                  </li>
                ))}
              </ol>
            );

          default:
            return (
              <p key={idx} className="text-white/80 leading-relaxed my-3 font-sans">
                {renderInlineMarkdown(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}

// Callout Block Component
function CalloutBlock({ calloutType, content }: { calloutType: string; content: string }) {
  const configs: Record<string, { border: string; bg: string; text: string; icon: any; title: string }> = {
    note: {
      border: "border-blue-500/40",
      bg: "bg-blue-500/[0.06]",
      text: "text-blue-300",
      icon: Info,
      title: "NOTE",
    },
    tip: {
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/[0.06]",
      text: "text-emerald-300",
      icon: Lightbulb,
      title: "TIP",
    },
    important: {
      border: "border-purple-500/40",
      bg: "bg-purple-500/[0.06]",
      text: "text-purple-300",
      icon: AlertCircle,
      title: "IMPORTANT",
    },
    warning: {
      border: "border-amber-500/40",
      bg: "bg-amber-500/[0.06]",
      text: "text-amber-300",
      icon: AlertTriangle,
      title: "WARNING",
    },
    caution: {
      border: "border-red-500/40",
      bg: "bg-red-500/[0.06]",
      text: "text-red-300",
      icon: ShieldAlert,
      title: "CAUTION",
    },
  };

  const cfg = configs[calloutType.toLowerCase()] || configs.note;
  const IconComponent = cfg.icon;

  return (
    <div className={`p-4 rounded-2xl border ${cfg.border} ${cfg.bg} my-5 shadow-lg`}>
      <div className={`flex items-center gap-2 mb-2 font-mono text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
        <IconComponent className="w-4 h-4" />
        <span>{cfg.title}</span>
      </div>
      <div className="text-white/90 text-sm leading-relaxed pl-6 font-sans">
        {renderInlineMarkdown(content)}
      </div>
    </div>
  );
}

// Code Block with Copy Action
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#08080c] border border-white/15 overflow-hidden my-6 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-black/70 border-b border-white/10 font-mono text-xs">
        <div className="flex items-center gap-2 text-white/60">
          <Code2 className="w-3.5 h-3.5 text-red-300" />
          <span className="uppercase text-[11px] font-bold tracking-wider text-red-300/90">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-mono">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-mono">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 md:p-5 overflow-x-auto text-xs md:text-sm font-mono text-red-100/90 leading-relaxed selection:bg-red-500/30 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Module-level Mermaid singleton and serialized render queue
let mermaidModulePromise: Promise<any> | null = null;
let mermaidRenderQueue: Promise<void> = Promise.resolve();

function getMermaidInstance() {
  if (typeof window === "undefined") return Promise.reject("SSR");
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then((m) => {
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "loose",
        fontFamily: "monospace, sans-serif",
        themeVariables: {
          darkMode: true,
          background: "transparent",
          mainBkg: "#0e0e17",
          primaryColor: "#1a1625",
          primaryBorderColor: "#f87171",
          primaryTextColor: "#ffffff",
          lineColor: "#f87171",
          secondaryColor: "#12121e",
          secondaryBorderColor: "#60a5fa",
          secondaryTextColor: "#ffffff",
          tertiaryColor: "#0f172a",
          tertiaryBorderColor: "#94a3b8",
          tertiaryTextColor: "#e2e8f0",
          clusterBkg: "#07070c",
          clusterBorder: "#2e2e42",
          edgeLabelBackground: "#11111c",
          nodeTextColor: "#ffffff",
        },
      });
      return mermaid;
    });
  }
  return mermaidModulePromise;
}

function safeRenderMermaid(id: string, code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    mermaidRenderQueue = mermaidRenderQueue
      .then(async () => {
        try {
          const mermaid = await getMermaidInstance();
          const cleanCode = code.trim();
          const { svg } = await mermaid.render(id, cleanCode);
          resolve(svg);
        } catch (err) {
          // Remove rogue temporary elements created by mermaid on failure
          if (typeof document !== "undefined") {
            const rogue1 = document.getElementById(id);
            if (rogue1) rogue1.remove();
            const rogue2 = document.getElementById(`d${id}`);
            if (rogue2) rogue2.remove();
          }
          reject(err);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// Mermaid Diagram Block with Visual SVG Rendering
function MermaidBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"diagram" | "spec">("diagram");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderMermaid() {
      setIsLoading(true);
      setError(null);

      try {
        const renderId = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        const svg = await safeRenderMermaid(renderId, code);

        if (!isCancelled) {
          setSvgHtml(svg);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Mermaid diagram rendering error:", err);
          setError(err?.message || "Failed to parse diagram syntax.");
          setIsLoading(false);
          setViewMode("spec");
        }
      }
    }

    renderMermaid();

    return () => {
      isCancelled = true;
    };
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#07070b] border border-red-300/20 overflow-hidden my-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-red-950/20 border-b border-red-300/10 font-mono text-xs">
        <div className="flex items-center gap-2 text-red-300">
          <GitCommit className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold tracking-wider uppercase">// ARCHITECTURE DIAGRAM</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-black/60 p-0.5 border border-white/10 text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode("diagram")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "diagram"
                  ? "bg-red-400/20 text-red-300 font-bold border border-red-300/30"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode("spec")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === "spec"
                  ? "bg-red-400/20 text-red-300 font-bold border border-red-300/30"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Source
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white/70 hover:text-white transition-colors cursor-pointer font-mono"
            title="Copy diagram spec"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Spec</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Viewport */}
      {viewMode === "diagram" ? (
        <div className="relative p-4 md:p-8 bg-[#06060a] min-h-[160px] flex items-center justify-center">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-white/40 py-8">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>Rendering visual diagram...</span>
            </div>
          )}

          {error && (
            <div className="w-full text-left p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs font-mono text-red-300 space-y-2">
              <div className="font-bold uppercase tracking-wider">// Rendering Notice</div>
              <p className="text-white/70 text-[11px] leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={() => setViewMode("spec")}
                className="text-red-300 underline text-[11px] hover:text-white cursor-pointer"
              >
                Switch to Source Code view
              </button>
            </div>
          )}

          {!isLoading && !error && svgHtml && (
            <div
              ref={containerRef}
              className="w-full overflow-x-auto py-2 flex justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )}
        </div>
      ) : (
        <pre className="p-4 md:p-5 overflow-x-auto text-xs font-mono text-white/70 leading-relaxed bg-black/60 selection:bg-red-500/30 selection:text-white">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

interface Block {
  type: "p" | "h1" | "h2" | "h3" | "h4" | "code" | "blockquote" | "list" | "ordered-list" | "table" | "hr" | "callout" | "mermaid";
  content: string;
  language?: string;
  items?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  calloutType?: string;
}

function parseMarkdownBlocks(rawText: string): Block[] {
  const lines = rawText.split("\n");
  const blocks: Block[] = [];

  let inCode = false;
  let codeLang = "";
  let codeBuffer: string[] = [];

  let inList = false;
  let listItems: string[] = [];
  let isOrderedList = false;

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      blocks.push({
        type: isOrderedList ? "ordered-list" : "list",
        content: "",
        items: [...listItems],
      });
      listItems = [];
      inList = false;
      isOrderedList = false;
    }
  };

  const flushTable = () => {
    if (inTable && (tableHeaders.length > 0 || tableRows.length > 0)) {
      blocks.push({
        type: "table",
        content: "",
        tableHeaders: [...tableHeaders],
        tableRows: [...tableRows],
      });
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block fences (``` or ````)
    if (trimmed.startsWith("```")) {
      if (inCode) {
        if (codeLang.toLowerCase() === "mermaid") {
          blocks.push({
            type: "mermaid",
            content: codeBuffer.join("\n"),
          });
        } else {
          blocks.push({
            type: "code",
            content: codeBuffer.join("\n"),
            language: codeLang || "code",
          });
        }
        inCode = false;
        codeLang = "";
        codeBuffer = [];
      } else {
        flushList();
        flushTable();
        inCode = true;
        codeLang = trimmed.replace(/`/g, "").trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown Table Rows (contains pipes)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      // Check if it's the separator row (e.g. |:---|:---| or |--|--)
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c.replace(/\s+/g, "")));

      if (isSeparator) {
        // Just mark we're in table, separator confirmed
        inTable = true;
        continue;
      }

      if (!inTable) {
        // First row is headers
        tableHeaders = cells;
        inTable = true;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Horizontal Rule (--- or ***)
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushList();
      blocks.push({ type: "hr", content: "" });
      continue;
    }

    // Callout Alert (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION])
    const calloutMatch = trimmed.match(/^>\s+\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](.*)/i);
    if (calloutMatch) {
      flushList();
      const calloutType = calloutMatch[1].toLowerCase();
      let calloutBody = calloutMatch[2].trim();

      // Look ahead for continuation lines starting with >
      let nextLineIdx = i + 1;
      while (nextLineIdx < lines.length && lines[nextLineIdx].trim().startsWith(">")) {
        const nextContent = lines[nextLineIdx].trim().replace(/^>\s?/, "");
        calloutBody += (calloutBody ? " " : "") + nextContent;
        nextLineIdx++;
      }
      i = nextLineIdx - 1;

      blocks.push({
        type: "callout",
        calloutType,
        content: calloutBody,
      });
      continue;
    }

    // Unordered List
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList || isOrderedList) {
        flushList();
        inList = true;
        isOrderedList = false;
      }
      listItems.push(trimmed.substring(2));
      continue;
    }

    // Ordered List
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!inList || !isOrderedList) {
        flushList();
        inList = true;
        isOrderedList = true;
      }
      listItems.push(numMatch[2]);
      continue;
    }

    // If not a list line, flush previous list
    if (inList && trimmed.length > 0) {
      flushList();
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", content: trimmed.substring(2) });
    } else if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", content: trimmed.substring(3) });
    } else if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", content: trimmed.substring(4) });
    } else if (trimmed.startsWith("#### ")) {
      blocks.push({ type: "h4", content: trimmed.substring(5) });
    } else if (trimmed.startsWith("> ")) {
      blocks.push({ type: "blockquote", content: trimmed.substring(2) });
    } else {
      blocks.push({ type: "p", content: trimmed });
    }
  }

  flushList();
  flushTable();

  if (inCode && codeBuffer.length > 0) {
    blocks.push({
      type: "code",
      content: codeBuffer.join("\n"),
      language: codeLang || "code",
    });
  }

  return blocks;
}

// Inline formatting: **bold**, *italic*, `code`, [link](url), ![image](url)
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // 1. Parse Images: ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  if (imageRegex.test(text)) {
    const parts = text.split(/(!\[[^\]]*\]\([^)]+\))/g);
    return parts.map((part, pIdx) => {
      const match = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (match) {
        const alt = match[1];
        const src = match[2];
        return (
          <span key={pIdx} className="block my-4">
            <img src={src} alt={alt} className="rounded-2xl border border-white/10 max-h-[450px] w-auto mx-auto shadow-2xl object-cover" />
            {alt && <span className="block text-center text-xs text-white/40 mt-2 font-mono">{alt}</span>}
          </span>
        );
      }
      return <span key={pIdx}>{renderInlineTokens(part)}</span>;
    });
  }

  return renderInlineTokens(text);
}

function renderInlineTokens(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline code: `code`
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const code = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md bg-white/10 text-red-300 font-mono text-[12px] md:text-[13px] border border-white/10 mx-0.5"
        >
          {code}
        </code>
      );
    }

    // Parse links: [label](url)
    const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
    return linkParts.map((lPart, lIdx) => {
      const lMatch = lPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lMatch) {
        const label = lMatch[1];
        const href = lMatch[2];
        const isExternal = href.startsWith("http");

        return (
          <a
            key={lIdx}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
            className="text-red-300 hover:text-white underline underline-offset-4 font-medium transition-colors inline-flex items-center gap-0.5"
          >
            <span>{parseBoldItalic(label)}</span>
            {isExternal && <ExternalLink className="w-3 h-3 inline-block ml-0.5 opacity-70" />}
          </a>
        );
      }

      return <span key={lIdx}>{parseBoldItalic(lPart)}</span>;
    });
  });
}

function parseBoldItalic(text: string): React.ReactNode {
  // Replace **bold**
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);

  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith("**") && bPart.endsWith("**") && bPart.length > 4) {
      const boldText = bPart.slice(2, -2);
      return (
        <strong key={bIdx} className="font-bold text-white">
          {boldText}
        </strong>
      );
    }

    // Replace *italic*
    const italicParts = bPart.split(/(\*[^*]+\*)/g);
    return italicParts.map((iPart, iIdx) => {
      if (iPart.startsWith("*") && iPart.endsWith("*") && iPart.length > 2) {
        return (
          <em key={iIdx} className="italic text-white/90">
            {iPart.slice(1, -1)}
          </em>
        );
      }
      return iPart;
    });
  });
}
