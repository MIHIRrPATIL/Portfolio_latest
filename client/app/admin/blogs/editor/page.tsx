"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Eye,
  Columns,
  Maximize2,
  Minimize2,
  Lock,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  RefreshCw,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Table,
  Link2,
  Image as ImageIcon,
  Minus,
  Sparkles,
  GitCommit,
  Info,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  Layers,
  ChevronDown,
  UploadCloud,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { API_V1 } from "@/lib/api-config";

interface BlogArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  cover_image: string;
  external_url: string;
  tags: string[];
  read_time: string;
  is_published: boolean;
  views?: number;
  published_at?: string;
  created_at?: string;
}

export default function BlogStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-8 font-mono">Loading Blog Studio...</div>}>
      <BlogStudioContent />
    </Suspense>
  );
}

function BlogStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");

  // Authentication State
  const [token, setToken] = useState<string | null>(null);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Studio Data State
  const [blogsList, setBlogsList] = useState<BlogArticle[]>([]);
  const [activeArticle, setActiveArticle] = useState<BlogArticle>({
    id: "",
    title: "",
    summary: "",
    content: "",
    cover_image: "",
    external_url: "",
    tags: ["Architecture", "Engineering"],
    read_time: "5 min read",
    is_published: true,
  });

  // UI Modes
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isArticleDropdownOpen, setIsArticleDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Check Session Token on Mount
  useEffect(() => {
    const saved = sessionStorage.getItem("mihir_admin_token");
    if (saved) {
      setToken(saved);
      loadAllBlogs(saved);
    }
  }, []);

  // Sync requestedId from query params
  useEffect(() => {
    if (requestedId && requestedId !== "new" && blogsList.length > 0) {
      const match = blogsList.find((b) => b.id === requestedId);
      if (match) {
        setActiveArticle(match);
        setHasUnsavedChanges(false);
      }
    } else if (!requestedId || requestedId === "new") {
      handleStartNewArticle(false);
    }
  }, [requestedId, blogsList]);

  // Handle Authentication
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return;
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch(`${API_V1}/admin/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: passkeyInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        sessionStorage.setItem("mihir_admin_token", data.token);
        loadAllBlogs(data.token);
      } else {
        setAuthError("Invalid administrative passkey.");
      }
    } catch {
      setAuthError("Backend server unreachable. Ensure FastAPI is running.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Load All Blogs from Backend
  const loadAllBlogs = async (activeToken: string) => {
    try {
      const res = await fetch(`${API_V1}/admin/blogs`, {
        headers: { "X-Admin-Key": activeToken },
      });
      if (res.ok) {
        const data: BlogArticle[] = await res.json();
        setBlogsList(data);

        // If requestedId is set and valid, select it
        if (requestedId && requestedId !== "new") {
          const match = data.find((b) => b.id === requestedId);
          if (match) {
            setActiveArticle(match);
            setHasUnsavedChanges(false);
            return;
          }
        }

        // If opened with id=new or without an ID, initialize a clean new draft!
        handleStartNewArticle(false);
      }
    } catch (err) {
      console.error("Failed loading blogs list:", err);
    }
  };

  // Auto-Compute Reading Time based on words
  const updateContent = (newContent: string) => {
    const words = newContent.trim().split(/\s+/).filter(Boolean).length;
    const computedMin = Math.max(1, Math.ceil(words / 200));

    setActiveArticle((prev) => ({
      ...prev,
      content: newContent,
      read_time: `${computedMin} min read`,
    }));
    setHasUnsavedChanges(true);
  };

  // Auto-generate Slug if not explicitly set
  const handleTitleChange = (newTitle: string) => {
    const generatedSlug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setActiveArticle((prev) => ({
      ...prev,
      title: newTitle,
      id: prev.id && prev.id !== "" ? prev.id : generatedSlug,
    }));
    setHasUnsavedChanges(true);
  };

  // Toolbar Insertion Helper
  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = activeArticle.content;
    const selectedText = currentVal.substring(start, end) || placeholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    updateContent(newContent);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  // Insert Template Blocks
  const insertTemplateBlock = (blockText: string) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentVal = activeArticle.content;
    const before = currentVal.substring(0, start);
    const after = currentVal.substring(start);

    const prefixNewline = before.length > 0 && !before.endsWith("\n\n") ? "\n\n" : "";
    const suffixNewline = after.length > 0 && !after.startsWith("\n\n") ? "\n\n" : "";

    const newContent = `${before}${prefixNewline}${blockText}${suffixNewline}${after}`;
    updateContent(newContent);

    setTimeout(() => {
      textarea.focus();
    }, 10);
  };

  // Tag Handlers
  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || tagInput).trim();
    if (!tag) return;
    if (!activeArticle.tags.includes(tag)) {
      setActiveArticle((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setHasUnsavedChanges(true);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setActiveArticle((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
    setHasUnsavedChanges(true);
  };

  // Save to Database
  const handleSaveArticle = async () => {
    if (!token) return;
    if (!activeArticle.title.trim()) {
      alert("Please provide an article title before saving.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    const slug = activeArticle.id || activeArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      const payload = {
        ...activeArticle,
        id: slug,
        summary: activeArticle.summary || activeArticle.content.substring(0, 150) + "...",
      };

      const res = await fetch(`${API_V1}/admin/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": token,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        await loadAllBlogs(token);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.detail || "Server error"}`);
      }
    } catch (e: any) {
      alert(`Error saving to database: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Create Fresh New Article
  const handleStartNewArticle = (confirmDiscard: boolean = true) => {
    if (confirmDiscard && hasUnsavedChanges) {
      if (!confirm("You have unsaved changes in your current article. Discard and create new?")) {
        return;
      }
    }

    setActiveArticle({
      id: "",
      title: "",
      summary: "",
      content: `# Title of New Engineering Article\n\nWrite your technical introduction here...\n\n## System Architecture\n\nExplain core components, data pipelines, and distributed protocols.\n\n| Component | Protocol | Latency |\n| :--- | :--- | :--- |\n| Gateway | WebSocket | <5ms |\n| Worker | gRPC / Async | <10ms |\n\n> [!NOTE]\n> Key architectural takeaways and observations go here.\n`,
      cover_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
      external_url: "",
      tags: ["System Design", "Architecture"],
      read_time: "5 min read",
      is_published: true,
    });
    setHasUnsavedChanges(false);
    setIsArticleDropdownOpen(false);
  };

  // Word & Character count
  const wordCount = activeArticle.content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = activeArticle.content.length;

  // Unauthenticated Gate Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6 font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 rounded-3xl bg-[#09090e] border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 text-red-300 mb-4 text-xs tracking-widest uppercase font-bold">
            <Lock className="w-4 h-4" />
            <span>// BLOG_STUDIO_AUTH</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Restricted Studio</h1>
          <p className="text-xs text-white/50 mb-6">Enter master passkey to access rich markdown publishing studio.</p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Enter master passkey..."
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-red-300 transition-colors"
              autoFocus
            />
            {authError && <div className="text-red-400 text-xs font-mono">{authError}</div>}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 rounded-xl bg-red-300 text-black font-bold uppercase tracking-wider text-xs hover:bg-white transition-colors cursor-pointer"
            >
              {isAuthenticating ? "Verifying..." : "Authorize Access"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      data-lenis-prevent="true"
      className="h-screen max-h-screen w-screen overflow-hidden bg-[#050508] text-white flex flex-col font-sans selection:bg-red-500/30 selection:text-white"
    >
      {/* 1. TOP STUDIO HEADER */}
      <header className="h-16 shrink-0 border-b border-white/10 bg-black/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

          {/* Active Article Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsArticleDropdownOpen(!isArticleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-white cursor-pointer transition-colors max-w-[280px] md:max-w-[360px]"
            >
              <FileText className="w-3.5 h-3.5 text-red-300 shrink-0" />
              <span className="truncate font-bold">
                {activeArticle.title || "Untitled Article"}
              </span>
              <ChevronDown className="w-3 h-3 text-white/50 shrink-0 ml-auto" />
            </button>

            <AnimatePresence>
              {isArticleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 mt-2 w-80 rounded-2xl bg-[#09090e] border border-white/15 shadow-2xl p-2 z-50 font-mono text-xs max-h-96 overflow-y-auto"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      Saved Database Articles
                    </span>
                    <button
                      onClick={() => handleStartNewArticle(true)}
                      className="flex items-center gap-1 text-[11px] text-red-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  </div>

                  {blogsList.map((blog) => (
                    <button
                      key={blog.id}
                      onClick={() => {
                        setActiveArticle(blog);
                        setHasUnsavedChanges(false);
                        setIsArticleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-colors flex flex-col gap-1 ${
                        activeArticle.id === blog.id
                          ? "bg-red-950/30 border border-red-300/30 text-white"
                          : "hover:bg-white/5 text-white/70 hover:text-white"
                      }`}
                    >
                      <span className="font-bold truncate text-xs">{blog.title}</span>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <span>{blog.read_time}</span>
                        <span>•</span>
                        <span>{blog.views || 0} views</span>
                        {blog.is_published ? (
                          <span className="text-emerald-400">Published</span>
                        ) : (
                          <span className="text-amber-400">Draft</span>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved
            </span>
          )}
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-black/80 rounded-xl p-1 border border-white/10 font-mono text-xs">
            <button
              onClick={() => setViewMode("editor")}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "editor" ? "bg-red-300 text-black font-bold" : "text-white/60 hover:text-white"
              }`}
            >
              <Code className="w-3 h-3" />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "split" ? "bg-red-300 text-black font-bold" : "text-white/60 hover:text-white"
              }`}
            >
              <Columns className="w-3 h-3" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "preview" ? "bg-red-300 text-black font-bold" : "text-white/60 hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          {/* Toggle Metadata Drawer */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isSidebarOpen
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}
            title="Toggle Metadata Settings Panel"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Live Public Article Link */}
          {activeArticle.id && (
            <Link
              href={`/blogs/${activeArticle.id}`}
              target="_blank"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
              title="Open Live Public Reader Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}

          {/* Save / Publish Button */}
          <button
            onClick={handleSaveArticle}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              saveSuccess
                ? "bg-emerald-400 text-black"
                : "bg-red-300 hover:bg-white text-black shadow-lg shadow-red-500/20"
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Published!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save to Cloud</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. RICH TEXT / MARKDOWN TOOLBAR - PINNED STICKY TOP */}
      <div className="h-12 shrink-0 border-b border-white/10 bg-[#09090e] px-4 md:px-6 flex items-center gap-1 overflow-x-auto text-xs font-mono z-30">
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold pr-2 hidden lg:inline">
          Format:
        </span>

        {/* Headings */}
        <button
          onClick={() => insertFormatting("# ", "", "Heading 1")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Heading 1 (# )"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("## ", "", "Heading 2")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Heading 2 (## )"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("### ", "", "Heading 3")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Heading 3 (### )"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Inline styles */}
        <button
          onClick={() => insertFormatting("**", "**", "bold text")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Bold (**text**)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("*", "*", "italic text")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Italic (*text*)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("`", "`", "code")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Inline Code (`code`)"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Lists & Quotes */}
        <button
          onClick={() => insertFormatting("- ", "", "Bullet item")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Bullet List (- item)"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("1. ", "", "Ordered item")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Numbered List (1. item)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("- [ ] ", "", "Task checklist item")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Task List (- [ ] item)"
        >
          <ListTodo className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("> ", "", "Quote text")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Blockquote (> quote)"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* GFM Table Generator */}
        <button
          onClick={() =>
            insertTemplateBlock(
              `| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Data A1 | Data A2 | Data A3 |\n| Data B1 | Data B2 | Data B3 |`
            )
          }
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer flex items-center gap-1"
          title="Insert GFM Table"
        >
          <Table className="w-4 h-4 text-red-300" />
          <span className="text-[11px] hidden sm:inline">Table</span>
        </button>

        {/* Callout Alert Generator */}
        <button
          onClick={() =>
            insertTemplateBlock(
              `> [!NOTE]\n> Key architectural concept, implementation details, or design decision.`
            )
          }
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer flex items-center gap-1"
          title="Insert Callout Alert"
        >
          <Info className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] hidden sm:inline">Callout</span>
        </button>

        {/* Mermaid Architecture Generator */}
        <button
          onClick={() =>
            insertTemplateBlock(
              `\`\`\`mermaid\nflowchart TD\n    Client["Client Request"] --> Gateway["API Gateway (:8000)"]\n    Gateway --> ServiceA["Core Engine"]\n    Gateway --> ServiceB["Sync Manager"]\n\`\`\``
            )
          }
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer flex items-center gap-1"
          title="Insert Mermaid Architecture Diagram"
        >
          <GitCommit className="w-4 h-4 text-purple-400" />
          <span className="text-[11px] hidden sm:inline">Diagram</span>
        </button>

        {/* Code Block with preset */}
        <button
          onClick={() =>
            insertTemplateBlock(
              `\`\`\`typescript\n// Code snippet\nexport async function executeOperation() {\n  return { status: "success" };\n}\n\`\`\``
            )
          }
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer flex items-center gap-1"
          title="Insert Code Block"
        >
          <Code className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] hidden sm:inline">Code</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Links & Images */}
        <button
          onClick={() => insertFormatting("[", "](https://example.com)", "link title")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Insert Link [text](url)"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          onClick={() =>
            insertFormatting(
              "![",
              "](https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200)",
              "Image Caption"
            )
          }
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Insert Image ![alt](url)"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertTemplateBlock("---\n")}
          className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          title="Insert Horizontal Divider (---)"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Word Count Live Badge */}
        <div className="ml-auto text-[11px] text-white/40 hidden md:flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} chars</span>
          <span>•</span>
          <span className="text-red-300/80 font-bold">{activeArticle.read_time}</span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE AREA */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* EDIT / PREVIEW SPLIT PANE */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* LEFT: Markdown Editor Pane */}
          {(viewMode === "split" || viewMode === "editor") && (
            <div
              className={`flex-1 min-h-0 flex flex-col border-r border-white/10 bg-[#060609] overflow-hidden ${
                viewMode === "editor" ? "w-full" : "w-1/2"
              }`}
            >
              {/* Title & Slug Header input */}
              <div className="shrink-0 p-4 md:p-6 border-b border-white/10 bg-black/40 space-y-3">
                <input
                  type="text"
                  placeholder="Article Title..."
                  value={activeArticle.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-transparent text-xl md:text-2xl font-black text-white placeholder:text-white/20 outline-none uppercase tracking-tight"
                />
                <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                  <span className="text-red-300">slug:</span>
                  <input
                    type="text"
                    placeholder="custom-article-slug"
                    value={activeArticle.id}
                    onChange={(e) => {
                      setActiveArticle({ ...activeArticle, id: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="bg-transparent text-white/70 placeholder:text-white/20 outline-none flex-1 border-b border-dashed border-white/20 focus:border-red-300"
                  />
                </div>
              </div>

              {/* Code/Markdown Textarea with native vertical scrolling */}
              <div className="flex-1 min-h-0 relative overflow-hidden" data-lenis-prevent="true">
                <textarea
                  ref={editorTextareaRef}
                  value={activeArticle.content}
                  onChange={(e) => updateContent(e.target.value)}
                  placeholder="Start drafting in Markdown or use formatting toolbar..."
                  className="w-full h-full p-4 md:p-6 bg-transparent text-white/90 font-mono text-xs md:text-sm leading-relaxed outline-none resize-none overflow-y-auto custom-scrollbar selection:bg-red-500/30 selection:text-white"
                  spellCheck={false}
                  data-lenis-prevent="true"
                />
              </div>
            </div>
          )}

          {/* RIGHT: Live Rendered Preview Pane */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div
              data-lenis-prevent="true"
              className={`flex-1 min-h-0 flex flex-col bg-[#050508] overflow-y-auto custom-scrollbar ${
                viewMode === "preview" ? "w-full" : "w-1/2"
              }`}
            >
              <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
                {/* Simulated Article Header */}
                <div className="space-y-4 pb-6 border-b border-white/10">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-white/40">
                    <span className="text-red-300 font-bold uppercase">{activeArticle.read_time}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span>•</span>
                    <span className={activeArticle.is_published ? "text-emerald-400" : "text-amber-400"}>
                      {activeArticle.is_published ? "Public Article" : "Draft Preview"}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase">
                    {activeArticle.title || "Untitled Article"}
                  </h1>

                  {activeArticle.summary && (
                    <p className="text-sm md:text-base text-white/60 leading-relaxed font-sans italic border-l-2 border-red-300/40 pl-4 py-1">
                      {activeArticle.summary}
                    </p>
                  )}

                  {activeArticle.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {activeArticle.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[11px] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {activeArticle.cover_image && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 my-6 shadow-2xl max-h-[380px]">
                      <img
                        src={activeArticle.cover_image}
                        alt={activeArticle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Rendered Markdown Body */}
                <div className="pb-16">
                  <MarkdownRenderer content={activeArticle.content || "*No writeup content drafted yet.*"} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. COLLAPSIBLE METADATA DRAWER (Right Sidebar) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              data-lenis-prevent="true"
              className="h-full min-h-0 border-l border-white/10 bg-[#08080c] p-5 overflow-y-auto custom-scrollbar font-mono text-xs space-y-6 shrink-0"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-red-300" />
                  Article Settings
                </span>
                <span className="text-[10px] text-white/40">JSON V1</span>
              </div>

              {/* Publication Status Toggle */}
              <div className="p-3.5 rounded-xl bg-black border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 font-bold text-xs">Publication State</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      activeArticle.is_published
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {activeArticle.is_published ? "Live" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_published_toggle"
                    checked={activeArticle.is_published}
                    onChange={(e) => {
                      setActiveArticle({ ...activeArticle, is_published: e.target.checked });
                      setHasUnsavedChanges(true);
                    }}
                    className="rounded bg-black border-white/20 text-red-400 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="is_published_toggle" className="text-white/60 cursor-pointer text-[11px]">
                    Make visible on `/blogs`
                  </label>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <label className="text-white/60 block uppercase tracking-wider text-[10px]">
                  Executive Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Punchy 2-sentence synopsis for social previews and card grids..."
                  value={activeArticle.summary}
                  onChange={(e) => {
                    setActiveArticle({ ...activeArticle, summary: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-white/90 placeholder:text-white/20 outline-none focus:border-red-300 leading-relaxed font-sans text-xs"
                />
              </div>

              {/* Cover Image URL */}
              <div className="space-y-2">
                <label className="text-white/60 block uppercase tracking-wider text-[10px]">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={activeArticle.cover_image}
                  onChange={(e) => {
                    setActiveArticle({ ...activeArticle, cover_image: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-white/90 placeholder:text-white/20 outline-none focus:border-red-300 text-xs"
                />
                {activeArticle.cover_image && (
                  <div className="rounded-xl overflow-hidden border border-white/10 h-28 w-full bg-black">
                    <img
                      src={activeArticle.cover_image}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Reading Time */}
              <div className="space-y-1.5">
                <label className="text-white/60 block uppercase tracking-wider text-[10px]">
                  Read Time (Calculated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 min read"
                  value={activeArticle.read_time}
                  onChange={(e) => {
                    setActiveArticle({ ...activeArticle, read_time: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-white/90 outline-none focus:border-red-300 text-xs"
                />
              </div>

              {/* Tags Manager */}
              <div className="space-y-2">
                <label className="text-white/60 block uppercase tracking-wider text-[10px]">
                  Topic Tags
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-white/15 text-white outline-none focus:border-red-300 text-xs"
                  />
                  <button
                    onClick={() => handleAddTag()}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Active Tag Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeArticle.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/80 text-[10px] flex items-center gap-1"
                    >
                      <span>#{t}</span>
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="text-white/40 hover:text-red-400 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Suggested Quick Tags */}
                <div className="pt-2">
                  <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-1">
                    Suggestions:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {["Architecture", "AI Agents", "FastAPI", "Next.js", "System Design", "Edge AI", "GraphRAG"].map(
                      (q) => (
                        <button
                          key={q}
                          onClick={() => handleAddTag(q)}
                          className="px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/10 text-[9px] text-white/50 hover:text-white transition-colors cursor-pointer"
                        >
                          +{q}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* External Publication URL */}
              <div className="space-y-1.5">
                <label className="text-white/60 block uppercase tracking-wider text-[10px]">
                  External Cross-Post URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://medium.com/@mihir..."
                  value={activeArticle.external_url || ""}
                  onChange={(e) => {
                    setActiveArticle({ ...activeArticle, external_url: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-white/90 placeholder:text-white/20 outline-none focus:border-red-300 text-xs"
                />
              </div>

              {/* Delete Article Action */}
              {activeArticle.id && (
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to permanently delete '${activeArticle.title}'?`)) {
                        return;
                      }
                      try {
                        const res = await fetch(`${API_V1}/admin/blogs/${activeArticle.id}`, {
                          method: "DELETE",
                          headers: { "X-Admin-Key": token },
                        });
                        if (res.ok) {
                          alert("Article deleted.");
                          await loadAllBlogs(token);
                          handleStartNewArticle();
                        }
                      } catch (e: any) {
                        alert(`Error deleting: ${e.message}`);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Article</span>
                  </button>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
