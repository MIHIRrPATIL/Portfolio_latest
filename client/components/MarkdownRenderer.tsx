"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, Code2 } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content into blocks: Code blocks vs Text blocks
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-4 font-sans text-white/80 leading-relaxed text-sm md:text-base">
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return <CodeBlock key={idx} language={block.language || "code"} code={block.content} />;
        } else if (block.type === "h1") {
          return (
            <h1 key={idx} className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight mt-8 mb-4">
              {renderInlineMarkdown(block.content)}
            </h1>
          );
        } else if (block.type === "h2") {
          return (
            <h2 key={idx} className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-8 mb-3 pb-2 border-b border-white/10 flex items-center gap-2">
              <span className="text-red-300 font-mono text-sm">//</span>
              <span>{renderInlineMarkdown(block.content)}</span>
            </h2>
          );
        } else if (block.type === "h3") {
          return (
            <h3 key={idx} className="text-lg md:text-xl font-bold text-red-300 uppercase tracking-wide mt-6 mb-2">
              {renderInlineMarkdown(block.content)}
            </h3>
          );
        } else if (block.type === "blockquote") {
          return (
            <blockquote key={idx} className="border-l-2 border-red-300 bg-white/[0.03] pl-4 py-2 my-4 italic text-white/90 rounded-r-xl">
              {renderInlineMarkdown(block.content)}
            </blockquote>
          );
        } else if (block.type === "list") {
          return (
            <ul key={idx} className="space-y-2 my-4 pl-2">
              {block.items?.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3 text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-300 mt-2 flex-shrink-0" />
                  <span>{renderInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          );
        } else if (block.type === "ordered-list") {
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
        } else {
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
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/60 border-b border-white/10 font-mono text-xs">
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
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
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

interface Block {
  type: "p" | "h1" | "h2" | "h3" | "code" | "blockquote" | "list" | "ordered-list";
  content: string;
  language?: string;
  items?: string[];
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block fences (``` or ````)
    if (trimmed.startsWith("```")) {
      if (inCode) {
        blocks.push({
          type: "code",
          content: codeBuffer.join("\n"),
          language: codeLang || "code",
        });
        inCode = false;
        codeLang = "";
        codeBuffer = [];
      } else {
        flushList();
        inCode = true;
        codeLang = trimmed.replace(/`/g, "").trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
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
    } else if (trimmed.startsWith("> ")) {
      blocks.push({ type: "blockquote", content: trimmed.substring(2) });
    } else {
      blocks.push({ type: "p", content: trimmed });
    }
  }

  flushList();
  if (inCode && codeBuffer.length > 0) {
    blocks.push({
      type: "code",
      content: codeBuffer.join("\n"),
      language: codeLang || "code",
    });
  }

  return blocks;
}

// Inline formatting: **bold**, *italic*, `code`, [link](url)
function renderInlineMarkdown(text: string): React.ReactNode {
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

    // Parse bold **text** and italic *text*
    return <span key={idx}>{parseBoldItalic(part)}</span>;
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
