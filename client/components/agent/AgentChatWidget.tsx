"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Terminal,
  Send,
  X,
  RotateCcw,
  Sparkles,
  Network,
  Bot,
  Copy,
  Check,
  ChevronDown,
  CornerDownLeft,
  Layers,
  Cpu,
  ArrowDown,
  ArrowRight,
  ExternalLink,
  FolderGit2,
  Globe,
  Mail,
  Download
} from "lucide-react";
import { API_V1 } from "@/lib/api-config";
import { cn } from "@/lib/utils";

interface ChatBadge {
  type?: string;
  label: string;
  url?: string;
  project_id?: string;
  value?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  badges?: ChatBadge[];
  suggestedFollowups?: string[];
  timestamp: string;
}

// Known project map for instant dynamic redirect extraction
const KNOWN_PROJECT_REDIRECTS: Array<{ patterns: RegExp[]; slug: string; title: string }> = [
  { patterns: [/\bcdac[-_ ]?asr\b/i, /\bcdac\b/i, /\bcdac speech\b/i], slug: "cdac-asr", title: "CDAC ASR Coach" },
  { patterns: [/\bvaultagent\b/i, /\bvault[-_ ]agent\b/i], slug: "vaultagent", title: "VaultAgent" },
  { patterns: [/\breflectos\b/i, /\breflect[-_ ]os\b/i], slug: "reflectos", title: "ReflectOS" },
  { patterns: [/\bhireai\b/i, /\bhire[-_ ]ai\b/i], slug: "hireai", title: "HireAI" },
  { patterns: [/\bipd\b/i, /\bfederated learning\b/i], slug: "ipd", title: "IPD Federated Learning" },
  { patterns: [/\bgreekslab\b/i, /\bgreeks[-_ ]lab\b/i], slug: "greekslab", title: "GreeksLab" },
  { patterns: [/\bniti[-_ ]ai\b/i, /\bnitiai\b/i, /\blegal intelligence\b/i], slug: "niti-ai", title: "Niti AI" },
  { patterns: [/\bsynapse engine\b/i, /\bneural search engine\b/i], slug: "synapse", title: "Synapse Engine" },
  { patterns: [/\bhi[-_ ]?pace[-_ ]?wealth\b/i, /\bhipace\b/i], slug: "hi-pace-wealth", title: "HI-PACE Wealth" },
  { patterns: [/\bgenoshi[-_ ]?tasks\b/i], slug: "genoshi-tasks", title: "Genoshi Tasks" },
  { patterns: [/\bglow[-_ ]?word[-_ ]?ai\b/i], slug: "glow-word-ai", title: "Glow Word AI" },
  { patterns: [/\bsih[-_ ]singularity[-_ ]?2082\b/i], slug: "sih-singularity-2082", title: "SIH Singularity" }
];

// Subtle Framer Motion animation curves
const modalVariants: any = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const messageVariants: any = {
  hidden: (isUser: boolean) => ({
    opacity: 0,
    y: 12,
    x: isUser ? 10 : -10,
    scale: 0.98
  }),
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" }
  }
};

const badgeVariants: any = {
  hidden: { opacity: 0, scale: 0.92, y: 4 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: "easeOut" }
  })
};

const promptPillVariants: any = {
  hidden: { opacity: 0, y: 6, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" }
  })
};

// Morphing status text phrases (mirroring the hero section style)
const MORPHING_STATUS_PHRASES = [
  "synthesizing graphrag context...",
  "traversing 158 ast neural nodes...",
  "querying code dependency trees...",
  "retrieving architecture specifications...",
  "grounding response in codebase..."
];

function MorphingStatusText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MORPHING_STATUS_PHRASES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-2 overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-xs text-red-300/90 tracking-wider lowercase flex items-center gap-2"
        >
          <span className="text-white/40">//</span>
          <span>{MORPHING_STATUS_PHRASES[index]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Inline token parser for rich markdown formatting
function parseInlineFormatted(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\)|\*.*?\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(text.slice(lastIdx, match.index));
    }
    const raw = match[0];
    if (raw.startsWith("**") && raw.endsWith("**")) {
      tokens.push(
        <strong key={match.index} className="font-bold text-white font-sans tracking-tight">
          {raw.slice(2, -2)}
        </strong>
      );
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      tokens.push(
        <code
          key={match.index}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/[0.08] text-red-200 border border-white/10 font-semibold"
        >
          {raw.slice(1, -1)}
        </code>
      );
    } else if (raw.startsWith("[") && raw.includes("](") && raw.endsWith(")")) {
      const linkText = raw.slice(1, raw.indexOf("]("));
      const linkUrl = raw.slice(raw.indexOf("](") + 2, -1);
      tokens.push(
        <a
          key={match.index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-300 hover:text-white underline underline-offset-4 transition-colors font-medium"
        >
          {linkText}
        </a>
      );
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      tokens.push(
        <em key={match.index} className="text-neutral-300 italic font-sans">
          {raw.slice(1, -1)}
        </em>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    tokens.push(text.slice(lastIdx));
  }

  return tokens;
}

// Rich formatted AI Response Renderer with micro-animations & Table Parser
function FormattedAiResponse({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-neutral-100 text-xs sm:text-sm leading-relaxed font-sans select-text">
      {parts.map((part, pIdx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : "";
          const code = (hasLang ? lines.slice(1) : lines).join("\n");

          return (
            <motion.div
              key={pIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="my-3 rounded-2xl bg-[#06060a] border border-white/15 overflow-hidden shadow-lg"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/10 font-mono text-[11px] text-neutral-400">
                <span className="uppercase text-red-300 font-bold tracking-wider">
                  {lang || "CODE"}
                </span>
              </div>
              <pre className="p-4 font-mono text-xs sm:text-[13px] text-red-100/90 overflow-x-auto leading-relaxed">
                <code>{code}</code>
              </pre>
            </motion.div>
          );
        }

        const lines = part.split("\n");
        const renderedElements: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          // Check for Markdown Table Start (| header | header |)
          if (
            trimmed.startsWith("|") &&
            trimmed.endsWith("|") &&
            i + 1 < lines.length &&
            lines[i + 1].trim().startsWith("|") &&
            lines[i + 1].includes("---")
          ) {
            const headerCells = trimmed
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim());
            const rows: string[][] = [];
            i += 2; // skip header and delimiter

            while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
              const rowCells = lines[i]
                .trim()
                .slice(1, -1)
                .split("|")
                .map((c) => c.trim());
              if (rowCells.length > 0) {
                rows.push(rowCells);
              }
              i++;
            }

            renderedElements.push(
              <motion.div
                key={`table-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="my-3 w-full rounded-2xl border border-white/15 bg-black/50 backdrop-blur-sm overflow-hidden shadow-md"
              >
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-[11px] sm:text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.04]">
                        {headerCells.map((header, hIdx) => (
                          <th
                            key={hIdx}
                            className="px-3 py-2.5 font-bold uppercase tracking-wider text-red-300 text-[10px] sm:text-[11px] whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                          {row.map((cell, cIdx) => {
                            const isTypeCell = ["FUNCTION", "PROJECT", "MODULE", "TECH STACK", "TECHNOLOGY", "EXPERIENCE", "FILE"].includes(
                              cell.toUpperCase()
                            );
                            return (
                              <td key={cIdx} className="px-3 py-2 text-neutral-200 align-top leading-relaxed font-sans text-xs">
                                {isTypeCell ? (
                                  <span className="inline-flex px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/30">
                                    {cell}
                                  </span>
                                ) : (
                                  parseInlineFormatted(cell)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            );
            continue;
          }

          if (!trimmed) {
            i++;
            continue;
          }

          if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
            const headerText = trimmed.replace(/^#+\s*/, "").replace(/^\*\*/, "").replace(/\*\*$/, "");
            renderedElements.push(
              <motion.div
                key={`h-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="pt-3 pb-1 border-b border-white/10 flex items-center gap-2"
              >
                <span className="font-mono text-xs text-red-300 font-bold">//</span>
                <h4 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-white">
                  {headerText}
                </h4>
              </motion.div>
            );
            i++;
            continue;
          }

          if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            const itemText = trimmed.replace(/^[*•-]\s*/, "");
            renderedElements.push(
              <motion.div
                key={`li-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5 my-1 pl-1"
              >
                <span className="text-red-300 font-mono text-sm leading-none mt-1 select-none">
                  •
                </span>
                <div className="flex-1 text-neutral-100 text-xs sm:text-sm font-sans leading-relaxed">
                  {parseInlineFormatted(itemText)}
                </div>
              </motion.div>
            );
            i++;
            continue;
          }

          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+)\.\s/)?.[1] || "1";
            const itemText = trimmed.replace(/^\d+\.\s*/, "");
            renderedElements.push(
              <motion.div
                key={`num-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5 my-1 pl-1"
              >
                <span className="font-mono text-xs text-red-300 font-semibold leading-none mt-1 select-none">
                  {num}.
                </span>
                <div className="flex-1 text-neutral-100 text-xs sm:text-sm font-sans leading-relaxed">
                  {parseInlineFormatted(itemText)}
                </div>
              </motion.div>
            );
            i++;
            continue;
          }

          renderedElements.push(
            <p
              key={`p-${i}`}
              className="text-neutral-100 text-xs sm:text-sm font-sans leading-relaxed font-normal"
            >
              {parseInlineFormatted(line)}
              {isStreaming && i === lines.length - 1 && (
                <span className="inline-block w-2 h-3.5 ml-1 bg-red-400 animate-pulse align-middle" />
              )}
            </p>
          );
          i++;
        }

        return (
          <div key={pIdx} className="space-y-2">
            {renderedElements}
          </div>
        );
      })}
    </div>
  );
}

export default function AgentChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const isUserScrollingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session ID
  useEffect(() => {
    setActiveSessionId(`session_${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  // Lock body scroll and notify shell when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
      window.dispatchEvent(new CustomEvent("modal-visibility-change", { detail: { open: true } }));
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
      window.dispatchEvent(new CustomEvent("modal-visibility-change", { detail: { open: false } }));
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
      window.dispatchEvent(new CustomEvent("modal-visibility-change", { detail: { open: false } }));
    };
  }, [isOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [isOpen]);

  // Robust scrolling logic
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    }
  }, []);

  // Auto-scroll when messages arrive or streaming progresses, ONLY if user is not actively scrolling up
  useEffect(() => {
    if (!isUserScrollingRef.current) {
      scrollToBottom(false);
    }
  }, [messages, isStreaming, scrollToBottom]);

  // Handle wheel / scroll events directly
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    if (distanceFromBottom > 60) {
      isUserScrollingRef.current = true;
      setIsScrolledUp(true);
    } else {
      isUserScrollingRef.current = false;
      setIsScrolledUp(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      isUserScrollingRef.current = true;
      setIsScrolledUp(true);
    }
  };

  // Navigate to project dossier and close modal smoothly
  const handleNavigateToDossier = (dossierUrl: string) => {
    setIsOpen(false);
    router.push(dossierUrl);
  };

  // Navigate to Contact / Sync Section and close modal
  const handleNavigateToContact = (targetUrl: string = "/#connect") => {
    setIsOpen(false);
    if (pathname === "/") {
      const el = document.getElementById("connect") || document.getElementById("contact") || document.getElementById("sync");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    router.push("/#connect");
  };

  // Route & page context metadata
  const pageContext = useMemo(() => {
    const p = pathname || "/";
    if (p.startsWith("/projects/")) {
      const slug = p.replace("/projects/", "").split("/")[0].split("?")[0];
      const formattedTitle = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        type: "PROJECT_DOSSIER",
        active_project_id: slug,
        title: formattedTitle,
        contextBadge: `PROJECT // ${formattedTitle.toUpperCase()}`,
        starterPrompts: [
          `Explain the core architecture of ${formattedTitle}`,
          `What technologies and frameworks power this codebase?`,
          `How does ${formattedTitle} connect to Mihir's other projects?`,
          `What are the verified performance metrics and latency?`
        ]
      };
    } else if (p === "/graph") {
      return {
        type: "KNOWLEDGE_GRAPH",
        title: "3D Neural Knowledge Graph",
        contextBadge: "KNOWLEDGE GRAPH // 136 NODES",
        starterPrompts: [
          "How does GraphRAG connect Python to Speech AI?",
          "What are the highest-degree hub nodes in the graph?",
          "Explain the relationship between CDAC ASR and Wav2Vec2",
          "Show cluster groupings across distributed systems"
        ]
      };
    } else if (p === "/projects") {
      return {
        type: "PROJECTS_ARCHIVE",
        title: "Engineering Projects Archive",
        contextBadge: "ARCHIVE MATRIX // 51 REPOSITORIES",
        starterPrompts: [
          "Which projects are flagship standalone systems?",
          "Compare solo engineering projects vs collaborative team projects",
          "What are Mihir's top projects in Speech AI and LLMs?",
          "How can I filter repositories by technology stack?"
        ]
      };
    } else {
      return {
        type: "LANDING_TERMINAL",
        title: "Mihir Patil Portfolio Terminal",
        contextBadge: "PORTFOLIO // LANDING TERMINAL",
        starterPrompts: [
          "Give me an executive summary of Mihir's technical background",
          "What are Mihir's standout engineering achievements?",
          "Tell me about Mihir's research at CDAC on Speech AI",
          "How can I reach out or collaborate with Mihir?"
        ]
      };
    }
  }, [pathname]);

  // Handle SSE streaming chat
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || query).trim();
    if (!messageText || isStreaming) return;

    isUserScrollingRef.current = false;
    setIsScrolledUp(false);

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const assistantMsgId = `msg_${Date.now()}_assistant`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setQuery("");
    setIsStreaming(true);

    try {
      const chatHistoryPayload = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${API_V1}/agent/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          query: messageText,
          chat_history: chatHistoryPayload,
          pathname: pathname || "/",
          page_context: pageContext
        })
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to connect to agent stream endpoint");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";
      let parsedBadges: ChatBadge[] = [];
      let parsedFollowups: string[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          try {
            const jsonStr = trimmed.replace(/^data:\s*/, "");
            const payload = JSON.parse(jsonStr);

            if (payload.type === "meta") {
              if (payload.ui_badges && Array.isArray(payload.ui_badges)) {
                parsedBadges = payload.ui_badges;
              }
            } else if (payload.type === "token") {
              accumulatedText += payload.content || "";
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedText, badges: parsedBadges }
                    : msg
                )
              );
            } else if (payload.type === "done") {
              if (payload.suggested_followups && Array.isArray(payload.suggested_followups)) {
                parsedFollowups = payload.suggested_followups;
              }
              if (payload.ui_badges && Array.isArray(payload.ui_badges)) {
                parsedBadges = payload.ui_badges;
              }
            }
          } catch {
            // Ignore partial frames
          }
        }
      }

      // Dynamic Extraction: Detect mentioned projects in response text using strict word boundary regex
      const existingUrls = new Set(parsedBadges.map((b) => b.url).filter(Boolean));

      for (const item of KNOWN_PROJECT_REDIRECTS) {
        const targetUrl = `/projects/${item.slug}`;
        const isMatch = item.patterns.some((p) => p.test(accumulatedText));
        if (isMatch && !existingUrls.has(targetUrl)) {
          parsedBadges.push({
            type: "project_dossier",
            label: `Explore ${item.title} Dossier`,
            url: targetUrl,
            project_id: item.slug
          });
          existingUrls.add(targetUrl);
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: accumulatedText || "Connection established. Query executed successfully.",
                badges: parsedBadges,
                suggestedFollowups: parsedFollowups
              }
            : msg
        )
      );
    } catch (err) {
      console.error("Agent chat streaming failed:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `You are currently viewing **${pageContext.title}**. Mihir specializes in Distributed Systems, Speech AI Research (CDAC), and Creative Engineering.`,
                badges: pageContext.active_project_id
                  ? [
                      {
                        type: "project_dossier",
                        label: `Explore ${pageContext.title} Dossier`,
                        url: `/projects/${pageContext.active_project_id}`,
                        project_id: pageContext.active_project_id
                      }
                    ]
                  : [],
                suggestedFollowups: [
                  "Tell me about CDAC Speech AI research",
                  "Explain VaultAgent zero-knowledge architecture",
                  "How can I collaborate with Mihir?"
                ]
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([]);
    isUserScrollingRef.current = false;
    setIsScrolledUp(false);
    setActiveSessionId(`session_${Math.random().toString(36).substring(2, 9)}`);
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="group flex items-center gap-2 sm:gap-3 px-3.5 py-2 sm:px-5 sm:py-3 rounded-full bg-[#0a0a0f] hover:bg-[#12121c] border border-white/15 hover:border-red-300/50 text-white font-mono text-[11px] sm:text-xs shadow-[0_10px_30px_rgba(0,0,0,0.8)] hover:shadow-[0_12px_40px_rgba(252,165,165,0.2)] transition-all cursor-pointer"
        >
          <div className="p-1 rounded-full bg-white/[0.06] text-red-300 group-hover:text-white transition-colors">
            <Terminal className="w-3.5 h-3.5" />
          </div>

          <span className="font-bold tracking-wider uppercase text-neutral-200 group-hover:text-white transition-colors">
            {pageContext.type === "PROJECT_DOSSIER" ? (
              <>
                <span className="hidden sm:inline">ASK ABOUT THIS PROJECT</span>
                <span className="sm:hidden">PROJECT AI</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">AI COPILOT</span>
                <span className="sm:hidden">COPILOT</span>
              </>
            )}
          </span>

          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] border border-white/10 text-neutral-300 font-mono">
            ⌘K
          </span>
        </motion.button>
      </div>

      {/* Cyberpunk Chat Terminal Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
          >
            {/* Backdrop Dismiss Click */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
              onClick={() => !isStreaming && setIsOpen(false)}
            />

            <motion.div
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 flex flex-col justify-between w-full max-w-3xl h-[680px] max-h-[90vh] bg-[#09090e]/95 backdrop-blur-3xl border border-white/20 rounded-3xl p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              {/* CAD Crosshairs */}
              <div className="absolute top-3 left-3 text-white/25 font-mono text-[10px] select-none pointer-events-none">+</div>
              <div className="absolute top-3 right-3 text-white/25 font-mono text-[10px] select-none pointer-events-none">+</div>
              <div className="absolute bottom-3 left-3 text-white/25 font-mono text-[10px] select-none pointer-events-none">+</div>
              <div className="absolute bottom-3 right-3 text-white/25 font-mono text-[10px] select-none pointer-events-none">+</div>

              {/* Terminal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/[0.06] border border-white/15 text-red-300">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                        MIHIR.AI COPILOT
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-neutral-400 border border-white/10">
                        ONLINE
                      </span>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                      {pageContext.contextBadge}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleResetChat}
                    className="p-2 rounded-lg border border-white/10 hover:border-white/25 text-neutral-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                    title="Reset Conversation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg border border-white/10 hover:border-white/25 text-neutral-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>

              {/* Scrollable Chat Area with Guaranteed Scroll & Lenis Isolation */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                onWheel={handleWheel}
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                data-lenis-prevent-touch="true"
                className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 font-mono text-xs custom-scrollbar relative select-text"
                style={{ overscrollBehaviorY: "contain", touchAction: "pan-y" }}
              >
                {/* Initial Welcome Greeting */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 shrink-0"
                >
                  <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                    <span className="text-red-300 font-semibold">// SYSTEM STATUS: ONLINE</span>
                    <span className="text-neutral-500">GRAPHRAG INDEX ACTIVE</span>
                  </div>
                  <p className="text-neutral-200 font-sans text-xs sm:text-sm leading-relaxed">
                    Welcome. I am Mihir&apos;s autonomous AI Copilot, grounded in the full GraphRAG knowledge store and actual repository source code.
                  </p>
                  <p className="text-neutral-400 font-mono text-[11px]">
                    Active Context: <span className="text-white font-semibold">{pageContext.title}</span>
                  </p>
                </motion.div>

                {/* Render Messages with Staggered Motion */}
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    custom={msg.role === "user"}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn(
                      "flex flex-col space-y-2",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "relative max-w-[90%] sm:max-w-[85%] rounded-3xl p-5 transition-all",
                        msg.role === "user"
                          ? "bg-white text-black font-mono font-medium text-xs shadow-md"
                          : "bg-[#0f0f18] text-neutral-100 border border-white/15 shadow-md"
                      )}
                    >
                      {/* Assistant Header & Copy Action */}
                      {msg.role === "assistant" && (
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-3 border-b border-white/10 pb-1.5">
                          <span className="text-red-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                            // MIHIR.AI PERSONA
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="hover:text-white transition-colors flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-red-300" />
                                <span className="text-red-300">COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>COPY</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      )}

                      {/* Content Render (Rich Formatted Markdown with High Visibility) */}
                      {msg.role === "assistant" ? (
                        <div>
                          <FormattedAiResponse
                            content={msg.content}
                            isStreaming={isStreaming && !msg.content}
                          />
                          {isStreaming && !msg.content && <MorphingStatusText />}
                        </div>
                      ) : (
                        <p className="font-mono text-xs sm:text-[13px] leading-relaxed font-semibold">
                          {msg.content}
                        </p>
                      )}

                      {/* Interactive Project Dossier & Action Badges */}
                      {msg.badges && msg.badges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
                          {msg.badges.map((b, i) => {
                            // 1. Direct Project Dossier Redirection Button with Lift Motion
                            if (b.type === "project_dossier" || (b.url && b.url.startsWith("/projects/"))) {
                              return (
                                <motion.button
                                  key={i}
                                  custom={i}
                                  variants={badgeVariants}
                                  initial="hidden"
                                  animate="visible"
                                  whileHover={{ scale: 1.03, y: -1 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleNavigateToDossier(b.url!)}
                                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-red-300 hover:text-black transition-colors duration-200 shadow-md cursor-pointer"
                                >
                                  <FolderGit2 className="w-3.5 h-3.5 text-black" />
                                  <span>{b.label || "EXPLORE DOSSIER"}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                              );
                            }

                            // 2. Contact / Schedule Sync Redirection Button
                            if (
                              b.type === "contact_sync" ||
                              (b.url && (b.url.includes("contact") || b.url.includes("connect") || b.url.includes("sync")))
                            ) {
                              return (
                                <motion.button
                                  key={i}
                                  custom={i}
                                  variants={badgeVariants}
                                  initial="hidden"
                                  animate="visible"
                                  whileHover={{ scale: 1.03, y: -1 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleNavigateToContact(b.url || "/#connect")}
                                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-300 text-black font-mono text-xs font-bold hover:bg-white transition-colors duration-200 shadow-md cursor-pointer"
                                >
                                  <Mail className="w-3.5 h-3.5 text-black" />
                                  <span>{b.label || "SCHEDULE COLLABORATION SYNC"}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                              );
                            }

                            // 2.5 Resume / CV Downloader Badge
                            if (b.type === "resume_download" || (b.url && b.url.includes("resume"))) {
                              return (
                                <motion.a
                                  key={i}
                                  custom={i}
                                  variants={badgeVariants}
                                  initial="hidden"
                                  animate="visible"
                                  whileHover={{ scale: 1.03, y: -1 }}
                                  whileTap={{ scale: 0.97 }}
                                  href={b.url || `${API_V1}/public/resume`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-red-300 hover:text-black transition-colors duration-200 shadow-md cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-black" />
                                  <span>{b.label || "DOWNLOAD RESUME (PDF)"}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-1 transition-transform" />
                                </motion.a>
                              );
                            }

                            // 3. Live Demo Deployment Link with Motion
                            if (b.type === "live_demo" || (b.url && b.url.startsWith("http"))) {
                              return (
                                <motion.a
                                  key={i}
                                  custom={i}
                                  variants={badgeVariants}
                                  initial="hidden"
                                  animate="visible"
                                  whileHover={{ scale: 1.03, y: -1 }}
                                  whileTap={{ scale: 0.97 }}
                                  href={b.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/20 hover:border-red-300/60 bg-white/[0.04] text-neutral-200 hover:text-white font-mono text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                                >
                                  <Globe className="w-3.5 h-3.5 text-red-300" />
                                  <span>{b.label || "LIVE DEMO"}</span>
                                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                                </motion.a>
                              );
                            }

                            // 4. Telemetry / Metric Pill
                            if (b.value) {
                              return (
                                <motion.span
                                  key={i}
                                  custom={i}
                                  variants={badgeVariants}
                                  initial="hidden"
                                  animate="visible"
                                  className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-white/[0.06] border border-white/15 text-neutral-200"
                                >
                                  {b.label}: <span className="text-red-300 font-bold">{b.value}</span>
                                </motion.span>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}
                    </div>

                    {/* Suggested Followups */}
                    {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && !isStreaming && (
                      <div className="flex flex-wrap gap-1.5 pt-2 mt-1">
                        {msg.suggestedFollowups.map((f, fIdx) => (
                          <motion.button
                            key={fIdx}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleSendMessage(f)}
                            className="text-[10px] sm:text-[11px] font-mono text-left px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-red-300/50 text-neutral-300 hover:text-white transition-colors shadow-sm cursor-pointer"
                          >
                            {f} →
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating Scroll Down Pill */}
              <AnimatePresence>
                {isScrolledUp && (
                  <motion.button
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      isUserScrollingRef.current = false;
                      setIsScrolledUp(false);
                      scrollToBottom(true);
                    }}
                    className="absolute bottom-20 sm:bottom-24 right-6 sm:right-8 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-300 text-black font-mono text-[10px] sm:text-[11px] font-bold shadow-lg hover:bg-white transition-colors cursor-pointer"
                  >
                    <span>SCROLL DOWN</span>
                    <ArrowDown className="w-3 h-3" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Context-Aware Recommended Starters */}
              {messages.length === 0 && (
                <div className="my-2 sm:my-3 space-y-1.5 sm:space-y-2 shrink-0">
                  <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block">
                    RECOMMENDED INQUIRIES FOR THIS PAGE:
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {pageContext.starterPrompts.map((prompt, idx) => (
                      <motion.button
                        key={idx}
                        custom={idx}
                        variants={promptPillVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left text-[11px] sm:text-xs font-mono px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/15 hover:border-red-300/50 text-neutral-200 hover:text-white transition-all duration-200 cursor-pointer"
                      >
                        {prompt} →
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Command Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10 flex items-center gap-2 shrink-0"
              >
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs pointer-events-none">
                    &gt;
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Ask about ${pageContext.title}...`}
                    disabled={isStreaming}
                    className="w-full bg-[#12121a] text-white text-xs font-mono rounded-xl border border-white/15 focus:border-red-300/60 pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 outline-none transition-colors placeholder:text-neutral-400 disabled:opacity-50"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  type="submit"
                  disabled={!query.trim() || isStreaming}
                  className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-red-300 transition-colors disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {isStreaming ? (
                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
