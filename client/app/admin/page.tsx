"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Unlock,
  Mail,
  Trophy,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Eye,
  FileText,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Lead {
  id: number;
  visitor_name: string;
  email: string;
  message: string;
  project_scope: string;
  status: "pending" | "reviewed" | "contacted" | "archived";
  notes?: string;
  created_at: string;
}

interface Achievement {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
  proof_url?: string;
  icon?: string;
  tags: string[];
  is_featured: boolean;
  created_at?: string;
}

interface Blog {
  id: string;
  title: string;
  summary: string;
  content?: string;
  cover_image?: string;
  external_url?: string;
  tags: string[];
  read_time?: string;
  is_published: boolean;
  views?: number;
  published_at?: string;
}

import { API_V1 } from "@/lib/api-config";

const API_BASE = API_V1;

export default function AdminPortalPage() {
  const [passkey, setPasskey] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"inbox" | "achievements" | "blogs">("inbox");
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [leadFilter, setLeadFilter] = useState<string>("all");

  // Achievement Modal / Form State
  const [isAchModalOpen, setIsAchModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<Partial<Achievement> | null>(null);

  // Blog Editor State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);
  const [blogPreviewMode, setBlogPreviewMode] = useState(false);

  const [copiedEmailId, setCopiedEmailId] = useState<number | null>(null);

  // Load session token on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("mihir_admin_token");
    if (saved) {
      setToken(saved);
      loadAllAdminData(saved);
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch(`${API_BASE}/admin/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: passkey.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        sessionStorage.setItem("mihir_admin_token", data.token);
        loadAllAdminData(data.token);
      } else {
        setAuthError("Access Denied: Invalid Administrative Passkey.");
      }
    } catch (err) {
      setAuthError("Server unreachable. Please ensure the FastAPI backend is running.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("mihir_admin_token");
    setToken(null);
    setPasskey("");
  };

  const loadAllAdminData = async (activeToken: string) => {
    setIsLoading(true);
    const headers = { "X-Admin-Key": activeToken };
    try {
      const [rLeads, rAch, rBlogs] = await Promise.all([
        fetch(`${API_BASE}/admin/leads`, { headers }),
        fetch(`${API_BASE}/admin/achievements`, { headers }),
        fetch(`${API_BASE}/admin/blogs`, { headers }),
      ]);

      if (rLeads.ok) setLeads(await rLeads.json());
      if (rAch.ok) setAchievements(await rAch.json());
      if (rBlogs.ok) setBlogs(await rBlogs.json());
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Lead Actions
  const handleUpdateLeadStatus = async (id: number, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": token,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus as any } : l))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!token || !confirm("Are you sure you want to permanently delete this lead?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/leads/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": token },
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyEmailToClipboard = (id: number, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  // Achievement Save
  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingAch?.title || !editingAch?.description) return;

    try {
      const isEdit = !!editingAch.id && achievements.some((a) => a.id === editingAch.id);
      const url = isEdit
        ? `${API_BASE}/admin/achievements/${editingAch.id}`
        : `${API_BASE}/admin/achievements`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": token,
        },
        body: JSON.stringify({
          ...editingAch,
          tags: Array.isArray(editingAch.tags)
            ? editingAch.tags
            : (editingAch.tags as any || "").split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsAchModalOpen(false);
        setEditingAch(null);
        loadAllAdminData(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!token || !confirm(`Delete achievement '${id}'?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/achievements/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": token },
      });
      if (res.ok) {
        setAchievements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Blog Save
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingBlog?.title || !editingBlog?.summary) return;

    try {
      const isEdit = !!editingBlog.id && blogs.some((b) => b.id === editingBlog.id);
      const url = isEdit
        ? `${API_BASE}/admin/blogs/${editingBlog.id}`
        : `${API_BASE}/admin/blogs`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": token,
        },
        body: JSON.stringify({
          ...editingBlog,
          tags: Array.isArray(editingBlog.tags)
            ? editingBlog.tags
            : (editingBlog.tags as any || "").split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsBlogModalOpen(false);
        setEditingBlog(null);
        loadAllAdminData(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!token || !confirm(`Delete blog post '${id}'?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/blogs/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": token },
      });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Unauthenticated Gate Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl bg-[#09090b] border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 text-red-300">
            <Lock className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-black">// MIHIR.ADMIN_AUTH</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight uppercase mb-2">
            Restricted Root Terminal
          </h1>
          <p className="text-xs text-white/50 mb-8 leading-relaxed">
            Administrative access only. Enter the master passkey to manage visitor inquiries, achievements, and engineering articles.
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2 font-bold">
                Passkey Authorization
              </label>
              <input
                type="password"
                placeholder="Enter master passkey..."
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-red-300 transition-colors"
                autoFocus
              />
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs"
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-sans font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-red-300 transition-colors disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Unlock Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Filtered Leads
  const filteredLeads = leads.filter((l) =>
    leadFilter === "all" ? true : l.status === leadFilter
  );
  const pendingCount = leads.filter((l) => l.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans selection:bg-red-300 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300 animate-pulse" />
          <div>
            <div className="text-xs font-mono font-bold text-red-300 uppercase tracking-widest">
              // MIHIR.ADMIN_ROOT v2.6
            </div>
            <div className="text-[10px] font-mono text-white/40 uppercase">
              Database: PostgreSQL Render (portfolio_p7sm)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => loadAllAdminData(token)}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
          >
            Lock Session
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-[#0d0d12] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Visitor Leads</span>
              <Mail className="w-5 h-5 text-red-300" />
            </div>
            <div className="text-3xl font-black text-white">{leads.length}</div>
            <div className="text-xs text-red-300 mt-1 font-mono">{pendingCount} pending review</div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0d12] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Achievements</span>
              <Trophy className="w-5 h-5 text-red-300" />
            </div>
            <div className="text-3xl font-black text-white">{achievements.length}</div>
            <div className="text-xs text-white/40 mt-1 font-mono">
              {achievements.filter((a) => a.is_featured).length} featured on portfolio
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0d12] border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">Blogs & Thoughts</span>
              <BookOpen className="w-5 h-5 text-red-300" />
            </div>
            <div className="text-3xl font-black text-white">{blogs.length}</div>
            <div className="text-xs text-white/40 mt-1 font-mono">
              {blogs.filter((b) => b.is_published).length} published live
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-8">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "inbox"
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Inquiries Inbox</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "achievements"
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Achievements ({achievements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("blogs")}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "blogs"
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Blogs & Thoughts ({blogs.length})</span>
          </button>
        </div>

        {/* TAB 1: INQUIRIES INBOX */}
        {activeTab === "inbox" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {["all", "pending", "contacted", "reviewed", "archived"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLeadFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      leadFilter === st
                        ? "bg-red-300 text-black font-bold"
                        : "bg-white/5 text-white/50 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-white/40">Showing {filteredLeads.length} leads</span>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="p-16 text-center rounded-2xl bg-[#0a0a0e] border border-white/10 text-white/40 font-mono text-sm">
                No inquiries matching filter '{leadFilter}'.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-[#0c0c11] border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-white text-base">{lead.visitor_name}</span>
                        <button
                          onClick={() => copyEmailToClipboard(lead.id, lead.email)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs font-mono text-red-300 transition-colors cursor-pointer"
                        >
                          {copiedEmailId === lead.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{lead.email}</span>
                            </>
                          )}
                        </button>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                            lead.status === "pending"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : lead.status === "contacted"
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {lead.status}
                        </span>
                        <span className="text-[10px] font-mono text-white/30">
                          {lead.created_at ? new Date(lead.created_at).toLocaleString() : ""}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-white/50">
                        Scope: <span className="text-white/80">{lead.project_scope}</span>
                      </div>

                      <p className="text-sm text-white/80 whitespace-pre-wrap bg-black/40 p-4 rounded-xl border border-white/5 font-sans leading-relaxed">
                        {lead.message}
                      </p>
                    </div>

                    <div className="flex md:flex-col items-center gap-2 flex-shrink-0">
                      {lead.status !== "contacted" && (
                        <button
                          onClick={() => handleUpdateLeadStatus(lead.id, "contacted")}
                          className="px-3 py-1.5 rounded-lg bg-green-950/40 hover:bg-green-900/60 border border-green-500/30 text-green-300 text-xs font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
                        >
                          Mark Contacted
                        </button>
                      )}
                      {lead.status !== "reviewed" && (
                        <button
                          onClick={() => handleUpdateLeadStatus(lead.id, "reviewed")}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS MANAGER */}
        {activeTab === "achievements" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Career Milestones & Achievements</h2>
              <button
                onClick={() => {
                  setEditingAch({
                    title: "",
                    category: "Research",
                    date: "2026",
                    description: "",
                    proof_url: "",
                    icon: "trophy",
                    tags: [],
                    is_featured: true,
                  });
                  setIsAchModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-300 text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Achievement</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-6 rounded-2xl bg-[#0c0c11] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-300/10 text-red-300 text-[10px] font-mono uppercase font-bold border border-red-300/20">
                        {ach.category}
                      </span>
                      <span className="text-xs font-mono text-white/40">{ach.date}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{ach.title}</h3>
                    <p className="text-xs text-white/60 leading-relaxed">{ach.description}</p>

                    {ach.tags && ach.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {ach.tags.map((t, idx) => (
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

                  <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6">
                    {ach.proof_url ? (
                      <a
                        href={ach.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-red-300 hover:underline flex items-center gap-1"
                      >
                        <span>View Proof / Repo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingAch(ach);
                          setIsAchModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAchievement(ach.id)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BLOGS & THOUGHTS */}
        {activeTab === "blogs" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Engineering Thoughts & Articles</h2>
              <button
                onClick={() => {
                  setEditingBlog({
                    title: "",
                    summary: "",
                    content: "",
                    cover_image: "",
                    external_url: "",
                    tags: [],
                    read_time: "3 min read",
                    is_published: true,
                  });
                  setBlogPreviewMode(false);
                  setIsBlogModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-300 text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write Blog / Thought</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl bg-[#0c0c11] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between overflow-hidden"
                >
                  {b.cover_image && (
                    <div className="h-40 w-full overflow-hidden bg-black/50 relative">
                      <img
                        src={b.cover_image}
                        alt={b.title}
                        className="w-full h-full object-cover brightness-90 hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          b.is_published ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {b.is_published ? "Published" : "Draft"}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">{b.read_time || "3 min read"}</span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-2">{b.title}</h3>
                    <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">{b.summary}</p>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between border-t border-white/5 mt-4 pt-4">
                    <span className="text-[10px] font-mono text-white/40">{b.views || 0} views</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBlog(b);
                          setBlogPreviewMode(false);
                          setIsBlogModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(b.id)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ACHIEVEMENT MODAL */}
      <AnimatePresence>
        {isAchModalOpen && editingAch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-[#0c0c11] border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto font-sans"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">
                  {editingAch.id ? "Edit Achievement" : "Add Achievement / Milestone"}
                </h3>
                <button
                  onClick={() => setIsAchModalOpen(false)}
                  className="text-white/40 hover:text-white text-xs font-mono"
                >
                  [ESC / CLOSE]
                </button>
              </div>

              <form onSubmit={handleSaveAchievement} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-white/60 block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Speech AI Research Fellow at CDAC"
                    value={editingAch.title || ""}
                    onChange={(e) => setEditingAch({ ...editingAch, title: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1">Category</label>
                    <select
                      value={editingAch.category || "Research"}
                      onChange={(e) => setEditingAch({ ...editingAch, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                    >
                      <option value="Research">Research</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Open Source">Open Source</option>
                      <option value="Milestone">Milestone</option>
                      <option value="Certification">Certification</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1">Date / Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026 or Aug 2025"
                      value={editingAch.date || ""}
                      onChange={(e) => setEditingAch({ ...editingAch, date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Key impact, technical innovations, algorithms used..."
                    value={editingAch.description || ""}
                    onChange={(e) => setEditingAch({ ...editingAch, description: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Proof URL / GitHub Repo Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={editingAch.proof_url || ""}
                    onChange={(e) => setEditingAch({ ...editingAch, proof_url: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="PyTorch, Wav2Vec2, Speech AI"
                    value={Array.isArray(editingAch.tags) ? editingAch.tags.join(", ") : editingAch.tags || ""}
                    onChange={(e) => setEditingAch({ ...editingAch, tags: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={editingAch.is_featured ?? true}
                    onChange={(e) => setEditingAch({ ...editingAch, is_featured: e.target.checked })}
                    className="rounded border-white/20"
                  />
                  <label htmlFor="is_featured" className="text-white/80 cursor-pointer">
                    Feature on Portfolio Timeline
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAchModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-red-300 text-black font-bold hover:bg-white transition-colors"
                  >
                    Save Achievement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BLOG / THOUGHT MODAL */}
      <AnimatePresence>
        {isBlogModalOpen && editingBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl p-6 rounded-3xl bg-[#0c0c11] border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto font-sans"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">
                    {editingBlog.id ? "Edit Blog Post" : "Publish Engineering Thought"}
                  </h3>
                  <div className="flex items-center bg-black rounded-lg p-0.5 border border-white/10 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => setBlogPreviewMode(false)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        !blogPreviewMode ? "bg-red-300 text-black font-bold" : "text-white/50"
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlogPreviewMode(true)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        blogPreviewMode ? "bg-red-300 text-black font-bold" : "text-white/50"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsBlogModalOpen(false)}
                  className="text-white/40 hover:text-white text-xs font-mono"
                >
                  [ESC / CLOSE]
                </button>
              </div>

              {!blogPreviewMode ? (
                <form onSubmit={handleSaveBlog} className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-white/60 block mb-1">Post Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Architecting GraphRAG Copilots with AST Code Maps"
                      value={editingBlog.title || ""}
                      onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-white/60 block mb-1">Executive Summary *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Short teaser or overview for social cards and listings..."
                      value={editingBlog.summary || ""}
                      onChange={(e) => setEditingBlog({ ...editingBlog, summary: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 block mb-1">Cover Image URL</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={editingBlog.cover_image || ""}
                        onChange={(e) => setEditingBlog({ ...editingBlog, cover_image: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 block mb-1">External Link (Optional)</label>
                      <input
                        type="url"
                        placeholder="e.g. Medium, Substack or Dev.to URL"
                        value={editingBlog.external_url || ""}
                        onChange={(e) => setEditingBlog({ ...editingBlog, external_url: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 block mb-1">Full Markdown Content</label>
                    <textarea
                      rows={8}
                      placeholder="# Your engineering thoughts, code blocks, diagrams..."
                      value={editingBlog.content || ""}
                      onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none font-mono leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 block mb-1">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="AI Agents, GraphRAG, Architecture"
                        value={Array.isArray(editingBlog.tags) ? editingBlog.tags.join(", ") : editingBlog.tags || ""}
                        onChange={(e) => setEditingBlog({ ...editingBlog, tags: e.target.value as any })}
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 block mb-1">Read Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 4 min read"
                        value={editingBlog.read_time || "3 min read"}
                        onChange={(e) => setEditingBlog({ ...editingBlog, read_time: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white focus:border-red-300 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={editingBlog.is_published ?? true}
                      onChange={(e) => setEditingBlog({ ...editingBlog, is_published: e.target.checked })}
                      className="rounded border-white/20"
                    />
                    <label htmlFor="is_published" className="text-white/80 cursor-pointer">
                      Publish immediately to public `/blogs`
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsBlogModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-red-300 text-black font-bold hover:bg-white transition-colors"
                    >
                      Save & Publish
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 py-4">
                  <h1 className="text-2xl font-bold text-white">{editingBlog.title || "Untitled Post"}</h1>
                  <p className="text-sm text-white/60 italic">{editingBlog.summary}</p>
                  {editingBlog.cover_image && (
                    <img
                      src={editingBlog.cover_image}
                      alt="Cover"
                      className="w-full h-48 object-cover rounded-xl border border-white/10"
                    />
                  )}
                  <div className="p-6 rounded-2xl bg-black/60 border border-white/10">
                    <MarkdownRenderer content={editingBlog.content || "No markdown body provided."} />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
